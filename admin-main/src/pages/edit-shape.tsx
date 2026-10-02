import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { ImageUploadWidget } from '../components/ImageUploadWidget';

interface PageContent {
  eyebrow: string;
  title: string;
  intro1: string;
  intro2: string;
  note: string;
  bannerImage: string;
  formUrl: string;
}

const DEFAULTS: PageContent = {
  "eyebrow": "Shape FemVents",
  "title": "Help us build the feminist convening platform you need",
  "intro1": "FemVents is being built as shared feminist infrastructure — a place to find gatherings, connect across movements, share opportunities and resources, and preserve feminist movement memory.",
  "intro2": "We don't want to decide what this platform should become without the people who will use it. This form is an invitation to tell us what would help you connect better, what is currently missing, what barriers you experience, and what you would like FemVents to become.",
  "note": "You can answer anonymously. You do not need to answer every question.",
  "bannerImage": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80",
  "formUrl": "https://docs.google.com/forms/d/e/1FAIpQLScxmQ8KmUqWBk1saFjRlCQMH1eSeaQlj3TMqduMGZvyALyfFg/viewform?embedded=true"
};

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500';
const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1';

function Section({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 mb-5 overflow-hidden">
      <div className={`px-6 py-3.5 ${color} text-white font-extrabold text-sm`}>{title}</div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={inputCls} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
    </div>
  );
}

export default function EditShapePage() {
  const [content, setContent] = useState<PageContent>(DEFAULTS);
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

      if (data?.content?.shape) {
        setContent({ ...DEFAULTS, ...data.content.shape });
      }
    } catch (err) {
      console.error('Error fetching content:', err);
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
        shape: content,
      };

      const { error } = await supabase
        .from('site_content')
        .upsert(
          { site: 'web-main', content: mergedContent, updated_at: new Date().toISOString() },
          { onConflict: 'site' }
        );

      if (error) throw error;
      alert('Saved!');
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof PageContent, value: any) => setContent({ ...content, [field]: value });

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
        <h1 className="text-2xl font-extrabold text-gray-900">Edit Shape FemVents Page</h1>
        <p className="text-sm text-gray-500 mt-1">Update the text and images shown on femvents.netlify.app/shape.</p>
      </div>

      <Section color="bg-primary-600" title="Intro">
        <Field label="Small heading above the title" value={content.eyebrow} onChange={(v) => set('eyebrow', v)} />
        <Field label="Title" value={content.title} onChange={(v) => set('title', v)} />
        <Field label="First paragraph" value={content.intro1} onChange={(v) => set('intro1', v)} rows={3} />
        <Field label="Second paragraph" value={content.intro2} onChange={(v) => set('intro2', v)} rows={3} />
        <Field label="Highlighted line" value={content.note} onChange={(v) => set('note', v)} />
      </Section>

      <Section color="bg-accent-500" title="Banner photo (above the form)">
        <ImageUploadWidget label="Banner photo" value={content.bannerImage} onChange={(url) => set('bannerImage', url)} folder="shape" />
      </Section>

      <Section color="bg-secondary-500" title="Google Form">
        <Field label="Google Form embed link (Send → <> icon → copy the src=&quot;...&quot; value). Leave empty to show the 'Form not connected yet' box." value={content.formUrl} onChange={(v) => set('formUrl', v)} />
      </Section>


      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl disabled:opacity-50 font-bold text-sm transition-colors shadow-lg">
          {saving ? 'Saving...' : 'Save Shape Page'}
        </button>
      </div>
    </AdminLayout>
  );
}