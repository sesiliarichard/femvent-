/**
 * EVENT VENUE MAP EDITOR (/events/[id]/venue-map)
 * Host creates/edits/deletes/reorders venue areas that attendees see in the app
 */
'use client';

import React, { use, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

interface VenueArea {
  id: string;
  event_id: string;
  name: string;
  floor: string | null;
  icon: string;
  sort_order: number;
}

// Keep this list in sync with the icon names used in app-main's VenueMapScreen (Ionicons)
const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'mic-outline', label: 'Stage / Auditorium' },
  { value: 'easel-outline', label: 'Workshop Room' },
  { value: 'storefront-outline', label: 'Exhibitor Hall' },
  { value: 'cafe-outline', label: 'Lounge / Cafe' },
  { value: 'clipboard-outline', label: 'Registration Desk' },
  { value: 'location-outline', label: 'Other' },
];

// SVG icons for area cards — kept separate since <option> can't render SVG, only the plain labels above
const ICON_SVGS: Record<string, React.ReactNode> = {
  'mic-outline': <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>,
  'easel-outline': <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008zM4.5 20.25h15a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5h-15a1.5 1.5 0 00-1.5 1.5v13.5a1.5 1.5 0 001.5 1.5z" /></svg>,
  'storefront-outline': <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.622 1.663a3.001 3.001 0 01-.622 4.72" /></svg>,
  'cafe-outline': <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0v6a2.25 2.25 0 002.25 2.25h13.5a2.25 2.25 0 002.25-2.25v-6m-19.5 0h19.5M12 6.75V4.5m0 2.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" /></svg>,
  'clipboard-outline': <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
  'location-outline': <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
};

export default function VenueMapEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const { userProfile } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [areas, setAreas] = useState<VenueArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [floor, setFloor] = useState('');
  const [icon, setIcon] = useState(ICON_OPTIONS[0].value);

  useEffect(() => {
    fetchEventAndAreas();
  }, [eventId]);

  async function fetchEventAndAreas() {
    setLoading(true);
    const [{ data: eventData }, { data: areaData, error }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
      supabase
        .from('venue_areas')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true }),
    ]);

    if (error) console.error('Error loading venue areas:', error);
    setEvent(eventData);
    setAreas(areaData || []);
    setLoading(false);
  }

  const isEventOwner = userProfile?.id === event?.host_id;

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setFloor('');
    setIcon(ICON_OPTIONS[0].value);
    setShowForm(false);
  };

  const startEdit = (a: VenueArea) => {
    setEditingId(a.id);
    setName(a.name);
    setFloor(a.floor || '');
    setIcon(a.icon || ICON_OPTIONS[0].value);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('venue_areas')
          .update({ name, floor: floor || null, icon })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('venue_areas').insert({
          event_id: eventId,
          name,
          floor: floor || null,
          icon,
          sort_order: areas.length,
        });
        if (error) throw error;
      }
      resetForm();
      fetchEventAndAreas();
    } catch (error) {
      console.error('Error saving venue area:', error);
      alert('Failed to save venue area. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this area? This cannot be undone.')) return;
    const { error } = await supabase.from('venue_areas').delete().eq('id', id);
    if (error) {
      console.error('Error deleting venue area:', error);
      alert('Failed to delete area.');
      return;
    }
    setAreas((prev) => prev.filter((a) => a.id !== id));
  };

  const moveArea = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= areas.length) return;

    const reordered = [...areas];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setAreas(reordered);

    // Persist new sort_order for both swapped rows
    const updates = [
      supabase.from('venue_areas').update({ sort_order: index }).eq('id', reordered[index].id),
      supabase.from('venue_areas').update({ sort_order: targetIndex }).eq('id', reordered[targetIndex].id),
    ];
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) {
      console.error('Error reordering venue areas');
      fetchEventAndAreas();
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout currentPage="events">
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Loading venue map...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="events">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="mb-10 animate-[fadeIn_0.8s_ease-out]">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => router.push(`/events/${eventId}`)}
                  className="group p-3 hover:bg-white/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-slate-200/50"
                >
                  <svg className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                  <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
                    <span className="text-sm font-bold text-slate-500">{event?.title}</span>
                  </div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Venue Map
                  </h1>
                </div>
                {isEventOwner && !showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
                  >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Area</span>
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-500 font-medium ml-16">
                Use the arrows to control the order areas appear in the app.
              </p>
            </div>

            {/* Create / Edit form */}
            {showForm && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 mb-8 animate-[fadeIn_0.4s_ease-out]">
                <h2 className="text-xl font-black text-slate-900 mb-6">
                  {editingId ? 'Edit Area' : 'Add Area'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Main Auditorium"
                      className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Floor</label>
                    <input
                      type="text"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="e.g. Ground Floor"
                      className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-medium text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Icon</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-medium text-slate-900 bg-white"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Area'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            {areas.length === 0 && !showForm ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-16 text-center">
                                <div className="w-16 h-16 mb-4 mx-auto text-slate-300"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg></div>
                <p className="text-xl font-black text-slate-900 mb-2">No areas yet</p>
                <p className="text-slate-500 font-medium">Add rooms and areas so attendees can find their way around.</p>
              </div>
            ) : (
              <div className="space-y-3">
                               {areas.map((a, idx) => {
                  return (
                    <div
                      key={a.id}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-lg p-5 flex items-center gap-4 animate-[fadeIn_0.5s_ease-out]"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      {isEventOwner && (
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveArea(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                            title="Move up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveArea(idx, 1)}
                            disabled={idx === areas.length - 1}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                            title="Move down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}

                     <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                        {ICON_SVGS[a.icon] || ICON_SVGS['location-outline']}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-black text-slate-900">{a.name}</h3>
                        {a.floor && <p className="text-sm text-slate-500 font-semibold">{a.floor}</p>}
                      </div>

                      {isEventOwner && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => startEdit(a)}
                            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-all duration-200"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <style jsx global>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
            }
            .animate-blob { animation: blob 7s infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
          `}</style>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}