import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';

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

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  badge: string;
}

interface OrganizersContent {
  heroTitle: string;
  heroDescription: string;
  organizerSpotlights: OrganizerSpotlight[];
  pricingPlans: PricingPlan[];
  howItWorks: string[];
  impactStats: ImpactStat[];
}

const DEFAULTS: OrganizersContent = {
  heroTitle: "Professional tools for event creators",
  heroDescription: "Everything you need to create, promote, and manage your events. From ticket sales to attendee check-in, we've got you covered.",
  organizerSpotlights: [
    { name: "Nova Stage Collective", focus: "Music and nightlife events", stat: "36 sold-out shows", blurb: "Using FemVents for ticket sales and check-in, Nova Stage has seen more repeat attendees and smoother event operations." },
    { name: "Elevate Studio", focus: "Corporate retreats and workshops", stat: "4.9 ★ rating", blurb: "With custom branding and easy payment processing, Elevate Studio manages multi-country events without the usual headaches." },
    { name: "Bloom Gatherings", focus: "Markets and pop-up events", stat: "120+ vendors", blurb: "Vendor registration, instant payouts, and real-time sales tracking have made Bloom's festival circuit much easier to manage." },
  ],
  pricingPlans: [
    { id: 'starter', name: 'Starter', price: '$29/mo', description: 'For new organizers launching their first event.', badge: 'Best for first-time hosts' },
    { id: 'growth', name: 'Growth', price: '$79/mo', description: 'For growing communities managing more than one event.', badge: 'Popular for scaling teams' },
    { id: 'pro', name: 'Pro', price: '$149/mo', description: 'Advanced automation, analytics, and premium support.', badge: 'Built for full-scale operations' },
  ],
  howItWorks: [
    "Upload your event details and images",
    "Set up ticket types and pricing",
    "Publish and share your event link",
    "Track ticket sales and check in attendees on event day",
  ],
  impactStats: [
    { label: "Communities activated", value: "210+", detail: "across 12 countries" },
    { label: "Tickets issued", value: "1.2M", detail: "with 82% retention" },
    { label: "Avg. NPS", value: "67", detail: "across hosts & guests" },
    { label: "Campaign lift", value: "3.4x", detail: "vs. generic ads" },
  ],
};

export default function EditOrganizersPage() {
  const [content, setContent] = useState<OrganizersContent>(DEFAULTS);
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
          heroTitle: data.content.organizersHero?.title || DEFAULTS.heroTitle,
          heroDescription: data.content.organizersHero?.description || DEFAULTS.heroDescription,
          organizerSpotlights: data.content.organizerSpotlights || DEFAULTS.organizerSpotlights,
          pricingPlans: data.content.pricingPlans || DEFAULTS.pricingPlans,
          howItWorks: data.content.howItWorks || DEFAULTS.howItWorks,
          impactStats: data.content.impactStats || DEFAULTS.impactStats,
        });
      }
    } catch (err) {
      console.error('Error fetching organizers content:', err);
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
        organizersHero: { title: content.heroTitle, description: content.heroDescription },
        organizerSpotlights: content.organizerSpotlights,
        pricingPlans: content.pricingPlans,
        howItWorks: content.howItWorks,
        impactStats: content.impactStats,
      };

      const { error } = await supabase
        .from('site_content')
        .upsert(
          { site: 'web-main', content: mergedContent, updated_at: new Date().toISOString() },
          { onConflict: 'site' }
        );

      if (error) throw error;
      alert('✅ Organizers page saved!');
    } catch (err) {
      console.error('Error saving organizers content:', err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateSpotlight = (i: number, field: keyof OrganizerSpotlight, value: string) => {
    const updated = [...content.organizerSpotlights];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, organizerSpotlights: updated });
  };

  const updatePlan = (i: number, field: keyof PricingPlan, value: string) => {
    const updated = [...content.pricingPlans];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, pricingPlans: updated });
  };

  const updateStep = (i: number, value: string) => {
    const updated = [...content.howItWorks];
    updated[i] = value;
    setContent({ ...content, howItWorks: updated });
  };

  const updateStat = (i: number, field: keyof ImpactStat, value: string) => {
    const updated = [...content.impactStats];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, impactStats: updated });
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Organizers Page</h1>
        <p className="text-sm text-gray-500">Update the text shown on femvents.netlify.app/organizers.</p>
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
            <textarea value={content.heroDescription} onChange={(e) => setContent({ ...content, heroDescription: e.target.value })} rows={3} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Organizer Stories */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">Organizer Stories (3 spotlight cards)</div>
        <div className="p-6 space-y-4">
          {content.organizerSpotlights.map((org, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
              <label className="block text-xs font-medium text-gray-500">Organizer {i + 1} — Name</label>
              <input type="text" value={org.name} onChange={(e) => updateSpotlight(i, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <label className="block text-xs font-medium text-gray-500">Focus</label>
              <input type="text" value={org.focus} onChange={(e) => updateSpotlight(i, 'focus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <label className="block text-xs font-medium text-gray-500">Stat</label>
              <input type="text" value={org.stat} onChange={(e) => updateSpotlight(i, 'stat', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <label className="block text-xs font-medium text-gray-500">Blurb</label>
              <textarea value={org.blurb} onChange={(e) => updateSpotlight(i, 'blurb', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">Pricing Plans (3 plans)</div>
        <div className="p-6 space-y-4">
          {content.pricingPlans.map((plan, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
              <label className="block text-xs font-medium text-gray-500">Plan {i + 1} — ID</label>
              <input type="text" value={plan.id} onChange={(e) => updatePlan(i, 'id', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <label className="block text-xs font-medium text-gray-500">Name</label>
              <input type="text" value={plan.name} onChange={(e) => updatePlan(i, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Price</label>
                  <input type="text" value={plan.price} onChange={(e) => updatePlan(i, 'price', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Badge</label>
                  <input type="text" value={plan.badge} onChange={(e) => updatePlan(i, 'badge', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <label className="block text-xs font-medium text-gray-500">Description</label>
              <textarea value={plan.description} onChange={(e) => updatePlan(i, 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          ))}
          <p className="text-xs text-gray-400 italic">The plan with id "growth" shows the "Most Popular" badge on the live page.</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">How It Works (4 steps)</div>
        <div className="p-6 space-y-3">
          {content.howItWorks.map((step, i) => (
            <div key={i}>
              <label className="block text-xs font-medium text-gray-500 mb-1">Step {i + 1}</label>
              <input type="text" value={step} onChange={(e) => updateStep(i, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Impact Stats */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 text-white font-semibold text-sm">Impact Stats (4 stats)</div>
        <div className="p-6 space-y-4">
          {content.impactStats.map((stat, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
              <label className="block text-xs font-medium text-gray-500">Stat {i + 1} — Label</label>
              <input type="text" value={stat.label} onChange={(e) => updateStat(i, 'label', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Value</label>
                  <input type="text" value={stat.value} onChange={(e) => updateStat(i, 'value', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Detail</label>
                  <input type="text" value={stat.detail} onChange={(e) => updateStat(i, 'detail', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-lg">
          {saving ? 'Saving...' : '💾 Save Organizers Page'}
        </button>
      </div>
    </AdminLayout>
  );
}