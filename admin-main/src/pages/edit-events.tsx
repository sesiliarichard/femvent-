import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface Category {
  title: string;
  copy: string;
}

interface FeaturedEvent {
  title: string;
  city: string;
  date: string;
  summary: string;
  tags: string[];
}

interface EventsContent {
  categories: Category[];
  featuredEvents: FeaturedEvent[];
}

const DEFAULTS: EventsContent = {
  categories: [
    { title: "Concerts & Nightlife", copy: "Live sets, DJ residencies, rooftop sunsets, and late-night stories." },
    { title: "Business & Tech", copy: "Summits, pitch nights, founder circles, and product debuts." },
    { title: "Wellness & Lifestyle", copy: "Retreats, mindful mornings, fitness pop-ups, and spa residencies." },
    { title: "Arts & Culture", copy: "Gallery openings, film premieres, poetry lounges, and theatre." },
    { title: "Food & Beverage", copy: "Chef tables, tasting flights, cocktail labs, and food truck rallies." },
    { title: "Community & Impact", copy: "Give-back drives, learning labs, mentorship cohorts, and more." },
  ],
  featuredEvents: [
    { title: "Tech Founders Summit", city: "Nairobi", date: "Feb 15 • 09:00 EAT", summary: "A two-day conference for startup founders and investors.", tags: ["Business", "Networking", "Tech"] },
    { title: "Midnight Sessions", city: "Lagos", date: "Feb 28 • 22:00 WAT", summary: "Live music and DJ sets under the stars.", tags: ["Music", "Nightlife", "18+"] },
    { title: "Wellness Weekend", city: "Kigali", date: "Mar 8 • 08:00 CAT", summary: "Three days of yoga, meditation, and healthy living.", tags: ["Wellness", "Retreat", "Limited"] },
    { title: "Art & Design Fair", city: "Cape Town", date: "Mar 22 • 11:00 SAST", summary: "Local artists showcase their work at this weekend marketplace.", tags: ["Art", "Shopping", "Weekend"] },
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

  const updateEvent = (i: number, field: keyof FeaturedEvent, value: string) => {
    const updated = [...content.featuredEvents];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, featuredEvents: updated });
  };

  const removeEvent = (i: number) => {
    const updated = [...content.featuredEvents];
    updated.splice(i, 1);
    setContent({ ...content, featuredEvents: updated });
  };

  const addEvent = () => {
    setContent({ ...content, featuredEvents: [...content.featuredEvents, { title: '', city: '', date: '', summary: '', tags: [] }] });
  };

  const removeCategory = (i: number) => {
    const updated = [...content.categories];
    updated.splice(i, 1);
    setContent({ ...content, categories: updated });
  };

  const addCategory = () => {
    setContent({ ...content, categories: [...content.categories, { title: '', copy: '' }] });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Events Page</h1>
        <p className="text-sm text-gray-500">Update the text shown on femvents.netlify.app/events.</p>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">Categories</div>
        <div className="p-6 space-y-4">
          {content.categories.map((cat, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <label className="block text-xs font-medium text-gray-500">Category {i + 1} — Title</label>
                <button onClick={() => removeCategory(i)} className="text-xs text-red-600 font-semibold hover:text-red-700">Remove</button>
              </div>
              <input type="text" value={cat.title} onChange={(e) => updateCategory(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm" />
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <input type="text" value={cat.copy} onChange={(e) => updateCategory(i, 'copy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          ))}
          <button onClick={addCategory} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
            + Add category
          </button>
        </div>
      </div>

      {/* Featured Events */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">Featured Events</div>
        <div className="p-6 space-y-4">
          {content.featuredEvents.map((event, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <label className="block text-xs font-medium text-gray-500">Event {i + 1} — Title</label>
                <button onClick={() => removeEvent(i)} className="text-xs text-red-600 font-semibold hover:text-red-700">Remove</button>
              </div>
              <input type="text" value={event.title} onChange={(e) => updateEvent(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">City</label>
                  <input type="text" value={event.city} onChange={(e) => updateEvent(i, 'city', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Date</label>
                  <input type="text" value={event.date} onChange={(e) => updateEvent(i, 'date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <label className="block text-xs font-medium text-gray-500">Summary</label>
              <textarea value={event.summary} onChange={(e) => updateEvent(i, 'summary', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          ))}
          <button onClick={addEvent} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
            + Add event
          </button>
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-lg">
          {saving ? 'Saving...' : '💾 Save Events Page'}
        </button>
      </div>
    </AdminLayout>
  );
}