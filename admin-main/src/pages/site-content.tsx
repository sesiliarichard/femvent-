import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface FeaturedEvent {
    title: string;
    city: string;
    date: string;
    summary: string;
    tags: string[];
  }
  
  interface Category {
    title: string;
    copy: string;
  }
  
  interface OrganizerSpotlight {
    name: string;
    focus: string;
    stat: string;
    blurb: string;
  }
  
  interface ImpactStat {
    label: string;
    value: string;
    detail: string;
  }
  
  interface BlogPost {
    title: string;
    excerpt: string;
    author: string;
    date: string;
  }
  
  interface FaqItem {
    question: string;
    answer: string;
  }
  
  interface SupportTopic {
    title: string;
    items: string[];
  }
  
  interface SiteContentData {
    brand: {
      name: string;
      tagline: string;
      description: string;
    };
    categories: Category[];
    featuredEvents: FeaturedEvent[];
    organizerSpotlights: OrganizerSpotlight[];
    impactStats: ImpactStat[];
    blogPosts: BlogPost[];
    faq: FaqItem[];
    supportTopics: SupportTopic[];
  }
const DEFAULTS: SiteContentData = {
  brand: {
    name: "FemVents",
    tagline: "Discover and create amazing events across Africa",
    description:
      "FemVents connects event organizers with attendees across Africa. Whether you're hosting a summit, concert, or community meetup, we make it easy to create, promote, and sell tickets for your events.",
  },
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
  organizerSpotlights: [
    { name: "Nova Stage Collective", focus: "Music and nightlife events", stat: "36 sold-out shows", blurb: "Using FemVents for ticket sales and check-in, Nova Stage has seen more repeat attendees and smoother event operations." },
    { name: "Elevate Studio", focus: "Corporate retreats and workshops", stat: "4.9 ★ rating", blurb: "With custom branding and easy payment processing, Elevate Studio manages multi-country events without the usual headaches." },
    { name: "Bloom Gatherings", focus: "Markets and pop-up events", stat: "120+ vendors", blurb: "Vendor registration, instant payouts, and real-time sales tracking have made Bloom's festival circuit much easier to manage." },
  ],
  impactStats: [
    { label: "Communities activated", value: "210+", detail: "across 12 countries" },
    { label: "Tickets issued", value: "1.2M", detail: "with 82% retention" },
    { label: "Avg. NPS", value: "67", detail: "across hosts & guests" },
    { label: "Campaign lift", value: "3.4x", detail: "vs. generic ads" },
  ],
  blogPosts: [
    { title: "How to Create Events People Actually Want to Attend", excerpt: "Tips from successful event organizers on creating memorable experiences that keep people coming back.", author: "Sarah Johnson", date: "Jan 20, 2026" },
    { title: "Event Trends We're Seeing in 2026", excerpt: "From hybrid events to community-focused gatherings, here's what's working for organizers this year.", author: "Michael Ochieng", date: "Jan 12, 2026" },
    { title: "Success Story: How Bloom Gatherings Grew Their Events", excerpt: "Learn how one organizer went from small local meetups to hosting events across three cities in under a year.", author: "FemVents Team", date: "Jan 5, 2026" },
  ],
  faq: [
    { question: "How do I create an event on FemVents?", answer: "Download the app, create an organizer account, and fill in your event details including date, location, and ticket prices. You can publish your event in minutes." },
    { question: "Can I create private or invite-only events?", answer: "Yes. You can set up password-protected events, send direct invitations, or create events that don't appear in public searches." },
    { question: "What currencies do you support for payments?", answer: "We support USD, KES, NGN, ZAR, and other major African currencies. Payouts are processed within 3-5 business days after your event." },
    { question: "Can I promote my event through social media?", answer: "Absolutely. Share your event directly to Facebook, Instagram, Twitter, and WhatsApp from the app." },
  ],
  supportTopics: [
    { title: "Getting Started", items: ["Download FemVents on iOS / Android", "Host onboarding checklist", "Migrating existing attendees"] },
    { title: "Ticketing & Access", items: ["Dynamic pricing tiers", "Group passes & bulk imports", "On-site scanning playbook"] },
    { title: "Marketing & Growth", items: ["Smart audiences", "Promo codes + referral loops", "Attribution dashboards"] },
    { title: "Finance & Compliance", items: ["Supported currencies", "Settlement schedules", "KYC / AML overview"] },
  ],
};

