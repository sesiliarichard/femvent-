import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { ImageUploadWidget } from '../components/ImageUploadWidget';

interface Category {
  title: string;
  copy: string;
  image: string;
}

interface FeaturedEvent {
  title: string;
  city: string;
  date: string;
  summary: string;
  tags: string[];
  image: string;
}

interface Destination {
  city: string;
  stat: string;
}

interface EventsContent {
  categories: Category[];
  featuredEvents: FeaturedEvent[];
  destinations: Destination[];
}

const DEFAULTS: EventsContent = {
  categories: [
    { title: "Concerts & Nightlife", copy: "Live sets, DJ residencies, rooftop sunsets, and late-night stories.", image: "" },
    { title: "Business & Tech", copy: "Summits, pitch nights, founder circles, and product debuts.", image: "" },
    { title: "Wellness & Lifestyle", copy: "Retreats, mindful mornings, fitness pop-ups, and spa residencies.", image: "" },
    { title: "Arts & Culture", copy: "Gallery openings, film premieres, poetry lounges, and theatre.", image: "" },
    { title: "Food & Beverage", copy: "Chef tables, tasting flights, cocktail labs, and food truck rallies.", image: "" },
    { title: "Community & Impact", copy: "Give-back drives, learning labs, mentorship cohorts, and more.", image: "" },
  ],
  featuredEvents: [
    { title: "Tech Founders Summit", city: "Nairobi", date: "Feb 15 • 09:00 EAT", summary: "A two-day conference for startup founders and investors.", tags: ["Business", "Networking", "Tech"], image: "" },
    { title: "Midnight Sessions", city: "Lagos", date: "Feb 28 • 22:00 WAT", summary: "Live music and DJ sets under the stars.", tags: ["Music", "Nightlife", "18+"], image: "" },
    { title: "Wellness Weekend", city: "Kigali", date: "Mar 8 • 08:00 CAT", summary: "Three days of yoga, meditation, and healthy living.", tags: ["Wellness", "Retreat", "Limited"], image: "" },
    { title: "Art & Design Fair", city: "Cape Town", date: "Mar 22 • 11:00 SAST", summary: "Local artists showcase their work at this weekend marketplace.", tags: ["Art", "Shopping", "Weekend"], image: "" },
  ],
  destinations: [
    { city: "Nairobi", stat: "48 upcoming events" },
    { city: "Lagos", stat: "62 upcoming events" },
    { city: "Kigali", stat: "21 upcoming events" },
    { city: "Cape Town", stat: "35 upcoming events" },
  ],
};

