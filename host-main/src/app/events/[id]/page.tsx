/**
 * ENHANCED EVENT DETAIL PAGE (/events/[id])
 * Premium event detail view with comprehensive information display
 */
'use client';

import React, { use } from 'react';
import { supabase } from '@/lib/supabase';
import { notFound, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import SaveAsTemplateModal from '@/components/SaveAsTemplateModal';
import CloneEventModal from '@/components/CloneEventModal';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const { userProfile } = useAuth();
  const router = useRouter();
  const [event, setEvent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showTemplateModal, setShowTemplateModal] = React.useState(false);
  const [showCloneModal, setShowCloneModal] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);

  React.useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();

        if (error) throw error;
        setEvent(data);
      } catch (error) {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

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
                Loading event...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!event) return notFound();

  const formatDate = (value: any) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'Conference': (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      ),
      'Workshop': (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766m-3.704 3.796l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
        </svg>
      ),
      'Meetup': (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      ),
      'Webinar': (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
      ),
      'Exhibition': (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008zM4.5 20.25h15a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5h-15a1.5 1.5 0 00-1.5 1.5v13.5a1.5 1.5 0 001.5 1.5z" />
        </svg>
      ),
      'Networking': (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
        </svg>
      ),
    };
    return icons[type] || (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    );
  };

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Conference': 'from-blue-500 to-cyan-500',
      'Workshop': 'from-purple-500 to-pink-500',
      'Meetup': 'from-emerald-500 to-teal-500',
      'Webinar': 'from-orange-500 to-red-500',
      'Exhibition': 'from-violet-500 to-purple-500',
      'Networking': 'from-amber-500 to-orange-500',
    };
    return colors[type] || 'from-blue-500 to-purple-500';
  };

  const registrationLink =
    event.registration_url ||
    `${process.env.NEXT_PUBLIC_ATTENDEE_SITE_URL || ''}/events/${eventId}/register`;

  const copyRegistrationLink = () => {
    navigator.clipboard.writeText(registrationLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const isEventOwner = userProfile?.id === event.host_id;

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="events">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative z-10 p-8">
            <div className="mb-10 animate-[fadeIn_0.8s_ease-out]">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => router.back()}
                  className="group p-3 hover:bg-white/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-slate-200/50"
                >
                  <svg className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                                        <span className="w-10 h-10 flex items-center justify-center text-slate-700">{getEventTypeIcon(event.type)}</span>
                    <span className={`px-4 py-2 rounded-full text-sm font-black text-white bg-gradient-to-r ${getEventTypeColor(event.type)} shadow-lg`}>
                      {event.type}
                    </span>
                    {event.multi_day && (
                      <span className="px-4 py-2 rounded-full text-sm font-black text-purple-700 bg-purple-100 border-2 border-purple-300">
                        Multi-Day Event
                      </span>
                    )}
                  </div>
                  <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
                    {event.title}
                  </h1>
                </div>
                {isEventOwner && (
                  <div className="flex gap-3">
                    <button
                      onClick={copyRegistrationLink}
                      className="group flex items-center gap-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-rose-500/40 hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
                      </svg>
                      <span>{linkCopied ? 'Link Copied!' : 'Copy Registration Link'}</span>
                    </button>
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="group flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Save as Template</span>
                    </button>
                    <button
                      onClick={() => setShowCloneModal(true)}
                      className="group flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Clone Event</span>
                    </button>
                    <button
                      onClick={() => router.push(`/events/${eventId}/edit`)}
                      className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Event</span>
                    </button>
                  </div>
                )}
              </div>

              {isEventOwner && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push(`/events/${eventId}/announcements`)}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white hover:shadow-md hover:scale-105 transition-all duration-300"
                  >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg><span>Announcements</span>
                  </button>
                  <button
                    onClick={() => router.push(`/events/${eventId}/exhibitors`)}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white hover:shadow-md hover:scale-105 transition-all duration-300"
                  >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg><span>Exhibitors</span>
                  </button>
                  <button
                    onClick={() => router.push(`/events/${eventId}/venue-map`)}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white hover:shadow-md hover:scale-105 transition-all duration-300"
                  >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg><span>Venue Map</span>
                  </button>
                  <button
                    onClick={() => router.push(`/events/${eventId}/feedback`)}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white hover:shadow-md hover:scale-105 transition-all duration-300"
                  >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.98 21.539a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg><span>Feedback</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {event.poster_url && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden animate-[fadeIn_0.5s_ease-out]">
                    <img src={event.poster_url} alt={event.title} className="w-full h-96 object-cover" />
                  </div>
                )}

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.1s_backwards]">
                  <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></span>
                    About This Event
                  </h2>
                  <p className="text-lg text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>

                {event.speakers && event.speakers.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.2s_backwards]">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg></span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {event.speakers.map((speaker: any, idx: number) => (
                        <div key={idx} className="group bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                              {speaker.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-black text-slate-900 mb-1">{speaker.name}</h3>
                              <p className="text-sm font-bold text-purple-600 mb-2">{speaker.title}</p>
                              {speaker.company && <p className="text-sm text-slate-600 font-medium mb-2">{speaker.company}</p>}
                              {speaker.bio && <p className="text-sm text-slate-600 font-medium">{speaker.bio}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {event.agenda && event.agenda.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.3s_backwards]">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg></span>
                      Event Agenda
                    </h2>
                    <div className="space-y-4">
                      {event.agenda.map((item: any, idx: number) => {
                        const time = new Date(item.time);
                        return (
                          <div key={idx} className="group flex gap-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex flex-col items-center justify-center text-white shadow-lg">
                                <span className="text-2xl font-black">
                                  {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                                </span>
                                {item.duration && <span className="text-xs font-bold opacity-90">{item.duration}</span>}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-black text-slate-900 mb-2">{item.title}</h3>
                              {item.speaker && <p className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>{item.speaker}</p>}
                              {item.description && <p className="text-sm text-slate-600 font-medium">{item.description}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {event.partners && event.partners.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.4s_backwards]">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg></span>
                      Event Partners
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.partners.map((partner: any, idx: number) => (
                        <a
                        key={idx}
                        href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg mb-3">
                            {partner.name.charAt(0)}
                          </div>
                          <p className="text-center text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors">{partner.name}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 sticky top-8 animate-[fadeIn_0.5s_ease-out_0.1s_backwards]">
                  <h2 className="text-2xl font-black text-slate-900 mb-6">Event Details</h2>

                  <div className="space-y-6">
                    <div className="pb-6 border-b-2 border-slate-100">
                      <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg></div>
                        <div>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Start Date</p>
                          <p className="text-sm font-bold text-slate-900">{formatDate(event.start_at)}</p>
                        </div>
                      </div>
                      {event.multi_day && event.end_at && (
                        <div className="flex items-start gap-4 mt-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M6 3v12m6-12v8m6-8v4" /></svg></div>
                          <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">End Date</p>
                            <p className="text-sm font-bold text-slate-900">{formatDate(event.end_at)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {event.venue && (
                      <div className="pb-6 border-b-2 border-slate-100">
                        <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg></div>
                          <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Location</p>
                            <p className="text-sm font-bold text-slate-900">{event.venue?.name || event.venue}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {event.capacity && (
                      <div className="pb-6 border-b-2 border-slate-100">
                        <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg></div>
                          <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Capacity</p>
                            <p className="text-sm font-bold text-slate-900">{event.capacity} attendees</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {event.price_options && event.price_options.length > 0 && (
                      <div className="pb-6 border-b-2 border-slate-100">
                        <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                          <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Price</p>
                            <p className="text-sm font-bold text-slate-900">
                              {event.price_options[0].price === 0 ? 'Free' : `$${event.price_options[0].price}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
          {event.registration_url && (
                      <a
                      href={event.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
                      >
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span>Register Now</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.2s_backwards]">
                  <h2 className="text-xl font-black text-slate-900 mb-4">Share Event</h2>
                  <div className="flex gap-3">
                    <button className="flex-1 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 hover:scale-105 font-bold">Twitter</button>
                    <button className="flex-1 p-4 bg-blue-800 text-white rounded-xl hover:bg-blue-900 transition-all duration-300 hover:scale-105 font-bold">Facebook</button>
                    <button className="flex-1 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 hover:scale-105 font-bold">WhatsApp</button>
                  </div>
                </div>
              </div>
            </div>
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

        <SaveAsTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          eventData={{ ...event, id: eventId }}
          onSave={async (templateData) => {
            console.log('Saving template:', templateData);
          }}
        />

        <CloneEventModal
          isOpen={showCloneModal}
          onClose={() => setShowCloneModal(false)}
          eventId={eventId}
          eventTitle={event?.title || ''}
          onCloneSuccess={(newEventId) => {
            router.push(`/events/${newEventId}`);
          }}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}