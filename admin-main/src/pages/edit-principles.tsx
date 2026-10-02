import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { ImageUploadWidget } from '../components/ImageUploadWidget';

interface PageContent {
  eyebrow: string;
  title: string;
  intro: string;
  bannerImage: string;
  statementHeading: string;
  statementBody: string;
  pluralTitle: string;
  pluralBody: string;
  sideImage: string;
  commitmentsTitle: string;
  commitments: Array<{ title: string; detail: string }>;
  rootedTitle: string;
  rootedBody: string;
  themes: string[];
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
}

const DEFAULTS: PageContent = {
  "eyebrow": "Our Convening Principles",
  "title": "What makes a gathering feminist?",
  "intro": "FemVents is feminist by design — but that shouldn't just be a claim we make about ourselves. Here's what we mean by it, and what we ask of gatherings hosted on the platform.",
  "bannerImage": "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1600&q=80",
  "statementHeading": "Gatherings on FemVents should engage seriously with gendered power and contribute to feminist learning, organizing, culture, solidarity, resistance, or collective wellbeing.",
  "statementBody": "This isn't a purity test, and it isn't about requiring everyone to agree with one definition of feminism. It's a baseline: the gathering should be doing something in service of feminist movements, not simply borrowing the language.",
  "pluralTitle": "Many feminisms, one commons",
  "pluralBody": "FemVents welcomes multiple feminisms, contexts, languages, identities, and political traditions. There is no single feminism, and we don't ask hosts to prove their politics match ours. What we do ask is that hosts uphold a few shared commitments — not as a checklist to pass, but as the baseline for what it means to gather with care.",
  "sideImage": "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&q=80",
  "commitmentsTitle": "What we ask of every host",
  "commitments": [
    {
      "title": "Dignity",
      "detail": "Every participant is treated with respect, regardless of their role, background, or how they show up."
    },
    {
      "title": "Anti-discrimination",
      "detail": "Gatherings welcome people across race, class, disability, sexuality, gender identity, age, and geography."
    },
    {
      "title": "Consent",
      "detail": "Participation, photography, recording, and data sharing are never assumed — they're asked for."
    },
    {
      "title": "Accessibility",
      "detail": "Hosts are encouraged to think through language, cost, physical access, and other barriers to participation."
    },
    {
      "title": "Safety",
      "detail": "Gatherings have a clear approach to care and safeguarding, so participants know what to expect."
    }
  ],
  "rootedTitle": "Rooted in feminist internet principles",
  "rootedBody": "FemVents draws on established thinking about what feminist digital infrastructure looks like — treating things like access, consent, privacy, and movement memory as design questions, not afterthoughts.",
  "themes": [
    "Access",
    "Movement building",
    "Alternative economies",
    "Consent",
    "Privacy",
    "Memory",
    "Resistance"
  ],
  "ctaTitle": "Have thoughts on these principles?",
  "ctaBody": "These principles are meant to evolve with the community that uses FemVents. Tell us what we're missing, or where we've got it wrong.",
  "ctaButton": "Shape FemVents"
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

export default function EditPrinciplesPage() {
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

      if (data?.content?.principles) {
        setContent({ ...DEFAULTS, ...data.content.principles });
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
        principles: content,
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

  const updateItem = (i: number, field: string, value: string) => {
    const updated = [...content.commitments];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, commitments: updated });
  };

  const removeItem = (i: number) => {
    const updated = [...content.commitments];
    updated.splice(i, 1);
    setContent({ ...content, commitments: updated });
  };

  const addItem = () => {
    setContent({ ...content, commitments: [...content.commitments, { title: '', detail: '' }] });
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
        <h1 className="text-2xl font-extrabold text-gray-900">Edit Principles Page</h1>
        <p className="text-sm text-gray-500 mt-1">Update the text and images shown on femvents.netlify.app/principles.</p>
      </div>

      <Section color="bg-primary-600" title="Intro">
        <Field label="Small heading above the title" value={content.eyebrow} onChange={(v) => set('eyebrow', v)} />
        <Field label="Title" value={content.title} onChange={(v) => set('title', v)} />
        <Field label="Intro paragraph" value={content.intro} onChange={(v) => set('intro', v)} rows={3} />
        <ImageUploadWidget label="Banner photo (under the intro)" value={content.bannerImage} onChange={(url) => set('bannerImage', url)} folder="principles" />
      </Section>

      <Section color="bg-secondary-500" title="Statement block (dark)">
        <Field label="Statement" value={content.statementHeading} onChange={(v) => set('statementHeading', v)} rows={3} />
        <Field label="Statement paragraph" value={content.statementBody} onChange={(v) => set('statementBody', v)} rows={3} />
      </Section>

      <Section color="bg-accent-500" title="Many feminisms (text + photo)">
        <Field label="Title" value={content.pluralTitle} onChange={(v) => set('pluralTitle', v)} />
        <Field label="Paragraph" value={content.pluralBody} onChange={(v) => set('pluralBody', v)} rows={3} />
        <ImageUploadWidget label="Photo beside the text" value={content.sideImage} onChange={(url) => set('sideImage', url)} folder="principles" />
      </Section>

      <Section color="bg-primary-600" title="What we ask of every host">
        <Field label="Section title" value={content.commitmentsTitle} onChange={(v) => set('commitmentsTitle', v)} />
      </Section>

      <Section color="bg-secondary-500" title="Commitments">
        {content.commitments.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <span className={labelCls}>Commitment {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-xs text-secondary-600 font-bold hover:opacity-70">Remove</button>
            </div>
            <Field label="Title" value={item.title} onChange={(v) => updateItem(i, 'title', v)} />
            <Field label="Description" value={item.detail} onChange={(v) => updateItem(i, 'detail', v)} rows={3} />
          </div>
        ))}
        <button onClick={addItem} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
          + Add commitment
        </button>
      </Section>

      <Section color="bg-accent-500" title="Rooted in feminist internet principles">
        <Field label="Title" value={content.rootedTitle} onChange={(v) => set('rootedTitle', v)} />
        <Field label="Paragraph" value={content.rootedBody} onChange={(v) => set('rootedBody', v)} rows={3} />
        <Field label="Theme pills (comma separated)" value={content.themes.join(', ')} onChange={(v) => set('themes', v.split(',').map((t) => t.trim()).filter(Boolean))} />
      </Section>

      <Section color="bg-primary-600" title="Call to action (bottom)">
        <Field label="Title" value={content.ctaTitle} onChange={(v) => set('ctaTitle', v)} />
        <Field label="Paragraph" value={content.ctaBody} onChange={(v) => set('ctaBody', v)} rows={3} />
        <Field label="Button text (links to /shape)" value={content.ctaButton} onChange={(v) => set('ctaButton', v)} />
      </Section>


      <div className="flex justify-end sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="px-6 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl disabled:opacity-50 font-bold text-sm transition-colors shadow-lg">
          {saving ? 'Saving...' : 'Save Principles Page'}
        </button>
      </div>
    </AdminLayout>
  );
}