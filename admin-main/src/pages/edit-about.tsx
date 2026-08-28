import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { ImageUploadWidget } from '../components/ImageUploadWidget';

interface Guide {
  title: string;
  detail: string;
}

interface StoryBeat {
  year: string;
  text: string;
}

interface AboutContent {
  heroTitle: string;
  heroDescription: string;
  moreThanTitle: string;
  moreThanDescription: string;
  guides: Guide[];
  infrastructureQuote: string;
  infrastructureDetail: string;
  callToAction: string;
  storyTitle: string;
  storyBeats: StoryBeat[];
  stillBuildingLine: string;
  builtWithLine: string;
  approachTitle: string;
  approachDescription: string;
  approachExtended: string;
  finalLine1: string;
  finalLine2: string;
}

const DEFAULTS: AboutContent = {
  heroTitle: "Where feminist movements gather.",
  heroDescription: "FemVents is a platform for discovering, creating, and connecting around feminist events, gatherings, and organizing. We are building digital infrastructure that makes it easier for feminist organizers, collectives, movements, researchers, artists, activists, and communities to find one another — and to turn gatherings into connection, learning, solidarity, and collective action.",
  moreThanTitle: "Making feminist gatherings visible, connected, and accessible",
  moreThanDescription: "Feminist organizing happens everywhere: in community halls and classrooms, online spaces and festivals, protests and reading groups, conferences and kitchen-table conversations. But these spaces can be difficult to discover beyond our immediate networks.",
  guides: [
    { title: "Feminist by design.", detail: "We think about power, access, safety, care, representation, and participation in how the platform is built." },
    { title: "Community-rooted.", detail: "FemVents should serve organizers and movements rather than extract value from them." },
    { title: "Plural feminisms.", detail: "There is no single feminism. We make space for different feminist histories, politics, identities, languages, geographies, and ways of organizing." },
    { title: "Accessible and inclusive.", detail: "We want more people to be able to find and participate in feminist spaces including people often excluded by geography, language, disability, cost, or institutional networks." },
    { title: "Built for connection, not just attendance.", detail: "Success isn't simply how many tickets are sold. It is whether people find each other, exchange knowledge, build relationships, organize, and create change." },
  ],
  infrastructureQuote: "A feminist internet needs feminist infrastructure.",
  infrastructureDetail: "FemVents is our contribution to that infrastructure: a place to find where feminists are gathering, what they are organizing around, and how to join them.",
  callToAction: "Find a gathering. Create one. Build something together.",
  storyTitle: "FemVents began with a gathering.",
  storyBeats: [
    { year: "2025", text: "We brought feminists together through Gendering AI, a gathering exploring gender, power, technology, and artificial intelligence. As we organized the convening, we encountered a challenge that felt familiar: feminist gatherings were happening everywhere, but there was no shared space to easily find them, connect across them, or make the organizing around them more visible." },
    { year: "2025", text: "Later that year, we began piloting the idea: what would it look like to create digital infrastructure specifically for feminist gatherings and organizing? Not simply another events platform, but a space shaped by how feminist communities actually gather, share knowledge, build relationships, and organize." },
    { year: "2026", text: "We are taking that question back to the community. FemVents is being tested and shaped together with feminist organizers, collectives, movements, and communities. We want the people who will use FemVents to influence what it becomes: what it should make possible, what values it should uphold, and what feminist digital infrastructure should look like in practice." },
  ],
  stillBuildingLine: "We are still building. And we believe that is part of the story.",
  builtWithLine: "FemVents is not only being built for feminist communities. It is being built with them.",
  approachTitle: "Building with feminist communities, not just for them",
  approachDescription: "We believe feminist infrastructure should be shaped by the people who use it. FemVents is being developed through an ongoing process of listening, testing, learning, and building alongside feminist organizers, collectives, and communities.",
  approachExtended: "Rather than assuming what movements need, we want the platform to grow from the realities of how feminists gather, organize, share knowledge, build relationships, and sustain their work. For us, this means thinking beyond functionality. We are also asking questions about power, access, safety, care, representation, ownership, and whose needs technology is designed around.",
  finalLine1: "FemVents is not a finished product handed to the community.",
  finalLine2: "It is an invitation to shape feminist digital infrastructure together.",
};

