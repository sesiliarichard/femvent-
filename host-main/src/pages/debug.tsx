'use client';

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

function DebugContent() {
  const { user, userProfile, loading } = useAuth();
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        setSupabaseUser(data);
      } catch (e: any) {
        console.error('Error fetching user row', e);
        setErr(e.message || String(e));
      }
    };
    fetchUser();
  }, [user]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Auth & Supabase User</h1>
      <div className="mb-4">
        <h2 className="font-semibold">Auth user</h2>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">AuthContext userProfile</h2>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(userProfile, null, 2)}</pre>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Supabase users row</h2>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(supabaseUser, null, 2)}</pre>
      </div>

      {err && (
        <div className="text-red-600">Error fetching Supabase user: {err}</div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        If the Supabase `users` row shows role !== 'host' and hostApplication.status === 'approved', either update the `role` to 'host' or use the admin "set-host" page to set the role.
      </div>
    </div>
  );
}

export default function DebugPage() {
  return (
    <AuthProvider>
      <DebugContent />
    </AuthProvider>
  );
}