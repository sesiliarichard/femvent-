'use client';

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function DebugContent() {
  const { user, userProfile, loading } = useAuth();
  const [firestoreUser, setFirestoreUser] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      try {
        const ud = await getDoc(doc(db, 'users', user.uid));
        setFirestoreUser(ud.exists() ? ud.data() : null);
      } catch (e: any) {
        console.error('Error fetching user doc', e);
        setErr(e.message || String(e));
      }
    };
    fetch();
  }, [user]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Auth & Firestore User</h1>
      <div className="mb-4">
        <h2 className="font-semibold">Auth user</h2>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">AuthContext userProfile</h2>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(userProfile, null, 2)}</pre>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Firestore user doc</h2>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(firestoreUser, null, 2)}</pre>
      </div>

      {err && (
        <div className="text-red-600">Error fetching Firestore user: {err}</div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        If the Firestore `users` doc shows role !== 'host' and hostApplication.status === 'approved', either update the `role` to 'host' or use the admin "set-host" page to set the role.
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
