/**
 * ADMIN SET HOST PAGE (/admin/set-host)
 * Utility page to manually set a user's role to 'host' in Firestore
 */
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SetHostPage() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const setAsHost = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update user role to host
      const { error } = await supabase
        .from('users')
        .update({
          role: 'host',
          name: userProfile?.name || user.email?.split('@')[0],
          email: user.email,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage('✅ Successfully set as host! You can now access the platform.');
    } catch (error) {
      console.error('Error setting as host:', error);
      setMessage('❌ Error setting as host. Please try again.');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login First</h1>
          <a href="/login" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Set User as Host</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Current User Info:</h3>
            <p className="text-sm text-gray-600">Name: {userProfile?.name || user.displayName || 'N/A'}</p>
            <p className="text-sm text-gray-600">Email: {user.email}</p>
            <p className="text-sm text-gray-600">Current Role: {userProfile?.role || 'attendee'}</p>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}

          <button
            onClick={setAsHost}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting as Host...' : 'Set as Host'}
          </button>

          <div className="text-center">
            <a href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm">
              Go to Dashboard
            </a>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important:</h4>
          <p className="text-sm text-yellow-700">
            This is a temporary admin page. After setting your role as host, 
            you should delete this page for security reasons.
          </p>
        </div>
      </div>
    </div>
  );
}



