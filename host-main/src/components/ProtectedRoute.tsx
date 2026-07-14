'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isHost, setIsHost] = useState(false);
  const [checkingHost, setCheckingHost] = useState(true);

  useEffect(() => {
    const checkHostStatus = async () => {
      if (!loading && user) {
        try {
          // If admin is required, strictly check for admin role
          if (requireAdmin) {
            if (userProfile?.role === 'admin') {
              setIsHost(true);
              setCheckingHost(false);
              return;
            } else {
              setIsHost(false);
              setCheckingHost(false);
              return;
            }
          }

          // Check if user has host role OR an approved host application
          if (userProfile?.role === 'host' || userProfile?.hostApplication?.status === 'approved' || userProfile?.role === 'admin') {
            setIsHost(true);
            setCheckingHost(false);
            return;
          }

        // Check if user has created any events (alternative way to determine host)
        const { data: hostEvents, error } = await supabase
        .from('events')
        .select('id')
        .eq('host_id', user.id)
        .limit(1);

      if (error) throw error;

      if (hostEvents && hostEvents.length > 0) {
        setIsHost(true);
      } else {
        // Show access denied message
        setIsHost(false);
      }
        } catch (error) {
          console.error('Error checking host status:', error);
          setIsHost(false);
        }
        setCheckingHost(false);
      } else if (!loading && !user) {
        router.push('/login');
      }
    };

    checkHostStatus();
  }, [user, userProfile, loading, router]);

  if (loading || checkingHost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isHost) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Only hosts can access this platform. You need to be approved as a host to create and manage events.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact the administrator.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
