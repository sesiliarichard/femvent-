import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { ImageUploadWidget } from '../components/ImageUploadWidget';

interface FaqItem {
  question: string;
  answer: string;
}

interface SupportTopic {
  title: string;
  items: string[];
  image: string;
}

interface SupportContent {
  faq: FaqItem[];
  supportTopics: SupportTopic[];
}

const DEFAULTS: SupportContent = {
  faq: [
    { question: "How do I create an event on FemVents?", answer: "Download the app, create an organizer account, and fill in your event details including date, location, and ticket prices. You can publish your event in minutes." },
    { question: "Can I create private or invite-only events?", answer: "Yes. You can set up password-protected events, send direct invitations, or create events that don't appear in public searches." },
    { question: "What currencies do you support for payments?", answer: "We support USD, KES, NGN, ZAR, and other major African currencies. Payouts are processed within 3-5 business days after your event." },
    { question: "Can I promote my event through social media?", answer: "Absolutely. Share your event directly to Facebook, Instagram, Twitter, and WhatsApp from the app." },
  ],
  supportTopics: [
    { title: "Getting Started", items: ["Download FemVents on iOS / Android", "Host onboarding checklist", "Migrating existing attendees"], image: "" },
    { title: "Ticketing & Access", items: ["Dynamic pricing tiers", "Group passes & bulk imports", "On-site scanning playbook"], image: "" },
    { title: "Marketing & Growth", items: ["Smart audiences", "Promo codes + referral loops", "Attribution dashboards"], image: "" },
    { title: "Finance & Compliance", items: ["Supported currencies", "Settlement schedules", "KYC / AML overview"], image: "" },
  ],
};

export default function EditSupportPage() {
  const [content, setContent] = useState<SupportContent>(DEFAULTS);
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
          faq: data.content.faq || DEFAULTS.faq,
          supportTopics: data.content.supportTopics || DEFAULTS.supportTopics,
        });
      }
    } catch (err) {
      console.error('Error fetching support content:', err);
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
        faq: content.faq,
        supportTopics: content.supportTopics,
      };

      const { error } = await supabase
        .from('site_content')
        .upsert(
          { site: 'web-main', content: mergedContent, updated_at: new Date().toISOString() },
          { onConflict: 'site' }
        );

      if (error) throw error;
      alert('Support page saved!');
    } catch (err) {
      console.error('Error saving support content:', err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateFaq = (i: number, field: keyof FaqItem, value: string) => {
    const updated = [...content.faq];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, faq: updated });
  };

  const removeFaq = (i: number) => {
    const updated = [...content.faq];
    updated.splice(i, 1);
    setContent({ ...content, faq: updated });
  };

  const addFaq = () => {
    setContent({ ...content, faq: [...content.faq, { question: '', answer: '' }] });
  };

  const updateTopicField = (i: number, field: 'title' | 'image', value: string) => {
    const updated = [...content.supportTopics];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, supportTopics: updated });
  };

  const updateTopicItems = (i: number, value: string) => {
    const updated = [...content.supportTopics];
    updated[i] = { ...updated[i], items: value.split('\n') };
    setContent({ ...content, supportTopics: updated });
  };

  const removeTopic = (i: number) => {
    const updated = [...content.supportTopics];
    updated.splice(i, 1);
    setContent({ ...content, supportTopics: updated });
  };

  const addTopic = () => {
    setContent({ ...content, supportTopics: [...content.supportTopics, { title: '', items: [], image: '' }] });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Edit Support Page</h1>
        <p className="text-sm text-gray-500 mt-1">Update the text and images shown on femvents.netlify.app/support.</p>
      </div>

      {/* Support Topics */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-5 overflow-hidden">
        <div className="px-6 py-3.5 bg-secondary-600 text-white font-extrabold text-sm">Support Topics</div>
        <div className="p-6 space-y-4">
          {content.supportTopics.map((topic, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Topic {i + 1} — Title</label>
                <button onClick={() => removeTopic(i)} className="text-xs text-secondary-600 font-bold hover:opacity-70">Remove</button>
              </div>
              <input type="text" value={topic.title} onChange={(e) => updateTopicField(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Items (one per line)</label>
              <textarea
                value={topic.items.join('\n')}
                onChange={(e) => updateTopicItems(i, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
              <ImageUploadWidget
                label="Topic Background Image"
                value={topic.image}
                onChange={(url) => updateTopicField(i, 'image', url)}
                folder="support"
              />
            </div>
          ))}
          <button onClick={addTopic} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
            + Add support topic
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-5 overflow-hidden">
        <div className="px-6 py-3.5 bg-primary-600 text-white font-extrabold text-sm">FAQ</div>
        <div className="p-6 space-y-4">
          {content.faq.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Question {i + 1}</label>
                <button onClick={() => removeFaq(i)} className="text-xs text-secondary-600 font-bold hover:opacity-70">Remove</button>
              </div>
              <input type="text" value={item.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Answer</label>
              <textarea value={item.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          ))}
          <button onClick={addFaq} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
            + Add FAQ item
          </button>
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl disabled:opacity-50 font-bold text-sm transition-colors shadow-lg">
          {saving ? 'Saving...' : 'Save Support Page'}
        </button>
      </div>
    </AdminLayout>
  );
}