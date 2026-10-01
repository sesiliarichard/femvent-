/**
 * OPPORTUNITIES LIST PAGE (/opportunities)
 * Shows all opportunities this host has posted, with create/edit/delete controls
 */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function OpportunitiesListPage() {
  const { userProfile } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="opportunities">
        <OpportunitiesListContent userProfile={userProfile} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function OpportunitiesListContent({ userProfile }: { userProfile: any }) {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    if (!userProfile?.id) return;
    const { data } = await supabase
      .from('opportunities')
      .select('*')
      .eq('host_id', userProfile.id)
      .order('created_at', { ascending: false });
    setOpportunities(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userProfile?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this opportunity listing? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) throw error;
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
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
          <p className="text-lg font-bold text-gray-700">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Opportunities</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Fellowships, grants, calls for papers, and more that you've shared
            </p>
          </div>
          <Link
            href="/opportunities/create"
            className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Post an Opportunity</span>
          </Link>
        </div>

        {opportunities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <h3 className="text-base font-extrabold text-gray-900 mb-1">No opportunities posted yet</h3>
            <p className="text-sm text-gray-500 mb-5">
              Share a fellowship, grant, call for papers, or other opportunity with the community
            </p>
            <Link
              href="/opportunities/create"
              className="inline-block bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
            >
              Post Your First Opportunity
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {opportunities.map((o, i) => (
              <div
                key={o.id}
                className={`flex items-center justify-between gap-4 p-5 ${
                  i > 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {o.type && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700">
                        {o.type}
                      </span>
                    )}
                    {o.deadline && (
                      <span className="text-xs text-gray-400">
                        Deadline: {new Date(o.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 truncate">{o.title || 'Untitled'}</p>
                  {o.organization && <p className="text-sm text-gray-500 truncate">{o.organization}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/opportunities/${o.id}/edit`}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 hover:border-primary-300 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(o.id)}
                    disabled={deletingId === o.id}
                    className="px-4 py-2 rounded-lg border border-red-200 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === o.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}