export default function SiteContentPage() {
  const [content, setContent] = useState<SiteContentData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'brand' | 'categories' | 'events' | 'organizers' | 'stats' | 'blog' | 'faq' | 'support'>('brand');

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
          brand: { ...DEFAULTS.brand, ...(data.content.brand || {}) },
          categories: data.content.categories || DEFAULTS.categories,
          featuredEvents: data.content.featuredEvents || DEFAULTS.featuredEvents,
          organizerSpotlights: data.content.organizerSpotlights || DEFAULTS.organizerSpotlights,
          impactStats: data.content.impactStats || DEFAULTS.impactStats,
          blogPosts: data.content.blogPosts || DEFAULTS.blogPosts,
          faq: data.content.faq || DEFAULTS.faq,
          supportTopics: data.content.supportTopics || DEFAULTS.supportTopics,
        });
      }
    } catch (error) {
      console.error('Error fetching site content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_content')
        .select('id, content')
        .eq('site', 'web-main')
        .maybeSingle();

      const mergedContent = { ...(existing?.content || {}), ...content };

      const { error } = await supabase
        .from('site_content')
        .upsert(
          {
            site: 'web-main',
            content: mergedContent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'site' }
        );

      if (error) throw error;
      alert('✅ Site content saved! Changes will appear on the live site shortly.');
    } catch (error) {
      console.error('Error saving site content:', error);
      alert('Failed to save site content');
    } finally {
      setSaving(false);
    }
  };

  const updateCategory = (index: number, field: keyof Category, value: string) => {
    const updated = [...content.categories];
    updated[index] = { ...updated[index], [field]: value };
    setContent({ ...content, categories: updated });
  };

  const updateEvent = (index: number, field: keyof FeaturedEvent, value: string) => {
    const updated = [...content.featuredEvents];
    updated[index] = { ...updated[index], [field]: value };
    setContent({ ...content, featuredEvents: updated });
  };

  const addItem = <K extends keyof SiteContentData>(key: K, blank: any) => {
    setContent({ ...content, [key]: [...(content[key] as any[]), blank] });
  };

  const removeItem = <K extends keyof SiteContentData>(key: K, index: number) => {
    const updated = [...(content[key] as any[])];
    updated.splice(index, 1);
    setContent({ ...content, [key]: updated });
  };

  const updateListItem = <K extends keyof SiteContentData>(key: K, index: number, field: string, value: string) => {
    const updated = [...(content[key] as any[])];
    updated[index] = { ...updated[index], [field]: value };
    setContent({ ...content, [key]: updated });
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
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Website Content</h1>
          <p className="text-gray-600">Edit the text shown on femvents.netlify.app — no code needed.</p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
            { key: 'brand', label: 'Brand & Home' },
            { key: 'categories', label: 'Categories' },
            { key: 'events', label: 'Featured Events' },
            { key: 'organizers', label: 'Organizer Stories' },
            { key: 'stats', label: 'Impact Stats' },
            { key: 'blog', label: 'Blog Posts' },
            { key: 'faq', label: 'FAQ' },
            { key: 'support', label: 'Support Topics' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={content.brand.name}
                  onChange={(e) => setContent({ ...content, brand: { ...content.brand, name: e.target.value } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                <input
                  type="text"
                  value={content.brand.tagline}
                  onChange={(e) => setContent({ ...content, brand: { ...content.brand, tagline: e.target.value } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={content.brand.description}
                  onChange={(e) => setContent({ ...content, brand: { ...content.brand, description: e.target.value } })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

{activeTab === 'categories' && (
            <div className="space-y-4">
              {content.categories.map((cat, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <label className="block text-xs font-medium text-gray-500">Category {i + 1} — Title</label>
                    <button onClick={() => removeItem('categories', i)} className="text-xs text-red-600 font-semibold hover:text-red-700">Remove</button>
                  </div>
                  <input
                    type="text"
                    value={cat.title}
                    onChange={(e) => updateCategory(i, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={cat.copy}
                    onChange={(e) => updateCategory(i, 'copy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <button
                onClick={() => addItem('categories', { title: 'New Category', copy: '' })}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add category
              </button>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              {content.featuredEvents.map((event, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <label className="block text-xs font-medium text-gray-500">Event {i + 1} — Title</label>
                    <button onClick={() => removeItem('featuredEvents', i)} className="text-xs text-red-600 font-semibold hover:text-red-700">Remove</button>
                  </div>
                  <input
                    type="text"
                    value={event.title}
                    onChange={(e) => updateEvent(i, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">City</label>
                      <input
                        type="text"
                        value={event.city}
                        onChange={(e) => updateEvent(i, 'city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Date</label>
                      <input
                        type="text"
                        value={event.date}
                        onChange={(e) => updateEvent(i, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <label className="block text-xs font-medium text-gray-500">Summary</label>
                  <textarea
                    value={event.summary}
                    onChange={(e) => updateEvent(i, 'summary', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <button
                onClick={() => addItem('featuredEvents', { title: 'New Event', city: '', date: '', summary: '', tags: [] })}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add event
              </button>
            </div>
          )}

          {activeTab === 'organizers' && (
            <div className="space-y-4">
              {content.organizerSpotlights.map((org, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <label className="block text-xs font-medium text-gray-500">Organizer {i + 1} — Name</label>
                    <button onClick={() => removeItem('organizerSpotlights', i)} className="text-xs text-red-600 font-semibold hover:text-red-700">Remove</button>
                  </div>
                  <input type="text" value={org.name} onChange={(e) => updateListItem('organizerSpotlights', i, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <label className="block text-xs font-medium text-gray-500">Focus</label>
                  <input type="text" value={org.focus} onChange={(e) => updateListItem('organizerSpotlights', i, 'focus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <label className="block text-xs font-medium text-gray-500">Stat</label>
                  <input type="text" value={org.stat} onChange={(e) => updateListItem('organizerSpotlights', i, 'stat', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <label className="block text-xs font-medium text-gray-500">Blurb</label>
                  <textarea value={org.blurb} onChange={(e) => updateListItem('organizerSpotlights', i, 'blurb', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <button onClick={() => addItem('organizerSpotlights', { name: '', focus: '', stat: '', blurb: '' })} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                + Add organizer story
              </button>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              {content.impactStats.map((stat, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <label className="block text-xs font-medium text-gray-500">Stat {i + 1} — Label</label>
                    <button onClick={() => removeItem('impactStats', i)} className="text-xs text-red-600 font-semibold hover:text-red-700">Remove</button>
                  </div>
                  <input type="text" value={stat.label} onChange={(e) => updateListItem('impactStats', i, 'label', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Value</label>
                      <input type="text" value={stat.value} onChange={(e) => updateListItem('impactStats', i, 'value', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Detail</label>
                      <input type="text" value={stat.detail} onChange={(e) => updateListItem('impactStats', i, 'detail', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => addItem('impactStats', { label: '', value: '', detail: '' })} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                + Add stat
              </button>
            </div>
          )}

          {activeTab === 'blog' && (
            <div className="space-y-4">
              {content.blogPosts.map((post, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <label className="block text-xs font-medium text-gray-500">Post {i + 1} — Title</label>
                    <button onClick={() => removeItem('blogPosts', i)} className="text-xs text-red-600 font-semibold hover:text-red-700">Remove</button>
                  </div>
                  <input type="text" value={post.title} onChange={(e) => updateListItem('blogPosts', i, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <label className="block text-xs font-medium text-gray-500">Excerpt</label>
                  <textarea value={post.excerpt} onChange={(e) => updateListItem('blogPosts', i, 'excerpt', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Author</label>
                      <input type="text" value={post.author} onChange={(e) => updateListItem('blogPosts', i, 'author', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Date</label>
                      <input type="text" value={post.date} onChange={(e) => updateListItem('blogPosts', i, 'date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => addItem('blogPosts', { title: '', excerpt: '', author: '', date: '' })} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                + Add blog post
              </button>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-4">
              {content.faq.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <label className="block text-xs font-medium text-gray-500">Question {i + 1}</label>
                    <button onClick={() => removeItem('faq', i)} className="text-xs text-red-600 font-semibold hover:text-red-700">Remove</button>
                  </div>
                  <input type="text" value={item.question} onChange={(e) => updateListItem('faq', i, 'question', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <label className="block text-xs font-medium text-gray-500">Answer</label>
                  <textarea value={item.answer} onChange={(e) => updateListItem('faq', i, 'answer', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <button onClick={() => addItem('faq', { question: '', answer: '' })} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                + Add FAQ item
              </button>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              {content.supportTopics.map((topic, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <label className="block text-xs font-medium text-gray-500">Topic {i + 1} — Title</label>
                    <button onClick={() => removeItem('supportTopics', i)} className="text-xs text-red-600 font-semibold hover:text-red-700">Remove</button>
                  </div>
                  <input type="text" value={topic.title} onChange={(e) => updateListItem('supportTopics', i, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <label className="block text-xs font-medium text-gray-500">Items (one per line)</label>
                  <textarea
                    value={topic.items.join('\n')}
                    onChange={(e) => {
                      const updated = [...content.supportTopics];
                      updated[i] = { ...updated[i], items: e.target.value.split('\n') };
                      setContent({ ...content, supportTopics: updated });
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <button onClick={() => addItem('supportTopics', { title: '', items: [] })} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                + Add support topic
              </button>
            </div>
          )}
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}