export default function EditAboutPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULTS);
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
      if (data?.content?.about) {
        setContent({ ...DEFAULTS, ...data.content.about });
      }
    } catch (err) {
      console.error('Error fetching about content:', err);
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

      const mergedContent = { ...(existing?.content || {}), about: content };

      const { error } = await supabase
        .from('site_content')
        .upsert(
          { site: 'web-main', content: mergedContent, updated_at: new Date().toISOString() },
          { onConflict: 'site' }
        );

      if (error) throw error;
      alert('✅ About page saved!');
    } catch (err) {
      console.error('Error saving about content:', err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateGuide = (i: number, field: keyof Guide, value: string) => {
    const updated = [...content.guides];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, guides: updated });
  };

  const updateBeat = (i: number, field: keyof StoryBeat, value: string) => {
    const updated = [...content.storyBeats];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, storyBeats: updated });
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
        <h1 className="text-2xl font-bold text-gray-900">Edit About Page</h1>
        <p className="text-sm text-gray-500">Update the text shown on femvents.netlify.app/about.</p>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">Hero</div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input type="text" value={content.heroTitle} onChange={(e) => setContent({ ...content, heroTitle: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={content.heroDescription} onChange={(e) => setContent({ ...content, heroDescription: e.target.value })} rows={4} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* More than an events platform */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">More Than An Events Platform</div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input type="text" value={content.moreThanTitle} onChange={(e) => setContent({ ...content, moreThanTitle: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={content.moreThanDescription} onChange={(e) => setContent({ ...content, moreThanDescription: e.target.value })} rows={3} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* What guides us */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">What Guides Us (5 values)</div>
        <div className="p-6 space-y-4">
          {content.guides.map((g, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Value {i + 1} — Title</label>
              <input type="text" value={g.title} onChange={(e) => updateGuide(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm" />
              <label className="block text-xs font-medium text-gray-500 mb-1">Detail</label>
              <textarea value={g.detail} onChange={(e) => updateGuide(i, 'detail', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          ))}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Infrastructure Quote</label>
              <input type="text" value={content.infrastructureQuote} onChange={(e) => setContent({ ...content, infrastructureQuote: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Infrastructure Detail</label>
              <textarea value={content.infrastructureDetail} onChange={(e) => setContent({ ...content, infrastructureDetail: e.target.value })} rows={2} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Call to Action Line</label>
              <input type="text" value={content.callToAction} onChange={(e) => setContent({ ...content, callToAction: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Our story */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">Our Story</div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input type="text" value={content.storyTitle} onChange={(e) => setContent({ ...content, storyTitle: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
          </div>
          {content.storyBeats.map((beat, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Story Beat {i + 1} — Year</label>
              <input type="text" value={beat.year} onChange={(e) => updateBeat(i, 'year', e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm" />
              <label className="block text-xs font-medium text-gray-500 mb-1">Text</label>
              <textarea value={beat.text} onChange={(e) => updateBeat(i, 'text', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">"Still Building" Line</label>
            <input type="text" value={content.stillBuildingLine} onChange={(e) => setContent({ ...content, stillBuildingLine: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">"Built With" Line</label>
            <input type="text" value={content.builtWithLine} onChange={(e) => setContent({ ...content, builtWithLine: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {/* Our approach */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">Our Approach</div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input type="text" value={content.approachTitle} onChange={(e) => setContent({ ...content, approachTitle: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={content.approachDescription} onChange={(e) => setContent({ ...content, approachDescription: e.target.value })} rows={3} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Extended Paragraph</label>
            <textarea value={content.approachExtended} onChange={(e) => setContent({ ...content, approachExtended: e.target.value })} rows={4} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Closing Line 1</label>
            <input type="text" value={content.finalLine1} onChange={(e) => setContent({ ...content, finalLine1: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Closing Line 2</label>
            <input type="text" value={content.finalLine2} onChange={(e) => setContent({ ...content, finalLine2: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-lg">
          {saving ? 'Saving...' : '💾 Save About Page'}
        </button>
      </div>
    </AdminLayout>
  );
}