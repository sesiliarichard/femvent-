/**
 * ENHANCED CREATE EVENT PAGE (/events/create)
 * Premium multi-tab form for creating new events with modern UI
 */
'use client';

import React, { useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface Speaker {
  name: string;
  title: string;
  company: string;
  bio: string;
  photoURL?: string;
}

interface AgendaItem {
  time: Date;
  title: string;
  description: string;
  speaker: string;
  duration: string;
}

interface Partner {
  name: string;
  website: string;
  logoURL?: string;
}

interface TicketTier {
  name: string;
  description: string;
  price: string;
}

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

type TabType = 'Basic' | 'Tickets' | 'Speakers' | 'Agenda' | 'Partners';

export default function CreateEventPage() {
  const { userProfile } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="create">
        <CreateEventContent userProfile={userProfile} router={router} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function CreateEventContent({ userProfile, router }: { userProfile: any; router: any }) {
  const [eventData, setEventData] = useState<EventData>({
    title: '',
    description: '',
    posterURL: null,
    type: 'Conference',
    multiDay: false,
    startAt: new Date(),
    endAt: new Date(),
    venue: '',
    capacity: '',
    priceText: '',
    registrationUrl: '',
    speakers: [],
    agenda: [],
    partners: [],
  });

  const [activeTab, setActiveTab] = useState<TabType>('Basic');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [createdEventLink, setCreatedEventLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    { name: 'General Admission', description: '', price: '0' },
  ]);

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

  const eventTypes = [
    { value: 'Conference', icon: '🎤', color: 'from-blue-500 to-cyan-500' },
    { value: 'Workshop', icon: '🛠️', color: 'from-purple-500 to-pink-500' },
    { value: 'Meetup', icon: '🤝', color: 'from-emerald-500 to-teal-500' },
    { value: 'Webinar', icon: '💻', color: 'from-orange-500 to-red-500' },
    { value: 'Exhibition', icon: '🎨', color: 'from-violet-500 to-purple-500' },
    { value: 'Networking', icon: '🌐', color: 'from-amber-500 to-orange-500' }
  ];

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'Basic', label: 'Basic Info', icon: '📝' },
    { id: 'Tickets', label: 'Tickets', icon: '🎟️' },
    { id: 'Speakers', label: 'Speakers', icon: '🎤' },
    { id: 'Agenda', label: 'Agenda', icon: '📅' },
    { id: 'Partners', label: 'Partners', icon: '🤝' },
  ];

  // Helper function to format date for datetime-local input (local time, not UTC)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleFieldChange = useCallback((field: keyof EventData, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleFileUpload = async (file: File, path: string) => {
    try {
      setUploading(true);
      const filePath = `${Date.now()}/${path}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await handleFileUpload(file, `poster-${Date.now()}.jpg`);
      handleFieldChange('posterURL', url);
    } catch (error) {
      alert('Upload failed. Please try again.');
    }
  };

  const handleSpeakerPhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await handleFileUpload(file, `speaker-${index}-${Date.now()}.jpg`);
      updateSpeaker(index, 'photoURL', url);
    } catch (error) {
      alert('Photo upload failed. Please try again.');
    }
  };

  const handlePartnerLogoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await handleFileUpload(file, `partner-${index}-${Date.now()}.jpg`);
      updatePartner(index, 'logoURL', url);
    } catch (error) {
      alert('Logo upload failed. Please try again.');
    }
  };

  const addSpeaker = () => {
    setEventData(prev => ({
      ...prev,
      speakers: [...prev.speakers, { name: '', title: '', company: '', bio: '' }]
    }));
  };

  const updateSpeaker = (index: number, field: keyof Speaker, value: string) => {
    setEventData(prev => ({
      ...prev,
      speakers: prev.speakers.map((speaker, i) => 
        i === index ? { ...speaker, [field]: value } : speaker
      )
    }));
  };

  const removeSpeaker = (index: number) => {
    setEventData(prev => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index)
    }));
  };

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
    const defaultTime = new Date(eventData.startAt);
    defaultTime.setHours(9 + eventData.agenda.length, 0, 0, 0);
    setEventData(prev => ({
      ...prev,
      agenda: [...prev.agenda, { 
        time: defaultTime, 
        title: '', 
        description: '', 
        speaker: '', 
        duration: '' 
      }]
    }));
  };

  const updateAgendaItem = (index: number, field: keyof AgendaItem, value: any) => {
    setEventData(prev => ({
      ...prev,
      agenda: prev.agenda.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeAgendaItem = (index: number) => {
    setEventData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index)
    }));
  };

  const addPartner = () => {
    setEventData(prev => ({
      ...prev,
      partners: [...prev.partners, { name: '', website: '' }]
    }));
  };

  const updatePartner = (index: number, field: keyof Partner, value: string) => {
    setEventData(prev => ({
      ...prev,
      partners: prev.partners.map((partner, i) => 
        i === index ? { ...partner, [field]: value } : partner
      )
    }));
  };

  const removePartner = (index: number) => {
    setEventData(prev => ({
      ...prev,
      partners: prev.partners.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!eventData.title.trim()) newErrors.title = 'Title is required';
    if (!eventData.description.trim()) newErrors.description = 'Description is required';
    if (eventData.venue && eventData.venue.length > 200) newErrors.venue = 'Venue must be 200 characters or less';
    if (eventData.capacity && (isNaN(Number(eventData.capacity)) || Number(eventData.capacity) < 0)) {
      newErrors.capacity = 'Capacity must be a positive number';
    }
    if (eventData.registrationUrl && !/^https?:\/\/.+/.test(eventData.registrationUrl)) {
      newErrors.registrationUrl = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createEvent = async () => {
    if (!validateForm()) {
      alert('Please go to the "Basic Info" tab and fill in the required fields (Title and Description) before creating the event.');
      setActiveTab('Basic'); // Navigate to Basic tab to show errors
      return;
    }

    if (!userProfile?.id) {
      alert('Authentication Error: You must be logged in to create events.');
      return;
    }

    setCreating(true);
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

      const startTime = Date.now();

      const { data: created, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          poster_url: eventData.posterURL,
          host_id: userProfile.id,
          status: 'published',
          type: eventData.type,
          multi_day: eventData.multiDay,
          event_date: eventData.startAt.toISOString(),
          venue: venueObject,
          location: venueName,
          capacity: capacityValue,
          price: priceValue,
          category: eventData.type || 'general',
          tickets_sold: 0,
          registration_url: eventData.registrationUrl || null,
          speakers: eventData.speakers.map(s => ({ ...s })),
          agenda: eventData.agenda.map(a => ({ ...a, time: a.time.toISOString() })),
          partners: eventData.partners.map(p => ({ ...p })),
        })
        .select()
        .single();

        if (error) throw error;

        const duration = Date.now() - startTime;
  
        logger.logEventOperation('event_created', created.id, {
          title: eventData.title,
          hostId: userProfile.id,
          duration,
        });
        logger.logDatabaseOperation('create', 'events', { eventId: created.id });
        logger.logPerformance('create_event', duration, { eventId: created.id });
  
        const attendeeSiteUrl = process.env.NEXT_PUBLIC_ATTENDEE_SITE_URL || '';
        const registrationLink = `${attendeeSiteUrl}/events/${created.id}/register`;
  
        // Save the real registration link on the event too, so it's available elsewhere later
        await supabase
          .from('events')
          .update({ registration_url: registrationLink })
          .eq('id', created.id);

        // Save the ticket tiers the host configured
        const validTiers = ticketTiers.filter((t) => t.name.trim() !== '');
        if (validTiers.length > 0) {
          const { error: tiersError } = await supabase.from('ticket_types').insert(
            validTiers.map((tier, index) => ({
              event_id: created.id,
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
  
        setCreatedEventLink(registrationLink);
      } catch (error: any) {
        console.error('Event creation error:', error);
        logger.error('Event creation failed', {
          context: 'CreateEvent',
          operation: 'createEvent',
          metadata: { title: eventData.title, hostId: userProfile.id },
          error: error,
        });
        alert(`Error: ${error.message || 'Failed to create event'}`);
      } finally {
        setCreating(false);
      }
    };
  
    const copyRegistrationLink = () => {
      if (!createdEventLink) return;
      navigator.clipboard.writeText(createdEventLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    };

  const saveDraft = async () => {
    if (!userProfile?.id) {
      alert('Authentication Error: You must be logged in to save drafts.');
      return;
    }

    setCreating(true);
    try {
      const startTime = Date.now();

      const { data: created, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title || 'Untitled Event',
          description: eventData.description || '',
          poster_url: eventData.posterURL || null,
          host_id: userProfile.id,
          status: 'draft',
          type: eventData.type,
          multi_day: eventData.multiDay,
          event_date: eventData.startAt.toISOString(),
          venue: eventData.venue ? { name: eventData.venue, city: eventData.venue } : null,
          capacity: eventData.capacity ? Number(eventData.capacity) : null,
          price: eventData.priceText ? Number(eventData.priceText.replace(/[^0-9.]/g, '')) : 0,
          registration_url: eventData.registrationUrl || null,
          speakers: eventData.speakers.map(s => ({ ...s })),
          agenda: eventData.agenda.map(a => ({ ...a, time: a.time.toISOString() })),
          partners: eventData.partners.map(p => ({ ...p })),
        })
        .select()
        .single();

      if (error) throw error;

      const duration = Date.now() - startTime;

      logger.logEventOperation('event_saved_draft', created.id, {
        title: created.title,
        hostId: userProfile.id,
        duration,
      });
      logger.logDatabaseOperation('create', 'events', { eventId: created.id });
      logger.logPerformance('save_draft', duration, { eventId: created.id });

      alert('Draft saved successfully!');
      router.push('/events');
    } catch (error: any) {
      console.error('Draft save error:', error);
      logger.error('Draft save failed', {
        context: 'CreateEvent',
        operation: 'saveDraft',
        metadata: { title: eventData.title, hostId: userProfile.id },
        error: error,
      });
      alert(`Error: ${error.message || 'Failed to save draft'}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Premium Header */}
        <div className="mb-10 animate-[fadeIn_0.8s_ease-out]">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="group p-3 hover:bg-white/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-slate-200/50"
                >
                  <svg className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Create New Event
                  </h1>
                  <p className="text-xl text-slate-600 font-medium mt-2">Fill in the details to create your event</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveDraft}
                disabled={uploading || creating}
                className="group relative bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="relative flex items-center gap-3">
                  {creating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Draft</span>
                    </>
                  )}
                </div>
              </button>
              <button
                onClick={createEvent}
                disabled={uploading || creating}
                className="group relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3">
                  {creating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Event</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Premium Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-xl p-3">
            <div className="flex items-center gap-3 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:scale-105'
                  }`}
                >
                  <span className={`text-2xl transition-transform duration-300 ${
                    activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-10">
          {activeTab === 'Basic' && (
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className={`w-full px-6 py-4 rounded-2xl border-2 ${
                    errors.title ? 'border-red-500' : 'border-slate-200'
                  } focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-semibold text-lg placeholder-slate-400`}
                  placeholder="Enter a compelling event title..."
                  maxLength={100}
                />
                <div className="flex items-center justify-between mt-2">
                  {errors.title && (
                    <p className="text-red-500 text-sm font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.title}
                    </p>
                  )}
                  <p className="text-slate-500 text-sm font-medium ml-auto">
                    {eventData.title.length}/100
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                  Description *
                </label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={5}
                  maxLength={500}
                  className={`w-full px-6 py-4 rounded-2xl border-2 ${
                    errors.description ? 'border-red-500' : 'border-slate-200'
                  } focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-medium placeholder-slate-400 resize-none`}
                  placeholder="Describe what makes your event special..."
                />
                <div className="flex items-center justify-between mt-2">
                  {errors.description && (
                    <p className="text-red-500 text-sm font-semibold">{errors.description}</p>
                  )}
                  <p className="text-slate-500 text-sm font-medium ml-auto">
                    {eventData.description.length}/500
                  </p>
                </div>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-black text-slate-900 mb-4 uppercase tracking-wide">
                  Event Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {eventTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleFieldChange('type', type.value)}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                        eventData.type === type.value
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg scale-105'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:scale-105'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                      <div className="relative text-center">
                        <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform duration-300">
                          {type.icon}
                        </span>
                        <span className={`text-sm font-bold ${
                          eventData.type === type.value ? 'text-blue-600' : 'text-slate-700'
                        }`}>
                          {type.value}
                        </span>
                      </div>
                      {eventData.type === type.value && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-day Toggle */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={eventData.multiDay}
                      onChange={(e) => handleFieldChange('multiDay', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                      eventData.multiDay ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-300'
                    }`}>
                      <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                        eventData.multiDay ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="text-lg font-black text-slate-900">Multi-day Event</span>
                    <p className="text-sm text-slate-600 font-medium">Enable if your event spans multiple days</p>
                  </div>
                </label>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formatDateForInput(eventData.startAt)}
                    onChange={(e) => handleFieldChange('startAt', new Date(e.target.value))}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-bold"
                  />
                </div>
                {eventData.multiDay && (
                  <div>
                    <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formatDateForInput(eventData.endAt)}
                      onChange={(e) => handleFieldChange('endAt', new Date(e.target.value))}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Event Poster */}
              <div>
                <label className="block text-sm font-black text-slate-900 mb-4 uppercase tracking-wide">
                  Event Poster
                </label>
                <div className="relative group">
                  {eventData.posterURL ? (
                    <div className="relative rounded-3xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all duration-300">
                      <img
                        src={eventData.posterURL}
                        alt="Event poster"
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                        <button
                          onClick={() => document.getElementById('poster-upload')?.click()}
                          className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all duration-300"
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('poster-upload')?.click()}
                      className="border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-slate-900 mb-2">Upload Event Poster</p>
                      <p className="text-sm text-slate-500 font-medium">Click to select an image</p>
                    </div>
                  )}
                  <input
                    id="poster-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePosterUpload}
                    className="hidden"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm font-bold text-slate-900">Uploading...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Venue & Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={eventData.venue}
                    onChange={(e) => handleFieldChange('venue', e.target.value)}
                    className={`w-full px-6 py-4 rounded-2xl border-2 ${
                      errors.venue ? 'border-red-500' : 'border-slate-200'
                    } focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-semibold placeholder-slate-400`}
                    placeholder="Event location or venue name"
                  />
                  {errors.venue && (
                    <p className="text-red-500 text-sm mt-2 font-semibold">{errors.venue}</p>
                  )}
                  
                  {/* Venue Address Fields */}
                  <div className="mt-4 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                      Address Details (for Maps Navigation)
                    </label>
                    <input
                      type="text"
                      value={eventData.venueAddress?.street || ''}
                      onChange={(e) => handleFieldChange('venueAddress', { ...eventData.venueAddress, street: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 font-medium placeholder-slate-400 text-sm"
                      placeholder="Street Address"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={eventData.venueAddress?.city || ''}
                        onChange={(e) => handleFieldChange('venueAddress', { ...eventData.venueAddress, city: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 font-medium placeholder-slate-400 text-sm"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={eventData.venueAddress?.state || ''}
                        onChange={(e) => handleFieldChange('venueAddress', { ...eventData.venueAddress, state: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 font-medium placeholder-slate-400 text-sm"
                        placeholder="State"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={eventData.venueAddress?.zipCode || ''}
                        onChange={(e) => handleFieldChange('venueAddress', { ...eventData.venueAddress, zipCode: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 font-medium placeholder-slate-400 text-sm"
                        placeholder="ZIP Code"
                      />
                      <input
                        type="text"
                        value={eventData.venueAddress?.country || ''}
                        onChange={(e) => handleFieldChange('venueAddress', { ...eventData.venueAddress, country: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 font-medium placeholder-slate-400 text-sm"
                        placeholder="Country"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="any"
                        value={eventData.venueAddress?.latitude || ''}
                        onChange={(e) => handleFieldChange('venueAddress', { ...eventData.venueAddress, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 font-medium placeholder-slate-400 text-sm"
                        placeholder="Latitude (optional)"
                      />
                      <input
                        type="number"
                        step="any"
                        value={eventData.venueAddress?.longitude || ''}
                        onChange={(e) => handleFieldChange('venueAddress', { ...eventData.venueAddress, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 font-medium placeholder-slate-400 text-sm"
                        placeholder="Longitude (optional)"
                      />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      💡 Tip: Add address details to enable map navigation for attendees. Coordinates are optional but provide precise location.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={eventData.capacity}
                    onChange={(e) => handleFieldChange('capacity', e.target.value)}
                    className={`w-full px-6 py-4 rounded-2xl border-2 ${
                      errors.capacity ? 'border-red-500' : 'border-slate-200'
                    } focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-semibold placeholder-slate-400`}
                    placeholder="Max attendees"
                  />
                  {errors.capacity && (
                    <p className="text-red-500 text-sm mt-2 font-semibold">{errors.capacity}</p>
                  )}
                </div>
              </div>

              {/* Price & Registration URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                    Price
                  </label>
                  <input
                    type="text"
                    value={eventData.priceText}
                    onChange={(e) => handleFieldChange('priceText', e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-semibold placeholder-slate-400"
                    placeholder="e.g., Free, $50, $100-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                    Registration URL
                  </label>
                  <input
                    type="url"
                    value={eventData.registrationUrl}
                    onChange={(e) => handleFieldChange('registrationUrl', e.target.value)}
                    className={`w-full px-6 py-4 rounded-2xl border-2 ${
                      errors.registrationUrl ? 'border-red-500' : 'border-slate-200'
                    } focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-semibold placeholder-slate-400`}
                    placeholder="https://eventbrite.com/..."
                  />
                  {errors.registrationUrl && (
                    <p className="text-red-500 text-sm mt-2 font-semibold">{errors.registrationUrl}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Speakers' && (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Event Speakers</h3>
                  <p className="text-slate-600 font-medium mt-1">Add speakers and their details</p>
                </div>
                <button
                  onClick={addSpeaker}
                  className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300"
                >
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Speaker</span>
                </button>
              </div>

              {eventData.speakers.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border-2 border-dashed border-slate-300">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <span className="text-4xl">🎤</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No speakers added yet</h3>
                  <p className="text-slate-600 font-medium mb-6">Add speakers to showcase your event talent</p>
                  <button
                    onClick={addSpeaker}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Add Your First Speaker
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {eventData.speakers.map((speaker, index) => (
                    <div
                      key={index}
                      className="group bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-3xl p-8 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                      style={{ animation: `slideUp 0.5s ease-out ${index * 0.1}s backwards` }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                            {index + 1}
                          </div>
                          <h4 className="text-xl font-black text-slate-900">Speaker {index + 1}</h4>
                        </div>
                        <button
                          onClick={() => removeSpeaker(index)}
                          className="group/btn p-3 hover:bg-red-100 rounded-xl transition-all duration-300 hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-red-600 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      {/* Speaker Photo Upload */}
                      <div className="mb-6">
                        <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                          Speaker Photo
                        </label>
                        <div className="relative">
                          {speaker.photoURL ? (
                            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all duration-300">
                              <img
                                src={speaker.photoURL}
                                alt={`${speaker.name || 'Speaker'} photo`}
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                                <button
                                  onClick={() => document.getElementById(`speaker-photo-${index}`)?.click()}
                                  className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold hover:scale-105 transition-all duration-300 text-sm"
                                >
                                  Change Photo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => document.getElementById(`speaker-photo-${index}`)?.click()}
                              className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
                            >
                              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-sm font-bold text-slate-900 mb-1">Upload Speaker Photo</p>
                              <p className="text-xs text-slate-500 font-medium">Click to select an image</p>
                            </div>
                          )}
                          <input
                            id={`speaker-photo-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSpeakerPhotoUpload(index, e)}
                            className="hidden"
                          />
                          {uploading && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-xs font-bold text-slate-900">Uploading...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                          type="text"
                          placeholder="Speaker Name"
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                          className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="Title/Role"
                          value={speaker.title}
                          onChange={(e) => updateSpeaker(index, 'title', e.target.value)}
                          className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={speaker.company}
                          onChange={(e) => updateSpeaker(index, 'company', e.target.value)}
                          className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="Bio"
                          value={speaker.bio}
                          onChange={(e) => updateSpeaker(index, 'bio', e.target.value)}
                          className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Agenda' && (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Event Agenda</h3>
                  <p className="text-slate-600 font-medium mt-1">Schedule and timeline for your event</p>
                </div>
                <button
                  onClick={addAgendaItem}
                  className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300"
                >
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Item</span>
                </button>
              </div>

              {eventData.agenda.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border-2 border-dashed border-slate-300">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <span className="text-4xl">📅</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No agenda items yet</h3>
                  <p className="text-slate-600 font-medium mb-6">Create your event schedule</p>
                  <button
                    onClick={addAgendaItem}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Add Your First Item
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {eventData.agenda.map((item, index) => (
                    <div
                      key={index}
                      className="group bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-3xl p-8 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                      style={{ animation: `slideUp 0.5s ease-out ${index * 0.1}s backwards` }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                            {index + 1}
                          </div>
                          <h4 className="text-xl font-black text-slate-900">Agenda Item {index + 1}</h4>
                        </div>
                        <button
                          onClick={() => removeAgendaItem(index)}
                          className="group/btn p-3 hover:bg-red-100 rounded-xl transition-all duration-300 hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-red-600 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {eventData.multiDay && (
                            <div>
                              <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">Day</label>
                              <select
                                value={new Date(item.time).toDateString()}
                                onChange={(e) => {
                                  const selectedDay = new Date(e.target.value);
                                  const newTime = new Date(item.time);
                                  newTime.setFullYear(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
                                  updateAgendaItem(index, 'time', newTime);
                                }}
                                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-bold"
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
                            <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">Time</label>
                            <input
                              type="time"
                              value={item.time.toTimeString().slice(0, 5)}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':');
                                const newTime = new Date(item.time);
                                newTime.setHours(parseInt(hours), parseInt(minutes));
                                updateAgendaItem(index, 'time', newTime);
                              }}
                              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-bold"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input
                            type="text"
                            placeholder="Session Title"
                            value={item.title}
                            onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                            className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                          />
                          <input
                            type="text"
                            placeholder="Speaker Name"
                            value={item.speaker}
                            onChange={(e) => updateAgendaItem(index, 'speaker', e.target.value)}
                            className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                          />
                        </div>
                        <textarea
                          placeholder="Session Description"
                          value={item.description}
                          onChange={(e) => updateAgendaItem(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-medium placeholder-slate-400 resize-none"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g., 60 min)"
                          value={item.duration}
                          onChange={(e) => updateAgendaItem(index, 'duration', e.target.value)}
                          className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

{activeTab === 'Tickets' && (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Ticket Types</h3>
                  <p className="text-slate-600 font-medium mt-1">
                    Add one or more ticket tiers attendees can choose from (e.g. Free, General, VIP)
                  </p>
                </div>
                <button
                  onClick={addTicketTier}
                  className="group flex items-center gap-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105 transition-all duration-300"
                >
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Ticket Type</span>
                </button>
              </div>

              {ticketTiers.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-rose-50 rounded-3xl border-2 border-dashed border-slate-300">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center">
                    <span className="text-4xl">🎟️</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No ticket types yet</h3>
                  <p className="text-slate-600 font-medium mb-6">Attendees will default to a single free ticket if none are added</p>
                  <button
                    onClick={addTicketTier}
                    className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Add Your First Ticket Type
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {ticketTiers.map((tier, index) => (
                    <div
                      key={index}
                      className="group bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-3xl p-8 hover:border-rose-300 hover:shadow-xl transition-all duration-300"
                      style={{ animation: `slideUp 0.5s ease-out ${index * 0.1}s backwards` }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-rose-600 to-pink-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                            {index + 1}
                          </div>
                          <h4 className="text-xl font-black text-slate-900">Ticket Type {index + 1}</h4>
                        </div>
                        <button
                          onClick={() => removeTicketTier(index)}
                          className="group/btn p-3 hover:bg-red-100 rounded-xl transition-all duration-300 hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-red-600 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <input
                          type="text"
                          placeholder="Ticket Name (e.g. VIP, General, Free)"
                          value={tier.name}
                          onChange={(e) => updateTicketTier(index, 'name', e.target.value)}
                          className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                        />
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0 for Free"
                            value={tier.price}
                            onChange={(e) => updateTicketTier(index, 'price', e.target.value)}
                            className="w-full pl-10 pr-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                          />
                        </div>
                      </div>
                      <textarea
                        placeholder="Description (e.g. 'Includes reserved seating and reception')"
                        value={tier.description}
                        onChange={(e) => updateTicketTier(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Partners' && (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Event Partners</h3>
                  <p className="text-slate-600 font-medium mt-1">Sponsors and collaborators</p>
                </div>
                <button
                  onClick={addPartner}
                  className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300"
                >
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Partner</span>
                </button>
              </div>

              {eventData.partners.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border-2 border-dashed border-slate-300">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <span className="text-4xl">🤝</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No partners added yet</h3>
                  <p className="text-slate-600 font-medium mb-6">Add sponsors and collaborators</p>
                  <button
                    onClick={addPartner}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Add Your First Partner
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {eventData.partners.map((partner, index) => (
                    <div
                      key={index}
                      className="group bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-3xl p-8 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                      style={{ animation: `slideUp 0.5s ease-out ${index * 0.1}s backwards` }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                            {index + 1}
                          </div>
                          <h4 className="text-xl font-black text-slate-900">Partner {index + 1}</h4>
                        </div>
                        <button
                          onClick={() => removePartner(index)}
                          className="group/btn p-3 hover:bg-red-100 rounded-xl transition-all duration-300 hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-red-600 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      {/* Partner Logo Upload */}
                      <div className="mb-6">
                        <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                          Partner Logo
                        </label>
                        <div className="relative">
                          {partner.logoURL ? (
                            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all duration-300 bg-white">
                              <div className="p-6 flex items-center justify-center">
                                <img
                                  src={partner.logoURL}
                                  alt={`${partner.name || 'Partner'} logo`}
                                  className="max-w-full max-h-32 object-contain"
                                />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                                <button
                                  onClick={() => document.getElementById(`partner-logo-${index}`)?.click()}
                                  className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold hover:scale-105 transition-all duration-300 text-sm"
                                >
                                  Change Logo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => document.getElementById(`partner-logo-${index}`)?.click()}
                              className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
                            >
                              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-sm font-bold text-slate-900 mb-1">Upload Partner Logo</p>
                              <p className="text-xs text-slate-500 font-medium">Click to select an image</p>
                            </div>
                          )}
                          <input
                            id={`partner-logo-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePartnerLogoUpload(index, e)}
                            className="hidden"
                          />
                          {uploading && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-xs font-bold text-slate-900">Uploading...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                          type="text"
                          placeholder="Partner Name"
                          value={partner.name}
                          onChange={(e) => updatePartner(index, 'name', e.target.value)}
                          className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                        />
                        <input
                          type="url"
                          placeholder="Website URL"
                          value={partner.website}
                          onChange={(e) => updatePartner(index, 'website', e.target.value)}
                          className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
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

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
