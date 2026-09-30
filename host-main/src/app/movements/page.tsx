/**
 * MOVEMENT / COLLECTIVE PROFILE PAGE (/movements)
 * One profile per host account — this page creates it if it doesn't exist yet,
 * or edits it if it does.
 */
'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Resource {
  title: string;
  url: string;
}

interface Contact {
  email?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
}

interface MovementData {
  id?: string;
  name: string;
  logoURL: string | null;
  city: string;
  country: string;
  focusAreas: string[];
  languages: string[];
  about: string;
  organizingAround: string;
  whereWeWork: string;
  resources: Resource[];
  contact: Contact;
}

const emptyMovement: MovementData = {
  name: '',
  logoURL: null,
  city: '',
  country: '',
  focusAreas: [],
  languages: [],
  about: '',
  organizingAround: '',
  whereWeWork: '',
  resources: [],
  contact: {},
};

export default function MovementProfilePage() {
  const { userProfile } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="movements">
        <MovementProfileContent userProfile={userProfile} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function MovementProfileContent({ userProfile }: { userProfile: any }) {
  const [data, setData] = useState<MovementData>(emptyMovement);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!userProfile?.id) return;
      try {
        const { data: movement } = await supabase
          .from('movements')
          .select('*')
          .eq('host_id', userProfile.id)
          .maybeSingle();

        if (movement) {
          setData({
            id: movement.id,
            name: movement.name || '',
            logoURL: movement.logo_url || null,
            city: movement.city || '',
            country: movement.country || '',
            focusAreas: movement.focus_areas || [],
            languages: movement.languages || [],
            about: movement.about || '',
            organizingAround: movement.organizing_around || '',
            whereWeWork: movement.where_we_work || '',
            resources: movement.resources || [],
            contact: movement.contact || {},
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userProfile?.id]);

  const updateField = (field: keyof MovementData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `movements/${userProfile.id}/logo-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('event-images').getPublicUrl(filePath);
      updateField('logoURL', pub.publicUrl);
    } catch (err) {
      alert('Logo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const addResource = () => {
    updateField('resources', [...data.resources, { title: '', url: '' }]);
  };
  const updateResource = (index: number, field: keyof Resource, value: string) => {
    const next = [...data.resources];
    next[index] = { ...next[index], [field]: value };
    updateField('resources', next);
  };
  const removeResource = (index: number) => {
    updateField('resources', data.resources.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!data.name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    if (!userProfile?.id) {
      alert('You must be logged in to save a collective profile.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        host_id: userProfile.id,
        name: data.name,
        logo_url: data.logoURL,
        city: data.city || null,
        country: data.country || null,
        focus_areas: data.focusAreas,
        languages: data.languages,
        about: data.about || null,
        organizing_around: data.organizingAround || null,
        where_we_work: data.whereWeWork || null,
        resources: data.resources.filter((r) => r.title.trim() !== ''),
        contact: data.contact,
      };

      if (data.id) {
        const { error } = await supabase.from('movements').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase
          .from('movements')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setData((prev) => ({ ...prev, id: created.id }));
      }
      setSaved(true);
    } catch (err: any) {
      alert(`Error saving profile: ${err.message || 'Something went wrong'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-bold text-gray-700">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">
            {data.id ? 'Your Collective Profile' : 'Create Your Collective Profile'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Help other feminists find out who you are and what you're organizing around.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-7">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Collective / Movement Name *
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={`w-full px-5 py-3.5 rounded-xl border ${
                errors.name ? 'border-red-400' : 'border-gray-200'
              } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400`}
              placeholder="e.g. Sauti Feminista"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.name}</p>}
          </div>

          {/* Logo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Logo
            </label>
            <div className="relative group w-32">
              {data.logoURL ? (
                <div className="relative rounded-full overflow-hidden border border-gray-200 w-32 h-32">
                  <img src={data.logoURL} alt="Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      className="bg-white text-gray-900 px-3 py-1.5 rounded-lg font-bold text-xs"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-center hover:border-primary-400 hover:bg-primary-50/40 transition-colors cursor-pointer"
                >
                  <span className="text-xs text-gray-500 px-2">Upload logo</span>
                </div>
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {uploading && (
                <div className="absolute inset-0 bg-white/90 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                City
              </label>
              <input
                type="text"
                value={data.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
                placeholder="Dar es Salaam"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Country
              </label>
              <input
                type="text"
                value={data.country}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
                placeholder="Tanzania"
              />
            </div>
          </div>

          {/* Focus areas & languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Focus Areas
              </label>
              <input
                type="text"
                value={data.focusAreas.join(', ')}
                onChange={(e) =>
                  updateField(
                    'focusAreas',
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
                placeholder="Bodily autonomy, Movement building, Youth"
              />
              <p className="text-xs text-gray-400 mt-1.5">Comma-separated</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Languages
              </label>
              <input
                type="text"
                value={data.languages.join(', ')}
                onChange={(e) =>
                  updateField(
                    'languages',
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
                placeholder="English, Kiswahili"
              />
              <p className="text-xs text-gray-400 mt-1.5">Comma-separated</p>
            </div>
          </div>

          {/* About */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              About our work
            </label>
            <textarea
              value={data.about}
              onChange={(e) => updateField('about', e.target.value)}
              rows={4}
              className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400 resize-none"
              placeholder="Who you are, your history, your community"
            />
          </div>

          {/* Organizing around */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              What we're organizing around
            </label>
            <textarea
              value={data.organizingAround}
              onChange={(e) => updateField('organizingAround', e.target.value)}
              rows={3}
              className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400 resize-none"
              placeholder="Current campaigns, priorities, ongoing work"
            />
          </div>

          {/* Where we work */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Where we work
            </label>
            <textarea
              value={data.whereWeWork}
              onChange={(e) => updateField('whereWeWork', e.target.value)}
              rows={2}
              className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400 resize-none"
              placeholder="e.g. Dar es Salaam, with partners across East Africa"
            />
          </div>

          {/* Resources */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                Resources we've shared
              </label>
              <button
                onClick={addResource}
                className="flex items-center gap-1.5 bg-secondary-500 hover:bg-secondary-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
              >
                + Add Resource
              </button>
            </div>
            {data.resources.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No resources added yet</p>
            ) : (
              <div className="space-y-3">
                {data.resources.map((r, i) => (
                  <div key={i} className="flex gap-3 items-start bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Resource title"
                        value={r.title}
                        onChange={(e) => updateResource(i, 'title', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={r.url}
                        onChange={(e) => updateResource(i, 'url', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeResource(i)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Connect with us
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Contact email"
                value={data.contact.email || ''}
                onChange={(e) => updateField('contact', { ...data.contact, email: e.target.value })}
                className="px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
              />
              <input
                type="url"
                placeholder="Website"
                value={data.contact.website || ''}
                onChange={(e) => updateField('contact', { ...data.contact, website: e.target.value })}
                className="px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Instagram (optional)"
                value={data.contact.instagram || ''}
                onChange={(e) => updateField('contact', { ...data.contact, instagram: e.target.value })}
                className="px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Twitter / X (optional)"
                value={data.contact.twitter || ''}
                onChange={(e) => updateField('contact', { ...data.contact, twitter: e.target.value })}
                className="px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
              />
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={save}
              disabled={saving || uploading}
              className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-7 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : data.id ? 'Save Changes' : 'Create Profile'}
            </button>
            {saved && <span className="text-sm font-semibold text-green-600">Saved ✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}