export default function EditEventsPage() {
  const [content, setContent] = useState<EventsContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('site', 'web-main')
        .maybeSingle();

      if (error) throw error;

      if (data?.content) {
        setContent({
          categories: data.content.categories || DEFAULTS.categories,
          featuredEvents: data.content.featuredEvents || DEFAULTS.featuredEvents,
          destinations: data.content.destinations || DEFAULTS.destinations,
        });
      }
    } catch (err) {
      console.error('Error fetching events content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_content')
        .select('content')
        .eq('site', 'web-main')
        .maybeSingle();

        const mergedContent = {
          ...(existing?.content || {}),
          categories: content.categories,
          featuredEvents: content.featuredEvents,
          destinations: content.destinations,
        };

      const { error } = await supabase
        .from('site_content')
        .upsert(
          { site: 'web-main', content: mergedContent, updated_at: new Date().toISOString() },
          { onConflict: 'site' }
        );

      if (error) throw error;
      alert('✅ Events page saved!');
    } catch (err) {
      console.error('Error saving events content:', err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateCategory = (i: number, field: keyof Category, value: string) => {
    const updated = [...content.categories];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, categories: updated });
  };

  const updateEvent = (i: number, field: keyof Omit<FeaturedEvent, 'tags'>, value: string) => {
    const updated = [...content.featuredEvents];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, featuredEvents: updated });
  };

  const updateEventTags = (i: number, value: string) => {
    const updated = [...content.featuredEvents];
    updated[i] = { ...updated[i], tags: value.split(',').map((t) => t.trim()).filter(Boolean) };
    setContent({ ...content, featuredEvents: updated });
  };

  const removeEvent = (i: number) => {
    const updated = [...content.featuredEvents];
    updated.splice(i, 1);
    setContent({ ...content, featuredEvents: updated });
  };

  const addEvent = () => {
    setContent({ ...content, featuredEvents: [...content.featuredEvents, { title: '', city: '', date: '', summary: '', tags: [], image: '' }] });
  };

  const removeCategory = (i: number) => {
    const updated = [...content.categories];
    updated.splice(i, 1);
    setContent({ ...content, categories: updated });
  };

  const addCategory = () => {
    setContent({ ...content, categories: [...content.categories, { title: '', copy: '', image: '' }] });
  };

  const updateDestination = (i: number, field: keyof Destination, value: string) => {
    const updated = [...content.destinations];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, destinations: updated });
  };

  const removeDestination = (i: number) => {
    const updated = [...content.destinations];
    updated.splice(i, 1);
    setContent({ ...content, destinations: updated });
  };

  const addDestination = () => {
    setContent({ ...content, destinations: [...content.destinations, { city: '', stat: '' }] });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen bg-[#FBF3FA]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#D9C9E0] border-t-[#9B1F5C]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2E1F45]">Edit Events Page</h1>
        <p className="text-sm text-[#5C4A6B] mt-1">Update the text and images shown on femvents.netlify.app/events.</p>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-sm border border-[#D9C9E0] mb-5 overflow-hidden">
        <div className="px-6 py-3 bg-[#E8743B] text-[#2E1F45] font-bold text-sm">Categories</div>
        <div className="p-6 space-y-4">
          {content.categories.map((cat, i) => (
            <div key={i} className="border border-[#D9C9E0] rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-start">
                <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider">Category {i + 1} — Title</label>
                <button onClick={() => removeCategory(i)} className="text-xs text-[#9B1F5C] font-bold hover:opacity-70">Remove</button>
              </div>
              <input type="text" value={cat.title} onChange={(e) => updateCategory(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
              <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider">Description</label>
              <input type="text" value={cat.copy} onChange={(e) => updateCategory(i, 'copy', e.target.value)} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
              <ImageUploadWidget
                label="Category Image"
                value={cat.image}
                onChange={(url) => updateCategory(i, 'image', url)}
                folder="events"
              />
            </div>
          ))}
 <button onClick={addCategory} className="w-full py-2 border-2 border-dashed border-[#D9C9E0] rounded-sm text-sm font-medium text-[#8A7A96] hover:border-[#9B1F5C] hover:text-[#9B1F5C] transition-colors">
            + Add category
          </button>
        </div>
      </div>

      {/* Destinations */}
      <div className="bg-white rounded-sm border border-[#D9C9E0] mb-5 overflow-hidden">
        <div className="px-6 py-3 bg-[#C9508A] text-[#FBF3FA] font-bold text-sm">Browse By City (sidebar)</div>
        <div className="p-6 space-y-4">
          {content.destinations.map((dest, i) => (
            <div key={i} className="border border-[#D9C9E0] rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-start">
                <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider">City {i + 1}</label>
                <button onClick={() => removeDestination(i)} className="text-xs text-[#9B1F5C] font-bold hover:opacity-70">Remove</button>
              </div>
              <input type="text" value={dest.city} onChange={(e) => updateDestination(i, 'city', e.target.value)} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
              <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider">Stat</label>
              <input type="text" value={dest.stat} onChange={(e) => updateDestination(i, 'stat', e.target.value)} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
            </div>
          ))}
          <button onClick={addDestination} className="w-full py-2 border-2 border-dashed border-[#D9C9E0] rounded-sm text-sm font-medium text-[#8A7A96] hover:border-[#9B1F5C] hover:text-[#9B1F5C] transition-colors">
            + Add city
          </button>
        </div>
      </div>

      {/* Featured Events */}
      <div className="bg-white rounded-sm border border-[#D9C9E0] mb-5 overflow-hidden">
        <div className="px-6 py-3 bg-[#4A3B78] text-[#FBF3FA] font-bold text-sm">Featured Events</div>
        <div className="p-6 space-y-4">
          {content.featuredEvents.map((event, i) => (
            <div key={i} className="border border-[#D9C9E0] rounded-sm p-4 space-y-3">
              <div className="flex justify-between items-start">
                <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider">Event {i + 1} — Title</label>
                <button onClick={() => removeEvent(i)} className="text-xs text-[#9B1F5C] font-bold hover:opacity-70">Remove</button>
              </div>
              <input type="text" value={event.title} onChange={(e) => updateEvent(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider mb-1">City</label>
                  <input type="text" value={event.city} onChange={(e) => updateEvent(i, 'city', e.target.value)} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider mb-1">Date</label>
                  <input type="text" value={event.date} onChange={(e) => updateEvent(i, 'date', e.target.value)} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
                </div>
              </div>
              <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider">Summary</label>
              <textarea value={event.summary} onChange={(e) => updateEvent(i, 'summary', e.target.value)} rows={2} className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]" />
              <label className="block text-xs font-bold text-[#8A7A96] uppercase tracking-wider">Tags (comma separated)</label>
              <input
                type="text"
                value={event.tags.join(', ')}
                onChange={(e) => updateEventTags(i, e.target.value)}
                className="w-full px-3 py-2 border border-[#D9C9E0] rounded-sm text-sm outline-none focus:ring-2 focus:ring-[#9B1F5C]"
              />
              <ImageUploadWidget
                label="Event Image"
                value={event.image}
                onChange={(url) => updateEvent(i, 'image', url)}
                folder="events"
              />
            </div>
          ))}
          <button onClick={addEvent} className="w-full py-2 border-2 border-dashed border-[#D9C9E0] rounded-sm text-sm font-medium text-[#8A7A96] hover:border-[#9B1F5C] hover:text-[#9B1F5C] transition-colors">
            + Add event
          </button>
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-[#2E1F45] text-[#FBF3FA] rounded-sm hover:bg-[#3D2A5C] disabled:opacity-50 font-bold text-sm shadow-lg">
          {saving ? 'Saving...' : 'Save Events Page'}
        </button>
      </div>
    </AdminLayout>
  );
}