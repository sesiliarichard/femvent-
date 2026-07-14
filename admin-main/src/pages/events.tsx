import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { EventCard } from '../components/EventCard';
import { EventModal } from '../components/EventModal';
import { Event } from '@/types';
import { useEventStats } from '@/services/eventStats';
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '../services/firestore';
import { supabase } from '../services/supabase';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const eventStats = useEventStats();
  
  // Type guard for Event type
  const isEvent = (event: any): event is Event => {
    return typeof event === 'object' && event !== null && 
           typeof event.id === 'string' &&
           typeof event.title === 'string' &&
           typeof event.description === 'string';
  };
  
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'technology', name: 'Tech' },
    { id: 'music', name: 'Music' },
    { id: 'business', name: 'Business' },
    { id: 'sports', name: 'Sports' },
    { id: 'arts', name: 'Arts' },
    { id: 'food', name: 'Food' },
    { id: 'health', name: 'Health' },
  ];

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const newEvents = await getAllEvents();
        setEvents(newEvents.filter(isEvent));
        setLoading(false);
      } catch (error) {
        console.error('Error loading events:', error);
        setLoading(false);
      }
    };

    loadEvents();

    // Set up real-time listener for events table
    const channel = supabase
      .channel('events-page-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        loadEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const handleCreateEvent = async (eventData: Partial<Event>) => {
    try {
      await createEvent(eventData);
      setShowCreateForm(false);
      alert('Event created successfully!');
      // The real-time listener will automatically update the events list
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: Partial<Event>) => {
    try {
      await updateEvent(eventId, eventData);
      setEvents(events.map(event => 
        event.id === eventId ? { ...event, ...eventData } : event
      ));
      setEditingEvent(null);
      alert('Event updated successfully!');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        setEvents(events.filter(event => event.id !== eventId));
        alert('Event deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Failed to delete event: ${errorMessage}`);
      }
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           event.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-pink-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-purple-900">Events</h1>
                <p className="mt-1 text-sm text-purple-600">Manage all your events in one place</p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-secondary-500 to-accent-500 hover:shadow-lg hover:shadow-secondary-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition-all duration-200"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Stats Card - Total Events */}
            <div className="bg-white/80 backdrop-blur-xl overflow-hidden shadow-lg rounded-lg border border-pink-200/50">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-secondary-100 to-accent-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-purple-500 truncate">Total Events</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-purple-900">
                          {eventStats.loading ? (
                            <div className="animate-pulse h-8 w-12 bg-pink-200 rounded"></div>
                          ) : (
                            eventStats.totalEvents.toLocaleString()
                          )}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card - Active Events */}
            <div className="bg-white/80 backdrop-blur-xl overflow-hidden shadow-lg rounded-lg border border-pink-200/50">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-purple-500 truncate">Active Events</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-purple-900">
                          {eventStats.loading ? (
                            <div className="animate-pulse h-8 w-12 bg-pink-200 rounded"></div>
                          ) : (
                            eventStats.activeEvents.toLocaleString()
                          )}
                        </div>
                        <span className="ml-2 text-sm text-emerald-600 font-medium">
                          {((eventStats.activeEvents / eventStats.totalEvents) * 100).toFixed(1)}%
                        </span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card - Upcoming Events */}
            <div className="bg-white/80 backdrop-blur-xl overflow-hidden shadow-lg rounded-lg border border-pink-200/50">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-purple-500 truncate">Upcoming Events</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-purple-900">
                          {eventStats.loading ? (
                            <div className="animate-pulse h-8 w-12 bg-pink-200 rounded"></div>
                          ) : (
                            eventStats.upcomingEvents.toLocaleString()
                          )}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card - Total Attendees */}
            <div className="bg-white/80 backdrop-blur-xl overflow-hidden shadow-lg rounded-lg border border-pink-200/50">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-purple-500 truncate">Total Attendees</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-purple-900">
                          {eventStats.loading ? (
                            <div className="animate-pulse h-8 w-12 bg-pink-200 rounded"></div>
                          ) : (
                            eventStats.totalAttendees.toLocaleString()
                          )}
                        </div>
                        <span className="ml-2 text-sm text-blue-600 font-medium">
                          ~{(eventStats.totalAttendees / Math.max(eventStats.totalEvents, 1)).toFixed(1)} per event
                        </span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-lg">
              <label htmlFor="search" className="sr-only">Search events</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border-2 border-pink-200 rounded-md leading-5 bg-white/80 backdrop-blur-sm placeholder-purple-400 focus:outline-none focus:placeholder-purple-300 focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 sm:text-sm text-purple-900 font-medium"
                  placeholder="Search for events..."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                    ${selectedCategory === category.id
                      ? 'bg-gradient-to-r from-secondary-100 to-accent-100 text-secondary-800 shadow-md'
                      : 'bg-pink-100 text-purple-800 hover:bg-pink-200 hover:scale-105'
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={setEditingEvent}
                  onDelete={handleDeleteEvent}
                  onViewDetails={(event) => {
                    // TODO: Implement view details modal or navigation
                    console.log('View details:', event);
                  }}
                />
              ))}
            </div>
          )}
          {!loading && filteredEvents.length === 0 && (
            <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-lg shadow-lg border border-pink-200/50">
              <svg
                className="mx-auto h-12 w-12 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-purple-900">No events found</h3>
              <p className="mt-1 text-sm text-purple-500">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating a new event.'}
              </p>
            </div>
          )}
        </div>

        {/* Create/Edit Event Modal */}
        {(showCreateForm || editingEvent) && (
          <EventModal
            event={editingEvent || undefined}
            onClose={() => {
              setShowCreateForm(false);
              setEditingEvent(null);
            }}
            onSubmit={editingEvent ? 
              (data) => handleUpdateEvent(editingEvent.id, data) :
              handleCreateEvent
            }
            title={editingEvent ? 'Edit Event' : 'Create New Event'}
          />
        )}
      </div>
    </AdminLayout>
  );
}