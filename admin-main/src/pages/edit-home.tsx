import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { EditableText } from '../components/EditableText';
import { EditableImage } from '../components/EditableImage';

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

  const saveField = async (field: keyof HomeContent, value: string) => {
    const updated = { ...content, [field]: value };
    setContent(updated);
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_content')
        .select('content')
        .eq('site', 'web-main')
        .maybeSingle();

      const mergedContent = { ...(existing?.content || {}), home: updated };

      const { error } = await supabase
        .from('site_content')
        .upsert(
          { site: 'web-main', content: mergedContent, updated_at: new Date().toISOString() },
          { onConflict: 'site' }
        );

      if (error) throw error;
    } catch (err) {
      console.error('Error saving home content:', err);
      alert('Failed to save — your change may not have been kept.');
    } finally {
      setSaving(false);
    }
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Home Page</h1>
          <p className="text-sm text-gray-500">Click any text or image below to edit it. Changes save automatically.</p>
        </div>
        {saving && <span className="text-sm text-blue-600 font-medium">Saving...</span>}
      </div>

      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
        <main className="min-h-screen pb-20">
          {/* Hero Section */}
          <section className="mx-auto max-w-7xl px-6 pt-24 pb-16 md:pt-32">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-8">
                <div className="inline-block rounded-full bg-rose-50 text-rose-600 border border-rose-100 px-4 py-1.5 text-sm font-semibold">
                  <EditableText value={content.heroBadge} onChange={(v) => saveField('heroBadge', v)} />
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-gray-900 md:text-8xl leading-[0.9]">
                  <EditableText value={content.heroTitleLine1} onChange={(v) => saveField('heroTitleLine1', v)} /> <br />
                  <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                    <EditableText value={content.heroTitleLine2} onChange={(v) => saveField('heroTitleLine2', v)} />
                  </span>
                </h1>
                <p className="max-w-md text-xl font-medium text-gray-500 leading-relaxed">
                  <EditableText value={content.heroDescription} onChange={(v) => saveField('heroDescription', v)} multiline />
                </p>
              </div>

              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-12">
                  <div className="aspect-[3/4] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                    <EditableImage
                      src={content.heroImage1}
                      onChange={(url) => saveField('heroImage1', url)}
                      alt="Event"
                      folder="home"
                      className="w-full h-full"
                      imgClassName="object-cover w-full h-full"
                    />
                  </div>
                  <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                    <div className="w-full h-full bg-rose-500 p-6 flex flex-col justify-between">
                      <span className="text-white/50 font-mono text-xs">01</span>
                      <span className="text-white font-bold text-3xl tracking-tighter">
                        <EditableText value={content.liveNowLabel} onChange={(v) => saveField('liveNowLabel', v)} className="text-white" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="aspect-square rounded-2xl bg-black overflow-hidden border border-gray-800">
                    <div className="w-full h-full p-6 flex flex-col justify-between text-white">
                      <span className="text-gray-500 font-mono text-xs">STATS</span>
                      <div>
                        <span className="block text-4xl font-bold tracking-tighter">
                          <EditableText value={content.statNumber} onChange={(v) => saveField('statNumber', v)} className="text-white" />
                        </span>
                        <span className="text-gray-500 font-medium">
                          <EditableText value={content.statLabel} onChange={(v) => saveField('statLabel', v)} className="text-gray-300" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="aspect-[3/4] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                    <EditableImage
                      src={content.heroImage2}
                      onChange={(url) => saveField('heroImage2', url)}
                      alt="Event"
                      folder="home"
                      className="w-full h-full"
                      imgClassName="object-cover w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bento Grid */}
          <section className="mx-auto max-w-7xl px-6 py-24">
            <div className="mb-12">
              <h2 className="text-4xl font-black tracking-tighter">
                <EditableText value={content.bentoTitle} onChange={(v) => saveField('bentoTitle', v)} />
              </h2>
              <p className="text-gray-500 mt-2 text-lg">
                <EditableText value={content.bentoSubtitle} onChange={(v) => saveField('bentoSubtitle', v)} />
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[800px] md:h-[600px]">
              <div className="relative group md:col-span-2 md:row-span-2 rounded-3xl overflow-hidden bg-gray-100 border border-gray-200">
                <EditableImage
                  src={content.nairobiImage}
                  onChange={(url) => saveField('nairobiImage', url)}
                  alt="City"
                  folder="home"
                  className="absolute inset-0"
                  imgClassName="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end pointer-events-none">
                  <span className="text-white/60 font-mono text-xs mb-2 pointer-events-auto">
                    <EditableText value={content.nairobiTag} onChange={(v) => saveField('nairobiTag', v)} className="text-white/60" />
                  </span>
                  <h3 className="text-white text-4xl font-bold tracking-tighter pointer-events-auto">
                    <EditableText value={content.nairobiTitle} onChange={(v) => saveField('nairobiTitle', v)} className="text-white" />
                  </h3>
                  <p className="text-white/80 mt-2 pointer-events-auto">
                    <EditableText value={content.nairobiDescription} onChange={(v) => saveField('nairobiDescription', v)} className="text-white/80" />
                  </p>
                </div>
              </div>

              <div className="relative md:col-span-1 md:row-span-1 rounded-3xl overflow-hidden bg-rose-50 border border-rose-100 p-6 flex flex-col justify-between">
                <span className="text-rose-600 font-bold text-xl">🔥 Hot Picks</span>
                <div>
                  <div className="text-4xl font-black tracking-tighter text-gray-900 mb-1">
                    <EditableText value={content.hotPicksCount} onChange={(v) => saveField('hotPicksCount', v)} />
                  </div>
                  <div className="text-gray-500 text-sm">
                    <EditableText value={content.hotPicksLabel} onChange={(v) => saveField('hotPicksLabel', v)} />
                  </div>
                </div>
              </div>

              <div className="relative md:col-span-1 md:row-span-2 rounded-3xl overflow-hidden bg-gray-900 border border-gray-800">
                <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                  <span className="text-white/60 text-xs font-mono">
                    <EditableText value={content.midnightTag} onChange={(v) => saveField('midnightTag', v)} className="text-white/60" />
                  </span>
                  <h3 className="text-white text-2xl font-bold leading-tight">
                    <EditableText value={content.midnightTitle} onChange={(v) => saveField('midnightTitle', v)} className="text-white" multiline />
                  </h3>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
              </div>

              <div className="relative md:col-span-1 md:row-span-1 rounded-3xl overflow-hidden bg-white border border-gray-200 p-6 flex flex-col justify-center items-center text-center">
                <span className="text-4xl mb-2">🎨</span>
                <span className="font-bold text-gray-900">
                  <EditableText value={content.artCultureLabel} onChange={(v) => saveField('artCultureLabel', v)} />
                </span>
              </div>
            </div>
          </section>

          {/* Featured Events heading */}
          <section className="mx-auto max-w-7xl px-6 pb-24">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-4xl font-black tracking-tighter">
                <EditableText value={content.upcomingTitle} onChange={(v) => saveField('upcomingTitle', v)} />
              </h2>
            </div>
            <p className="text-sm text-gray-400 italic">
              Featured event cards below are edited on the "Featured Events" tab in Website Content.
            </p>
          </section>

          {/* Big CTA */}
          <section className="mx-auto max-w-7xl px-6 mb-20">
            <div className="rounded-[2.5rem] bg-gradient-to-br from-rose-900 via-purple-900 to-black text-white p-12 md:p-24 text-center relative">
              <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none bg-gradient-to-br from-white via-rose-100 to-purple-200 bg-clip-text text-transparent">
                  <EditableText value={content.ctaTitleLine1} onChange={(v) => saveField('ctaTitleLine1', v)} className="text-white" /><br />
                  <EditableText value={content.ctaTitleLine2} onChange={(v) => saveField('ctaTitleLine2', v)} className="text-white" />
                </h2>
                <p className="text-lg text-gray-400 font-medium">
                  <EditableText value={content.ctaDescription} onChange={(v) => saveField('ctaDescription', v)} className="text-gray-300" />
                </p>
                <div className="inline-block h-14 px-10 rounded-full bg-white text-rose-600 font-bold text-lg flex items-center justify-center">
                  <EditableText value={content.ctaButtonText} onChange={(v) => saveField('ctaButtonText', v)} />
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AdminLayout>
  );
}