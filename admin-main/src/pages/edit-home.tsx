import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { ImageUploadWidget } from '../components/ImageUploadWidget';

interface HomeContent {
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescription: string;
  heroImage1: string;
  heroImage2: string;
  liveNowLabel: string;
  statNumber: string;
  statLabel: string;
  bentoTitle: string;
  bentoSubtitle: string;
  nairobiImage: string;
  nairobiTag: string;
  nairobiTitle: string;
  nairobiDescription: string;
  hotPicksCount: string;
  hotPicksLabel: string;
  midnightTag: string;
  midnightTitle: string;
  artCultureLabel: string;
  upcomingTitle: string;
  ctaTitleLine1: string;
  ctaTitleLine2: string;
  ctaDescription: string;
  ctaButtonText: string;
}

const DEFAULTS: HomeContent = {
  heroBadge: "Now live in 12 cities",
  heroTitleLine1: "Events,",
  heroTitleLine2: "Reimagined.",
  heroDescription: "Discover the most curated events across Africa. From underground raves to tech summits.",
  heroImage1: "/kuzasteam-hero-1.jpg",
  heroImage2: "/kuzasteam-hero-2.jpg",
  liveNowLabel: "Live Now",
  statNumber: "1.2M",
  statLabel: "Tickets Sold",
  bentoTitle: "Curated Collections.",
  bentoSubtitle: "Hand-picked events for every vibe.",
  nairobiImage: "/nairobi.png",
  nairobiTag: "TRENDING CITY",
  nairobiTitle: "Nairobi",
  nairobiDescription: "The pulse of East African tech and culture.",
  hotPicksCount: "12",
  hotPicksLabel: "Events selling out fast",
  midnightTag: "FEATURED",
  midnightTitle: "Midnight Sessions",
  artCultureLabel: "Art & Culture",
  upcomingTitle: "Upcoming Drops.",
  ctaTitleLine1: "Ready to go",
  ctaTitleLine2: "Live?",
  ctaDescription: "Join 5,000+ organizers creating the future of events.",
  ctaButtonText: "Start Creating",
};

const FIELD_LABELS: Record<keyof HomeContent, string> = {
  heroBadge: "Hero Badge Text",
  heroTitleLine1: "Hero Title (Line 1)",
  heroTitleLine2: "Hero Title (Line 2, coloured)",
  heroDescription: "Hero Description",
  heroImage1: "Hero Image 1",
  heroImage2: "Hero Image 2",
  liveNowLabel: "\"Live Now\" Card Label",
  statNumber: "Stat Number (e.g. 1.2M)",
  statLabel: "Stat Label (e.g. Tickets Sold)",
  bentoTitle: "Collections Section Title",
  bentoSubtitle: "Collections Section Subtitle",
  nairobiImage: "Trending City Image",
  nairobiTag: "Trending City Tag",
  nairobiTitle: "Trending City Name",
  nairobiDescription: "Trending City Description",
  hotPicksCount: "Hot Picks Count",
  hotPicksLabel: "Hot Picks Label",
  midnightTag: "Featured Card Tag",
  midnightTitle: "Featured Card Title",
  artCultureLabel: "Small Card Label",
  upcomingTitle: "Upcoming Events Section Title",
  ctaTitleLine1: "CTA Title (Line 1)",
  ctaTitleLine2: "CTA Title (Line 2)",
  ctaDescription: "CTA Description",
  ctaButtonText: "CTA Button Text",
};

const IMAGE_FIELDS: (keyof HomeContent)[] = ['heroImage1', 'heroImage2', 'nairobiImage'];
const TEXTAREA_FIELDS: (keyof HomeContent)[] = ['heroDescription', 'nairobiDescription', 'ctaDescription'];

export default function EditHomePage() {
  const [content, setContent] = useState<HomeContent>(DEFAULTS);
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

      if (data?.content?.home) {
        setContent({ ...DEFAULTS, ...data.content.home });
      }
    } catch (err) {
      console.error('Error fetching home content:', err);
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

      const mergedContent = { ...(existing?.content || {}), home: content };

      const { error } = await supabase
        .from('site_content')
        .upsert(
          { site: 'web-main', content: mergedContent, updated_at: new Date().toISOString() },
          { onConflict: 'site' }
        );

      if (error) throw error;
      alert('✅ Home page saved! Changes will appear on the live site shortly.');
    } catch (err) {
      console.error('Error saving home content:', err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof HomeContent, value: string) => {
    setContent({ ...content, [field]: value });
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

  const sections: { title: string; fields: (keyof HomeContent)[] }[] = [
    { title: "Hero Section", fields: ["heroBadge", "heroTitleLine1", "heroTitleLine2", "heroDescription", "heroImage1", "heroImage2", "liveNowLabel", "statNumber", "statLabel"] },
    { title: "Curated Collections", fields: ["bentoTitle", "bentoSubtitle", "nairobiImage", "nairobiTag", "nairobiTitle", "nairobiDescription", "hotPicksCount", "hotPicksLabel", "midnightTag", "midnightTitle", "artCultureLabel"] },
    { title: "Upcoming Events", fields: ["upcomingTitle"] },
    { title: "Call to Action", fields: ["ctaTitleLine1", "ctaTitleLine2", "ctaDescription", "ctaButtonText"] },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Home Page</h1>
        <p className="text-sm text-gray-500">Update the text and images shown on femvents.netlify.app.</p>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">
            {section.title}
          </div>
          <div className="p-6 space-y-5">
            {section.fields.map((field) => (
              <div key={field}>
                {IMAGE_FIELDS.includes(field) ? (
                  <ImageUploadWidget
                    label={FIELD_LABELS[field]}
                    value={content[field]}
                    onChange={(url) => update(field, url)}
                    folder="home"
                  />
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{FIELD_LABELS[field]}</label>
                    {TEXTAREA_FIELDS.includes(field) ? (
                      <textarea
                        value={content[field]}
                        onChange={(e) => update(field, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={content[field]}
                        onChange={(e) => update(field, e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end sticky bottom-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-lg"
        >
          {saving ? 'Saving...' : '💾 Save Home Page'}
        </button>
      </div>
    </AdminLayout>
  );
}