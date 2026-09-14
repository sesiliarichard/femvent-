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
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-bold text-gray-700">
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
        <div className="min-h-screen bg-gray-50">
          <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => router.push(`/events/${eventId}`)}
                  className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
                    <span className="text-sm font-bold text-gray-500">{event?.title}</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">
                    Venue Map
                  </h1>
                </div>
                {isEventOwner && !showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Area</span>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 ml-14">
                Use the arrows to control the order areas appear in the app.
              </p>
            </div>

            {/* Create / Edit form */}
            {showForm && (
              <div className="bg-white rounded-2xl border border-gray-200 p-7 mb-7">
                <h2 className="text-lg font-extrabold text-gray-900 mb-5">
                  {editingId ? 'Edit Area' : 'Add Area'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Main Auditorium"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Floor</label>
                    <input
                      type="text"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="e.g. Ground Floor"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 transition-colors"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Icon</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 bg-white transition-colors"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-5">
                  <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Area'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            {areas.length === 0 && !showForm ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
                <div className="w-14 h-14 mb-4 mx-auto bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
                </div>
                <p className="text-lg font-extrabold text-gray-900 mb-1.5">No areas yet</p>
                <p className="text-gray-500 text-sm">Add rooms and areas so attendees can find their way around.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {areas.map((a, idx) => {
                  return (
                    <div
                      key={a.id}
                      className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4"
                    >
                      {isEventOwner && (
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveArea(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-20 disabled:hover:text-gray-400 transition-colors"
                            title="Move up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveArea(idx, 1)}
                            disabled={idx === areas.length - 1}
                            className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-20 disabled:hover:text-gray-400 transition-colors"
                            title="Move down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <div className="w-11 h-11 flex-shrink-0 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                        {ICON_SVGS[a.icon] || ICON_SVGS['location-outline']}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-extrabold text-gray-900">{a.name}</h3>
                        {a.floor && <p className="text-sm text-gray-500">{a.floor}</p>}
                      </div>

                      {isEventOwner && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => startEdit(a)}
                            className="p-2.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-2.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}