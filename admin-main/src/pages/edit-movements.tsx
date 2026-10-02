import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { ImageUploadWidget } from '../components/ImageUploadWidget';

interface PageContent {
  title: string;
  intro: string;
  bannerImage: string;
}

const DEFAULTS: PageContent = {
  "title": "Movements & collectives",
  "intro": "Find out who else is organizing around the issues you care about — and connect across places, languages, and movements.",
  "bannerImage": "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1600&q=80"
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

export default function EditMovementsPage() {
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

      if (data?.content?.movementsPage) {
        setContent({ ...DEFAULTS, ...data.content.movementsPage });
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
        movementsPage: content,
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
        <h1 className="text-2xl font-extrabold text-gray-900">Edit Movements Page</h1>
        <p className="text-sm text-gray-500 mt-1">Update the text and images shown on femvents.netlify.app/movements. The collectives themselves come from the movements table (added by hosts). Here you edit only the heading, intro and banner photo.</p>
      </div>

      <Section color="bg-primary-600" title="Heading and banner">
        <Field label="Title" value={content.title} onChange={(v) => set('title', v)} />
        <Field label="Intro paragraph" value={content.intro} onChange={(v) => set('intro', v)} rows={3} />
        <ImageUploadWidget label="Banner photo" value={content.bannerImage} onChange={(url) => set('bannerImage', url)} folder="movements" />
      </Section>


      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl disabled:opacity-50 font-bold text-sm transition-colors shadow-lg">
          {saving ? 'Saving...' : 'Save Movements Page'}
        </button>
      </div>
    </AdminLayout>
  );
}