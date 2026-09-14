/**
 * EVENT EXHIBITORS MANAGEMENT (/events/[id]/exhibitors)
 * Host creates/edits/deletes exhibitors that attendees see in the app
 */
'use client';

import React, { use, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Exhibitor {
  id: string;
  event_id: string;
  name: string;
  booth: string | null;
  category: string | null;
  description: string | null;
  website: string | null;
  created_at: string;
}

export default function ExhibitorsManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const { userProfile } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [booth, setBooth] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    fetchEventAndExhibitors();
  }, [eventId]);

  async function fetchEventAndExhibitors() {
    setLoading(true);
    const [{ data: eventData }, { data: exhibitorData, error }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
      supabase
        .from('exhibitors')
        .select('*')
        .eq('event_id', eventId)
        .order('booth', { ascending: true }),
    ]);

    if (error) console.error('Error loading exhibitors:', error);
    setEvent(eventData);
    setExhibitors(exhibitorData || []);
    setLoading(false);
  }

  const isEventOwner = userProfile?.id === event?.host_id;

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setBooth('');
    setCategory('');
    setDescription('');
    setWebsite('');
    setShowForm(false);
  };

  const startEdit = (ex: Exhibitor) => {
    setEditingId(ex.id);
    setName(ex.name);
    setBooth(ex.booth || '');
    setCategory(ex.category || '');
    setDescription(ex.description || '');
    setWebsite(ex.website || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name,
        booth: booth || null,
        category: category || null,
        description: description || null,
        website: website || null,
      };

      if (editingId) {
        const { error } = await supabase.from('exhibitors').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('exhibitors').insert({ event_id: eventId, ...payload });
        if (error) throw error;
      }
      resetForm();
      fetchEventAndExhibitors();
    } catch (error) {
      console.error('Error saving exhibitor:', error);
      alert('Failed to save exhibitor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exhibitor? This cannot be undone.')) return;
    const { error } = await supabase.from('exhibitors').delete().eq('id', id);
    if (error) {
      console.error('Error deleting exhibitor:', error);
      alert('Failed to delete exhibitor.');
      return;
    }
    setExhibitors((prev) => prev.filter((ex) => ex.id !== id));
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
                Loading exhibitors...
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
              <div className="flex items-center gap-4 mb-6">
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
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                    <span className="text-sm font-bold text-gray-500">{event?.title}</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">
                    Exhibitors
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
                    <span>Add Exhibitor</span>
                  </button>
                )}
              </div>
            </div>

            {/* Create / Edit form */}
            {showForm && (
              <div className="bg-white rounded-2xl border border-gray-200 p-7 mb-7">
                <h2 className="text-lg font-extrabold text-gray-900 mb-5">
                  {editingId ? 'Edit Exhibitor' : 'Add Exhibitor'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. TechCorp Africa"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Booth</label>
                    <input
                      type="text"
                      value={booth}
                      onChange={(e) => setBooth(e.target.value)}
                      placeholder="e.g. A1"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Technology"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Website</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What does this exhibitor offer?"
                      rows={3}
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 resize-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-5">
                  <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Exhibitor'}
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
            {exhibitors.length === 0 && !showForm ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
                <div className="w-14 h-14 mb-4 mx-auto bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                </div>
                <p className="text-lg font-extrabold text-gray-900 mb-1.5">No exhibitors yet</p>
                <p className="text-gray-500 text-sm">Add exhibitors and attendees will see them in the app.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exhibitors.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-white rounded-2xl border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 flex-shrink-0 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-extrabold text-sm">
                          {ex.booth || '—'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-extrabold text-gray-900">{ex.name}</h3>
                          {ex.category && (
                            <span className="inline-block text-xs font-bold text-secondary-600 mb-1.5">{ex.category}</span>
                          )}
                          {ex.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">{ex.description}</p>
                          )}
                          {ex.website && (
                            <a
                              href={ex.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 mt-2 hover:underline"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>Visit website
                            </a>
                          )}
                        </div>
                      </div>

                      {isEventOwner && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => startEdit(ex)}
                            className="p-2.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(ex.id)}
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}