/**
 * EDIT EVENT PAGE (/events/[id]/edit)
 */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Speaker { name: string; title: string; company: string; bio: string; photoURL?: string; }
interface AgendaItem { time: Date; title: string; description: string; speaker: string; duration: string; }
interface Partner { name: string; website: string; logoURL?: string; }
interface VenueAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}
interface EventData {
  title: string;
  description: string;
  posterURL: string | null;
  type: string;
  multiDay: boolean;
  startAt: Date;
  endAt: Date;
  venue: string;
  venueAddress?: VenueAddress;
  capacity: string;
  priceText: string;
  registrationUrl: string;
  speakers: Speaker[];
  agenda: AgendaItem[];
  partners: Partner[];
}

interface TicketTier {
  id?: string;
  name: string;
  description: string;
  price: string;
}

type TabType = 'Basic' | 'Tickets' | 'Speakers' | 'Agenda' | 'Partners';

export default function EditEventPage() {
  const { userProfile } = useAuth();
  const params = useParams<{ id?: string | string[] }>();
  const eventId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '');
  }, [params]);
  const router = useRouter();

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="events">
        <EditEventContent userProfile={userProfile} eventId={eventId} router={router} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function EditEventContent({ userProfile, eventId, router }: { userProfile: any; eventId: string; router: any }) {
  const [eventData, setEventData] = useState<EventData>({
    title: '', description: '', posterURL: null, type: 'Conference', multiDay: false,
    startAt: new Date(), endAt: new Date(), venue: '', capacity: '', priceText: '', registrationUrl: '',
    speakers: [], agenda: [], partners: [],
  });
  const [activeTab, setActiveTab] = useState<TabType>('Basic');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);

  const addTicketTier = () => {
    setTicketTiers((prev) => [...prev, { name: '', description: '', price: '0' }]);
  };

  const removeTicketTier = (index: number) => {
    setTicketTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTicketTier = (index: number, field: keyof TicketTier, value: string) => {
    setTicketTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    );
  };

  const eventTypes = useMemo(() => [
    { value: 'Conference', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg> },
    { value: 'Workshop', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766m-3.704 3.796l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" /></svg> },
    { value: 'Meetup', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg> },
    { value: 'Webinar', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg> },
    { value: 'Exhibition', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008zM4.5 20.25h15a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5h-15a1.5 1.5 0 00-1.5 1.5v13.5a1.5 1.5 0 001.5 1.5z" /></svg> },
    { value: 'Networking', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" /></svg> }
  ], []);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'Basic', label: 'Basic Info', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> },
    { id: 'Tickets', label: 'Tickets', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h2a2 2 0 002-2 1 1 0 112 0 2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2h-2a2 2 0 00-2 2 1 1 0 11-2 0 2 2 0 00-2-2z" /></svg> },
    { id: 'Speakers', label: 'Speakers', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg> },
    { id: 'Agenda', label: 'Agenda', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> },
    { id: 'Partners', label: 'Partners', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg> },
  ];

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
        if (error || !data) return;
        setEventData({
          title: data.title || '',
          description: data.description || '',
          posterURL: data.poster_url || null,
          type: data.type || 'Conference',
          multiDay: Boolean(data.multi_day),
          startAt: data.event_date ? new Date(data.event_date) : new Date(),
          endAt: data.end_date ? new Date(data.end_date) : new Date(),
          venue: data.venue?.name || data.venue?.city || (typeof data.venue === 'string' ? data.venue : ''),
          venueAddress: data.venue?.address ? {
            street: data.venue.address.street || '',
            city: data.venue.address.city || '',
            state: data.venue.address.state || '',
            zipCode: data.venue.address.zipCode || '',
            country: data.venue.address.country || '',
            latitude: data.venue.coordinates?.latitude,
            longitude: data.venue.coordinates?.longitude,
          } : undefined,
          capacity: data.capacity ? String(data.capacity) : '',
          priceText: data.price ? String(data.price) : '',
          registrationUrl: data.registration_url || '',
          speakers: Array.isArray(data.speakers) ? data.speakers : [],
          agenda: Array.isArray(data.agenda) ? data.agenda.map((it: any) => ({ ...it, time: it.time ? new Date(it.time) : new Date() })) : [],
          partners: Array.isArray(data.partners) ? data.partners : [],
        });

        const { data: tiers } = await supabase
          .from('ticket_types')
          .select('id, name, description, price')
          .eq('event_id', eventId)
          .order('sort_order', { ascending: true });

        if (tiers && tiers.length > 0) {
          setTicketTiers(
            tiers.map((t: any) => ({
              id: t.id,
              name: t.name || '',
              description: t.description || '',
              price: t.price != null ? String(t.price) : '0',
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);
  const updateEventData = useCallback((u: Partial<EventData>) => setEventData((p) => ({ ...p, ...u })), []);

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const uploadFile = async (file: File, path: string) => {
    setUploading(true);
    try {
      const filePath = `events/${eventId}/${path}`;
      const { error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };
  const onPosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await uploadFile(f, `poster-${Date.now()}.jpg`);
    updateEventData({ posterURL: url });
  };

  const onSpeakerPhotoChange = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadFile(f, `speaker-${i}-${Date.now()}.jpg`);
      const next = [...eventData.speakers];
      next[i] = { ...next[i], photoURL: url };
      updateEventData({ speakers: next });
    } catch (error) {
      alert('Photo upload failed. Please try again.');
    }
  };

  const onPartnerLogoChange = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadFile(f, `partner-${i}-${Date.now()}.jpg`);
      const next = [...eventData.partners];
      next[i] = { ...next[i], logoURL: url };
      updateEventData({ partners: next });
    } catch (error) {
      alert('Logo upload failed. Please try again.');
    }
  };

  const addSpeaker = () => updateEventData({ speakers: [...eventData.speakers, { name: '', title: '', company: '', bio: '' }] });
  const updateSpeaker = (i: number, field: keyof Speaker, value: string) => {
    const next = [...eventData.speakers];
    next[i] = { ...next[i], [field]: value };
    updateEventData({ speakers: next });
  };
  const removeSpeaker = (i: number) => updateEventData({ speakers: eventData.speakers.filter((_, idx) => idx !== i) });

  const getEventDays = (): Date[] => {
    const days: Date[] = [];
    const start = new Date(eventData.startAt);
    start.setHours(0, 0, 0, 0);
    const end = eventData.multiDay ? new Date(eventData.endAt) : new Date(eventData.startAt);
    end.setHours(0, 0, 0, 0);

    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days.length > 0 ? days : [start];
  };

  const addAgendaItem = () => {
    const lastItem = eventData.agenda[eventData.agenda.length - 1];
    const defaultTime = lastItem ? new Date(lastItem.time) : new Date(eventData.startAt);
    updateEventData({ agenda: [...eventData.agenda, { time: defaultTime, title: '', description: '', speaker: '', duration: '' }] });
  };
  const updateAgendaItem = (i: number, field: keyof AgendaItem, value: any) => {
    const next = [...eventData.agenda];
    next[i] = { ...next[i], [field]: value };
    updateEventData({ agenda: next });
  };
  const removeAgendaItem = (i: number) => updateEventData({ agenda: eventData.agenda.filter((_, idx) => idx !== i) });

  const addPartner = () => updateEventData({ partners: [...eventData.partners, { name: '', website: '' }] });
  const updatePartner = (i: number, field: keyof Partner, value: string) => {
    const next = [...eventData.partners];
    next[i] = { ...next[i], [field]: value };
    updateEventData({ partners: next });
  };
  const removePartner = (i: number) => updateEventData({ partners: eventData.partners.filter((_, idx) => idx !== i) });

  const validate = () => {
    const errs: any = {};
    if (!eventData.title.trim()) errs.title = 'Title is required';
    if (!eventData.description.trim()) errs.description = 'Description is required';
    if (eventData.registrationUrl && !/^https?:\/\//.test(eventData.registrationUrl)) errs.registrationUrl = 'Enter a valid URL';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const priceValue = eventData.priceText ? Number(eventData.priceText.replace(/[^0-9.]/g, '')) : 0;
      const capacityValue = eventData.capacity ? Number(eventData.capacity) : null;
      const venueName = eventData.venue || 'Online';

      const venueObject = eventData.venue ? {
        name: eventData.venue,
        city: eventData.venueAddress?.city || eventData.venue,
        ...(eventData.venueAddress && {
          address: {
            street: eventData.venueAddress.street || '',
            city: eventData.venueAddress.city || '',
            state: eventData.venueAddress.state || '',
            zipCode: eventData.venueAddress.zipCode || '',
            country: eventData.venueAddress.country || '',
          },
          coordinates: eventData.venueAddress.latitude && eventData.venueAddress.longitude ? {
            latitude: eventData.venueAddress.latitude,
            longitude: eventData.venueAddress.longitude,
          } : undefined,
        }),
      } : null;

      const { error } = await supabase
        .from('events')
        .update({
          title: eventData.title,
          description: eventData.description,
          poster_url: eventData.posterURL,
          type: eventData.type,
          multi_day: eventData.multiDay,
          event_date: eventData.startAt.toISOString(),
          end_date: eventData.multiDay ? eventData.endAt.toISOString() : null,
          venue: venueObject,
          location: venueName,
          capacity: capacityValue,
          price: priceValue,
          category: eventData.type || 'general',
          registration_url: eventData.registrationUrl || null,
          speakers: eventData.speakers.map(s => ({ ...s })),
          agenda: eventData.agenda.map(a => ({ ...a, time: a.time.toISOString() })),
          partners: eventData.partners.map(p => ({ ...p })),
        })
        .eq('id', eventId);

        if (error) throw error;

        await supabase.from('ticket_types').delete().eq('event_id', eventId);

        const validTiers = ticketTiers.filter((t) => t.name.trim() !== '');
        if (validTiers.length > 0) {
          const { error: tiersError } = await supabase.from('ticket_types').insert(
            validTiers.map((tier, index) => ({
              event_id: eventId,
              name: tier.name,
              description: tier.description || null,
              price: Number(tier.price) || 0,
              currency: 'USD',
              sort_order: index,
            }))
          );
          if (tiersError) {
            console.error('Error saving ticket tiers:', tiersError);
          }
        }

        router.push('/events');
      } finally {
        setSaving(false);
      }
    };

    const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
      setSaving(true);
      try {
        const { error } = await supabase.from('events').delete().eq('id', eventId);
        if (error) throw error;
        router.push('/events');
      } catch (error) {
        alert('Failed to delete event. Please try again.');
      } finally {
        setSaving(false);
      }
    };

    if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-bold text-gray-700">
            Loading event...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">
                  Edit Event
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Update your event details</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={uploading || saving}
                className="bg-white border border-red-200 text-red-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={save}
                disabled={uploading || saving}
                className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-7 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-2">
            <div className="flex items-center gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-transparent text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-4 h-4">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {activeTab === 'Basic' && (
            <div className="space-y-7">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => updateEventData({ title: e.target.value })}
                  className={`w-full px-5 py-3.5 rounded-xl border ${
                    errors.title ? 'border-red-400' : 'border-gray-200'
                  } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400`}
                  placeholder="Enter a compelling event title..."
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Description *
                </label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => updateEventData({ description: e.target.value })}
                  rows={5}
                  className={`w-full px-5 py-3.5 rounded-xl border ${
                    errors.description ? 'border-red-400' : 'border-gray-200'
                  } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400 resize-none`}
                  placeholder="Describe what makes your event special..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  Event Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {eventTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateEventData({ type: type.value })}
                      className={`relative p-5 rounded-xl border transition-colors ${
                        eventData.type === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <span className={`w-7 h-7 mb-2 block mx-auto ${
                          eventData.type === type.value ? 'text-primary-600' : 'text-gray-500'
                        }`}>
                          {type.icon}
                        </span>
                        <span className={`text-xs font-bold ${
                          eventData.type === type.value ? 'text-primary-600' : 'text-gray-600'
                        }`}>
                          {type.value}
                        </span>
                      </div>
                      {eventData.type === type.value && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={eventData.multiDay}
                      onChange={(e) => updateEventData({ multiDay: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-12 h-7 rounded-full transition-colors ${
                      eventData.multiDay ? 'bg-primary-600' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        eventData.multiDay ? 'translate-x-5' : 'translate-x-0'
                      }`}></div>
                    </div>
                  </div>
                  <div className="ml-3.5">
                    <span className="text-sm font-bold text-gray-900">Multi-day Event</span>
                    <p className="text-xs text-gray-500 mt-0.5">Enable if your event spans multiple days</p>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formatDateForInput(eventData.startAt)}
                    onChange={(e) => updateEventData({ startAt: new Date(e.target.value) })}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium"
                  />
                </div>
                {eventData.multiDay && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formatDateForInput(eventData.endAt)}
                      onChange={(e) => updateEventData({ endAt: new Date(e.target.value) })}
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  Event Poster
                </label>
                <div className="relative group">
                  {eventData.posterURL ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={eventData.posterURL}
                        alt="Event poster"
                        className="w-full h-56 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                        <button
                          onClick={() => document.getElementById('poster-upload')?.click()}
                          className="bg-white text-gray-900 px-5 py-2.5 rounded-lg font-bold text-sm"
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('poster-upload')?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-primary-400 hover:bg-primary-50/40 transition-colors cursor-pointer"
                    >
                      <div className="w-14 h-14 mx-auto mb-4 bg-primary-50 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Upload Event Poster</p>
                      <p className="text-xs text-gray-500">Click to select an image</p>
                    </div>
                  )}
                  <input
                    id="poster-upload"
                    type="file"
                    accept="image/*"
                    onChange={onPosterChange}
                    className="hidden"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-xs font-bold text-gray-900">Uploading...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={eventData.venue}
                    onChange={(e) => updateEventData({ venue: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
                    placeholder="Event location or venue name"
                  />

                  <div className="mt-4 space-y-2.5">
                    <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Address Details (for Maps Navigation)
                    </label>
                    <input
                      type="text"
                      value={eventData.venueAddress?.street || ''}
                      onChange={(e) => updateEventData({ venueAddress: { ...eventData.venueAddress, street: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 placeholder-gray-400 text-sm"
                      placeholder="Street Address"
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={eventData.venueAddress?.city || ''}
                        onChange={(e) => updateEventData({ venueAddress: { ...eventData.venueAddress, city: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 placeholder-gray-400 text-sm"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={eventData.venueAddress?.state || ''}
                        onChange={(e) => updateEventData({ venueAddress: { ...eventData.venueAddress, state: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 placeholder-gray-400 text-sm"
                        placeholder="State"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={eventData.venueAddress?.zipCode || ''}
                        onChange={(e) => updateEventData({ venueAddress: { ...eventData.venueAddress, zipCode: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 placeholder-gray-400 text-sm"
                        placeholder="ZIP Code"
                      />
                      <input
                        type="text"
                        value={eventData.venueAddress?.country || ''}
                        onChange={(e) => updateEventData({ venueAddress: { ...eventData.venueAddress, country: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 placeholder-gray-400 text-sm"
                        placeholder="Country"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="number"
                        step="any"
                        value={eventData.venueAddress?.latitude || ''}
                        onChange={(e) => updateEventData({ venueAddress: { ...eventData.venueAddress, latitude: e.target.value ? parseFloat(e.target.value) : undefined } })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 placeholder-gray-400 text-sm"
                        placeholder="Latitude (optional)"
                      />
                      <input
                        type="number"
                        step="any"
                        value={eventData.venueAddress?.longitude || ''}
                        onChange={(e) => updateEventData({ venueAddress: { ...eventData.venueAddress, longitude: e.target.value ? parseFloat(e.target.value) : undefined } })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 placeholder-gray-400 text-sm"
                        placeholder="Longitude (optional)"
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Tip: Add address details to enable map navigation for attendees. Coordinates are optional but provide precise location.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={eventData.capacity}
                    onChange={(e) => updateEventData({ capacity: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
                    placeholder="Max attendees"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Price
                  </label>
                  <input
                    type="text"
                    value={eventData.priceText}
                    onChange={(e) => updateEventData({ priceText: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
                    placeholder="e.g., Free, $50, $100-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Registration URL
                  </label>
                  <input
                    type="url"
                    value={eventData.registrationUrl}
                    onChange={(e) => updateEventData({ registrationUrl: e.target.value })}
                    className={`w-full px-5 py-3.5 rounded-xl border ${
                      errors.registrationUrl ? 'border-red-400' : 'border-gray-200'
                    } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400`}
                    placeholder="https://eventbrite.com/..."
                  />
                  {errors.registrationUrl && (
                    <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.registrationUrl}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Speakers' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Event Speakers</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Add speakers and their details</p>
                </div>
                <button
                  onClick={addSpeaker}
                  className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Speaker</span>
                </button>
              </div>

              {eventData.speakers.length === 0 ? (
                <div className="text-center py-14 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary-50 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1">No speakers added yet</h3>
                  <p className="text-sm text-gray-500 mb-5">Add speakers to showcase your event talent</p>
                  <button
                    onClick={addSpeaker}
                    className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    Add Your First Speaker
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {eventData.speakers.map((sp, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-extrabold text-sm">
                            {i + 1}
                          </div>
                          <h4 className="text-base font-extrabold text-gray-900">Speaker {i + 1}</h4>
                        </div>
                        <button
                          onClick={() => removeSpeaker(i)}
                          className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="mb-5">
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Speaker Photo
                        </label>
                        <div className="relative group">
                          {sp.photoURL ? (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200">
                              <img
                                src={sp.photoURL}
                                alt={`${sp.name || 'Speaker'} photo`}
                                className="w-full h-44 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3.5">
                                <button
                                  onClick={() => document.getElementById(`speaker-photo-${i}`)?.click()}
                                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-xs"
                                >
                                  Change Photo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => document.getElementById(`speaker-photo-${i}`)?.click()}
                              className="border-2 border-dashed border-gray-300 rounded-xl p-7 text-center hover:border-primary-400 hover:bg-primary-50/40 transition-colors cursor-pointer"
                            >
                              <div className="w-12 h-12 mx-auto mb-3 bg-primary-50 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-xs font-bold text-gray-900 mb-0.5">Upload Speaker Photo</p>
                              <p className="text-[11px] text-gray-500">Click to select an image</p>
                            </div>
                          )}
                          <input
                            id={`speaker-photo-${i}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => onSpeakerPhotoChange(i, e)}
                            className="hidden"
                          />
                          {uploading && (
                            <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-xs font-bold text-gray-900">Uploading...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Speaker Name"
                          value={sp.name}
                          onChange={(e) => updateSpeaker(i, 'name', e.target.value)}
                          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Title/Role"
                          value={sp.title}
                          onChange={(e) => updateSpeaker(i, 'title', e.target.value)}
                          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={sp.company}
                          onChange={(e) => updateSpeaker(i, 'company', e.target.value)}
                          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Bio"
                          value={sp.bio}
                          onChange={(e) => updateSpeaker(i, 'bio', e.target.value)}
                          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Agenda' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Event Agenda</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Schedule and timeline for your event</p>
                </div>
                <button
                  onClick={addAgendaItem}
                  className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Item</span>
                </button>
              </div>

              {eventData.agenda.length === 0 ? (
                <div className="text-center py-14 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary-50 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1">No agenda items yet</h3>
                  <p className="text-sm text-gray-500 mb-5">Create your event schedule</p>
                  <button
                    onClick={addAgendaItem}
                    className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    Add Your First Item
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {eventData.agenda.map((it, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-extrabold text-sm">
                            {i + 1}
                          </div>
                          <h4 className="text-base font-extrabold text-gray-900">Agenda Item {i + 1}</h4>
                        </div>
                        <button
                          onClick={() => removeAgendaItem(i)}
                          className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {eventData.multiDay && (
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Day</label>
                            <select
                              value={new Date(it.time || eventData.startAt).toDateString()}
                              onChange={(e) => {
                                const selectedDay = new Date(e.target.value);
                                const d = new Date(it.time || eventData.startAt);
                                d.setFullYear(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
                                updateAgendaItem(i, 'time', d);
                              }}
                              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium"
                            >
                              {getEventDays().map((day, dayIndex) => (
                                <option key={dayIndex} value={day.toDateString()}>
                                  Day {dayIndex + 1} — {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Time</label>
                          <input
                            type="time"
                            value={`${String((it.time || new Date()).getHours()).padStart(2, '0')}:${String((it.time || new Date()).getMinutes()).padStart(2, '0')}`}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(':');
                              const d = new Date(it.time || new Date());
                              d.setHours(parseInt(h), parseInt(m));
                              updateAgendaItem(i, 'time', d);
                            }}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Session Title"
                          value={it.title}
                          onChange={(e) => updateAgendaItem(i, 'title', e.target.value)}
                          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Speaker Name"
                          value={it.speaker}
                          onChange={(e) => updateAgendaItem(i, 'speaker', e.target.value)}
                          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g., 60 min)"
                          value={it.duration}
                          onChange={(e) => updateAgendaItem(i, 'duration', e.target.value)}
                          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                        />
                      </div>
                      <textarea
                        placeholder="Session Description"
                        value={it.description}
                        onChange={(e) => updateAgendaItem(i, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400 resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Tickets' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Ticket Types</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Add or edit ticket tiers attendees can choose from (e.g. Free, General, VIP)
                  </p>
                </div>
                <button
                  onClick={addTicketTier}
                  className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Ticket Type</span>
                </button>
              </div>

              {ticketTiers.length === 0 ? (
                <div className="text-center py-14 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary-50 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h2a2 2 0 002-2 1 1 0 112 0 2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2h-2a2 2 0 00-2 2 1 1 0 11-2 0 2 2 0 00-2-2z" /></svg>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1">No ticket types yet</h3>
                  <p className="text-sm text-gray-500 mb-5">Attendees will default to a single free ticket if none are added</p>
                  <button
                    onClick={addTicketTier}
                    className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    Add Your First Ticket Type
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {ticketTiers.map((tier, index) => (
                    <div key={tier.id ?? index} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-extrabold text-sm">
                            {index + 1}
                          </div>
                          <h4 className="text-base font-extrabold text-gray-900">Ticket Type {index + 1}</h4>
                        </div>
                        <button
                          onClick={() => removeTicketTier(index)}
                          className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <input
                          type="text"
                          placeholder="Ticket Name (e.g. VIP, General, Free)"
                          value={tier.name}
                          onChange={(e) => updateTicketTier(index, 'name', e.target.value)}
                          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                        />
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0 for Free"
                            value={tier.price}
                            onChange={(e) => updateTicketTier(index, 'price', e.target.value)}
                            className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                          />
                        </div>
                      </div>
                      <textarea
                        placeholder="Description (e.g. 'Includes reserved seating and reception')"
                        value={tier.description}
                        onChange={(e) => updateTicketTier(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Partners' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Event Partners</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Sponsors and collaborators</p>
                </div>
                <button
                  onClick={addPartner}
                  className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Partner</span>
                </button>
              </div>

              {eventData.partners.length === 0 ? (
                <div className="text-center py-14 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary-50 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1">No partners added yet</h3>
                  <p className="text-sm text-gray-500 mb-5">Add sponsors and collaborators</p>
                  <button
                    onClick={addPartner}
                    className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    Add Your First Partner
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {eventData.partners.map((p, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-extrabold text-sm">
                            {i + 1}
                          </div>
                          <h4 className="text-base font-extrabold text-gray-900">Partner {i + 1}</h4>
                        </div>
                        <button
                          onClick={() => removePartner(i)}
                          className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="mb-5">
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Partner Logo
                        </label>
                        <div className="relative group">
                          {p.logoURL ? (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                              <div className="p-5 flex items-center justify-center">
                                <img
                                  src={p.logoURL}
                                  alt={`${p.name || 'Partner'} logo`}
                                  className="max-w-full max-h-28 object-contain"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3.5">
                                <button
                                  onClick={() => document.getElementById(`partner-logo-${i}`)?.click()}
                                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-xs"
                                >
                                  Change Logo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => document.getElementById(`partner-logo-${i}`)?.click()}
                              className="border-2 border-dashed border-gray-300 rounded-xl p-7 text-center hover:border-primary-400 hover:bg-primary-50/40 transition-colors cursor-pointer"
                            >
                              <div className="w-12 h-12 mx-auto mb-3 bg-primary-50 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-xs font-bold text-gray-900 mb-0.5">Upload Partner Logo</p>
                              <p className="text-[11px] text-gray-500">Click to select an image</p>
                            </div>
                          )}
                          <input
                            id={`partner-logo-${i}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => onPartnerLogoChange(i, e)}
                            className="hidden"
                          />
                          {uploading && (
                            <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-xs font-bold text-gray-900">Uploading...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Partner Name"
                          value={p.name}
                          onChange={(e) => updatePartner(i, 'name', e.target.value)}
                          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                        />
                        <input
                          type="url"
                          placeholder="Website URL"
                          value={p.website}
                          onChange={(e) => updatePartner(i, 'website', e.target.value)}
                          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-medium placeholder-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}