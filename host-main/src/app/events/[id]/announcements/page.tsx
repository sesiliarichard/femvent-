/**
 * EVENT ANNOUNCEMENTS MANAGEMENT (/events/[id]/announcements)
 * Host creates/edits/deletes announcements that attendees see in the app
 */
'use client';

import React, { use, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Announcement {
  id: string;
  event_id: string;
  title: string;
  body: string;
  priority: 'normal' | 'urgent';
  created_at: string;
}

export default function AnnouncementsManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const { userProfile } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  useEffect(() => {
    fetchEventAndAnnouncements();
  }, [eventId]);

  async function fetchEventAndAnnouncements() {
    setLoading(true);
    const [{ data: eventData }, { data: announcementData, error }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
      supabase
        .from('announcements')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false }),
    ]);

    if (error) console.error('Error loading announcements:', error);
    setEvent(eventData);
    setAnnouncements(announcementData || []);
    setLoading(false);
  }

  const isEventOwner = userProfile?.id === event?.host_id;

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setPriority('normal');
    setShowForm(false);
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setTitle(a.title);
    setBody(a.body);
    setPriority(a.priority);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update({ title, body, priority })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({ event_id: eventId, title, body, priority, created_by: userProfile?.id });
        if (error) throw error;
      }
      resetForm();
      fetchEventAndAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Failed to save announcement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement? This cannot be undone.')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement.');
      return;
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
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
                Loading announcements...
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
                    <span className="text-3xl">📣</span>
                    <span className="text-sm font-bold text-slate-500">{event?.title}</span>
                  </div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Announcements
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
                    <span>New Announcement</span>
                  </button>
                )}
              </div>
            </div>

            {/* Create / Edit form */}
            {showForm && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 mb-8 animate-[fadeIn_0.4s_ease-out]">
                <h2 className="text-xl font-black text-slate-900 mb-6">
                  {editingId ? 'Edit Announcement' : 'New Announcement'}
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Venue change for Workshop B"
                      className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Message</label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="What do attendees need to know?"
                      rows={4}
                      className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none font-medium text-slate-900 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Priority</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPriority('normal')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                          priority === 'normal'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriority('urgent')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                          priority === 'urgent'
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        🚨 Urgent
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving || !title.trim() || !body.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Post Announcement'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-6 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List */}
            {announcements.length === 0 && !showForm ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-16 text-center">
                <div className="text-6xl mb-4">📣</div>
                <p className="text-xl font-black text-slate-900 mb-2">No announcements yet</p>
                <p className="text-slate-500 font-medium">Post updates and attendees will see them instantly in the app.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((a, idx) => (
                  <div
                    key={a.id}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-xl p-6 animate-[fadeIn_0.5s_ease-out]"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {a.priority === 'urgent' ? (
                            <span className="px-3 py-1 rounded-lg text-xs font-black bg-red-100 text-red-700">🚨 Urgent</span>
                          ) : (
                            <span className="px-3 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-700">Normal</span>
                          )}
                          <span className="text-xs font-semibold text-slate-400">{formatRelativeTime(a.created_at)}</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">{a.title}</h3>
                        <p className="text-slate-600 font-medium leading-relaxed">{a.body}</p>
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
                  </div>
                ))}
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