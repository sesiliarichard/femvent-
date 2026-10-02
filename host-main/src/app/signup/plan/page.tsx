'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function SignupPlanPage() {
  return (
    <Suspense fallback={null}>
      <SignupPlanContent />
    </Suspense>
  );
}

function SignupPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, signIn, user } = useAuth();
  const [error, setError] = useState('');
  const hasRun = useRef(false);

  const fullName = searchParams?.get('fullName') || '';
  const organizationName = searchParams?.get('organizationName') || '';
  const businessEmail = searchParams?.get('businessEmail') || '';
  const email = searchParams?.get('email') || businessEmail || user?.email || '';
  const password = searchParams?.get('password') || '';
  const isReturningUser = !!user;

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const finishSignup = async () => {
      if (!isReturningUser && (!fullName || !email || !password)) {
        router.push('/signup');
        return;
      }

      try {
        if (!isReturningUser) {
          try {
            await signUp(email, password, fullName, {
              role: 'host',
              organizationName,
              businessEmail,
            });
          } catch (signUpErr: any) {
            if (signUpErr.message?.toLowerCase().includes('already registered')) {
              await signIn(email, password);
              const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();

              if (!existing) throw signUpErr;
            } else {
              throw signUpErr;
            }
          }
        }

        router.push('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Unable to create your account. Please try again.');
      }
    };

    finishSignup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900 flex items-center justify-center">
      <div className="mx-auto max-w-md rounded-[32px] bg-white p-8 shadow-xl shadow-slate-200/80 text-center">
        {error ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-500 mb-3">
              Something went wrong
            </p>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:-translate-y-0.5"
            >
              Back to sign up
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>
            <p className="text-sm font-semibold text-slate-700">Setting up your account...</p>
            <p className="text-xs text-slate-400 mt-1.5">Hosting on FemVents is free — no payment needed.</p>
          </>
        )}
      </div>
    </main>
  );
}