/**
 * EVENT RESOURCES MANAGEMENT (/events/[id]/resources)
 * Host adds/edits/deletes resources (PDFs, slides, links) that attendees see in the app
 */
'use client';

import React, { use, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Resource {
  id: string;
  event_id: string;
  title: string;
  type: 'pdf' | 'slides' | 'link';
  url: string;
  size: string | null;
  created_at: string;
}

const typeLabel: Record<Resource['type'], string> = {
  pdf: 'PDF',
  slides: 'Slides',
  link: 'Link',
};

export default function ResourcesManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const { userProfile } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Resource['type']>('pdf');
  const [url, setUrl] = useState('');
  const [size, setSize] = useState('');

  useEffect(() => {
    fetchEventAndResources();
  }, [eventId]);

  async function fetchEventAndResources() {
    setLoading(true);
    const [{ data: eventData }, { data: resourceData, error }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
      supabase
        .from('resources')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false }),
    ]);

    if (error) console.error('Error loading resources:', error);
    setEvent(eventData);
    setResources(resourceData || []);
    setLoading(false);
  }

  const isEventOwner = userProfile?.id === event?.host_id;

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setType('pdf');
    setUrl('');
    setSize('');
    setShowForm(false);
  };

  const startEdit = (r: Resource) => {
    setEditingId(r.id);
    setTitle(r.title);
    setType(r.type);
    setUrl(r.url);
    setSize(r.size || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('resources')
          .update({ title, type, url, size: size || null })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('resources')
          .insert({ event_id: eventId, title, type, url, size: size || null, created_by: userProfile?.id });
        if (error) throw error;
      }
      resetForm();
      fetchEventAndResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Failed to save resource. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource? This cannot be undone.')) return;
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource.');
      return;
    }
    setResources((prev) => prev.filter((r) => r.id !== id));
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
              <p className="text-lg font-bold text-gray-700">Loading resources...</p>
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
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>
                    <span className="text-sm font-bold text-gray-500">{event?.title}</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">Resources</h1>
                </div>
                {isEventOwner && !showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Resource</span>
                  </button>
                )}
              </div>
            </div>

            {/* Create / Edit form */}
            {showForm && (
              <div className="bg-white rounded-2xl border border-gray-200 p-7 mb-7">
                <h2 className="text-lg font-extrabold text-gray-900 mb-5">
                  {editingId ? 'Edit Resource' : 'New Resource'}
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Workshop slides"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Type</label>
                    <div className="flex gap-3">
                      {(['pdf', 'slides', 'link'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                            type === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {typeLabel[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">URL</label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Size (optional)</label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. 2.4 MB"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-gray-900 transition-colors"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving || !title.trim() || !url.trim()}
                      className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Resource'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-6 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List */}
            {resources.length === 0 && !showForm ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
                <div className="w-14 h-14 mb-4 mx-auto bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>
                </div>
                <p className="text-lg font-extrabold text-gray-900 mb-1.5">No resources yet</p>
                <p className="text-gray-500 text-sm">Add PDFs, slides, or links for attendees to access in the app.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-primary-50 text-primary-600">
                            {typeLabel[r.type]}
                          </span>
                          {r.size && <span className="text-xs font-semibold text-gray-400">{r.size}</span>}
                        </div>
                        <h3 className="text-base font-extrabold text-gray-900 mb-1">{r.title}</h3>
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline break-all">
                          {r.url}
                        </a>
                      </div>

                      {isEventOwner && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => startEdit(r)}
                            className="p-2.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
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