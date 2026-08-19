'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29/mo',
    description: 'For new organizers launching their first event.',
    badge: 'Best for first-time hosts',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$79/mo',
    description: 'For growing communities managing more than one event.',
    badge: 'Popular for scaling teams',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$149/mo',
    description: 'Advanced automation, analytics, and premium support.',
    badge: 'Built for full-scale operations',
  },
] as const;

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
  const { signUp } = useAuth();
  const planFromUrl = searchParams?.get('plan') as (typeof plans)[number]['id'] | null;
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[number]['id']>(
    planFromUrl && plans.some((p) => p.id === planFromUrl) ? planFromUrl : 'starter'
  );
  const [step, setStep] = useState<'plan' | 'payment'>('plan');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pesapal' | 'crypto' | 'azampay' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    { key: 'pesapal', label: 'Pesapal', desc: 'Card & mobile money — East/Southern Africa + international cards' },
    { key: 'crypto', label: 'Crypto (USDT)', desc: 'Crypto payments via NOWPayments' },
    { key: 'azampay', label: 'AzamPay', desc: 'Mobile money — Tanzania/Rwanda (M-Pesa, Tigo Pesa, Airtel Money, etc.)' },
  ] as const;

  const selectedPlanDetails = plans.find((p) => p.id === selectedPlan)!;

  const fullName = searchParams?.get('fullName') || '';
  const organizationName = searchParams?.get('organizationName') || '';
  const businessEmail = searchParams?.get('businessEmail') || '';
  const email = searchParams?.get('email') || businessEmail;
  const password = searchParams?.get('password') || '';

  const handleSubmit = async () => {
    if (!fullName || !email || !password) {
      router.push('/signup');
      return;
    }

    if (!selectedPaymentMethod) {
      setError('Please choose a payment method.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // TODO: create the pending subscription payment here (Pesapal/Crypto/AzamPay checkout)
      // before creating the account, then redirect to the provider's payment page.
      await signUp(email, password, fullName, {
        role: selectedPlan === 'starter' ? 'host' : 'attendee',
        organizationName,
        businessEmail,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Unable to create your organizer account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-[32px] bg-white p-8 shadow-xl shadow-slate-200/80">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-500">Choose a plan</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Pick the setup that fits your team</h1>
        </div>

        {step === 'plan' ? (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`rounded-3xl border p-6 text-left transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50 shadow-lg shadow-rose-100'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{plan.badge}</p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <h2 className="text-2xl font-black">{plan.name}</h2>
                      <span className="text-lg font-bold text-slate-900">{plan.price}</span>
                    </div>
                    <p className="mt-4 text-sm text-slate-600">{plan.description}</p>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{isSelected ? 'Selected' : 'Choose plan'}</span>
                      <span className={`h-4 w-4 rounded-full border-2 ${isSelected ? 'border-rose-500 bg-rose-500' : 'border-slate-300 bg-white'}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
              <div className="text-sm text-slate-500">
                You'll pay for {selectedPlanDetails.name} ({selectedPlanDetails.price}) on the next step.
              </div>

              <button
                type="button"
                onClick={() => setStep('payment')}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:-translate-y-0.5"
              >
                Continue to payment
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Selected plan</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">{selectedPlanDetails.name}</span>
                <span className="text-lg font-bold text-slate-900">{selectedPlanDetails.price}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep('plan')}
                className="mt-3 text-sm font-semibold text-rose-600 hover:text-rose-700"
              >
                ← Change plan
              </button>
            </div>

            <h2 className="mb-4 text-lg font-bold text-slate-900">Choose a payment method</h2>
            <div className="space-y-3">
              {paymentMethods.map(({ key, label, desc }) => {
                const isSelected = selectedPaymentMethod === key;
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 p-4 transition-colors ${
                      isSelected ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={isSelected}
                        onChange={() => setSelectedPaymentMethod(key)}
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
              <div className="text-sm text-slate-500">
                You'll be redirected to complete your payment securely.
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedPaymentMethod}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Processing...' : `Pay ${selectedPlanDetails.price} & continue`}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}