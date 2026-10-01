/**
 * EDIT OPPORTUNITY PAGE (/opportunities/[id]/edit)
 */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const OPPORTUNITY_TYPES = [
  'Fellowship',
  'Grant',
  'Travel funding',
  'Residency',
  'Job',
  'Consultancy',
  'Call for papers',
  'Call for speakers',
  'Call for participants',
  'Research opportunity',
  'Volunteer opportunity',
  'Campaign action',
  'Training opportunity',
  'Mentorship',
  'Other',
];

interface FormData {
  title: string;
  type: string;
  organization: string;
  description: string;
  deadline: string;
  location: string;
  remote: boolean;
  eligibility: string;
  fundingDetails: string;
  applyUrl: string;
}

const emptyForm: FormData = {
  title: '',
  type: OPPORTUNITY_TYPES[0],
  organization: '',
  description: '',
  deadline: '',
  location: '',
  remote: false,
  eligibility: '',
  fundingDetails: '',
  applyUrl: '',
};

export default function EditOpportunityPage() {
  const { userProfile } = useAuth();
  const params = useParams<{ id?: string | string[] }>();
  const opportunityId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '');
  }, [params]);
  const router = useRouter();

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="opportunities">
        <EditOpportunityContent userProfile={userProfile} opportunityId={opportunityId} router={router} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function EditOpportunityContent({
  userProfile,
  opportunityId,
  router,
}: {
  userProfile: any;
  opportunityId: string;
  router: any;
}) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const load = async () => {
      if (!opportunityId) return;
      const { data } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single();
      if (data) {
        setForm({
          title: data.title || '',
          type: data.type || OPPORTUNITY_TYPES[0],
          organization: data.organization || '',
          description: data.description || '',
          deadline: data.deadline || '',
          location: data.location || '',
          remote: Boolean(data.remote),
          eligibility: data.eligibility || '',
          fundingDetails: data.funding_details || '',
          applyUrl: data.apply_url || '',
        });
      }
      setLoading(false);
    };
    load();
  }, [opportunityId]);

  const update = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.applyUrl && !/^https?:\/\//.test(form.applyUrl)) {
      errs.applyUrl = 'Please enter a valid URL';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({
          title: form.title,
          type: form.type || null,
          organization: form.organization || null,
          description: form.description || null,
          deadline: form.deadline || null,
          location: form.location || null,
          remote: form.remote,
          eligibility: form.eligibility || null,
          funding_details: form.fundingDetails || null,
          apply_url: form.applyUrl || null,
        })
        .eq('id', opportunityId);
      if (error) throw error;
      router.push('/opportunities');
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to save changes'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this opportunity listing? This cannot be undone.')) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('opportunities').delete().eq('id', opportunityId);
      if (error) throw error;
      router.push('/opportunities');
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to delete'}`);
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
          <p className="text-lg font-bold text-gray-700">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Edit Opportunity</h1>
              <p className="text-sm text-gray-500 mt-0.5">Update this listing</p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={`w-full px-5 py-3.5 rounded-xl border ${
                errors.title ? 'border-red-400' : 'border-gray-200'
              } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium"
              >
                {OPPORTUNITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Organization
              </label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) => update('organization', e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => update('deadline', e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => update('remote', e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Open to remote / online participation</span>
          </label>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Eligibility
            </label>
            <textarea
              value={form.eligibility}
              onChange={(e) => update('eligibility', e.target.value)}
              rows={2}
              className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Funding & compensation
            </label>
            <textarea
              value={form.fundingDetails}
              onChange={(e) => update('fundingDetails', e.target.value)}
              rows={2}
              className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Apply / learn more URL
            </label>
            <input
              type="url"
              value={form.applyUrl}
              onChange={(e) => update('applyUrl', e.target.value)}
              className={`w-full px-5 py-3.5 rounded-xl border ${
                errors.applyUrl ? 'border-red-400' : 'border-gray-200'
              } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-medium placeholder-gray-400`}
            />
            {errors.applyUrl && (
              <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.applyUrl}</p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-secondary-500 hover:bg-secondary-600 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}