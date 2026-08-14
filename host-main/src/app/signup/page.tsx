'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateBusinessEmail } from '@/lib/validators/businessEmail';

const initialForm = {
  fullName: '',
  organizationName: '',
  businessEmail: '',
  password: '',
  confirmPassword: '',
};

export default function HostOrganizerSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setError('');
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const nextErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!form.organizationName.trim()) {
      nextErrors.organizationName = 'Organization name is required.';
    }

    const businessEmailError = validateBusinessEmail(form.businessEmail);
    if (businessEmailError) {
      nextErrors.businessEmail = businessEmailError;
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const params = new URLSearchParams({
      fullName: form.fullName.trim(),
      organizationName: form.organizationName.trim(),
      businessEmail: form.businessEmail.trim(),
      email: form.businessEmail.trim(),
      password: form.password,
    });

    router.push(`/signup/plan?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-slate-900/30">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="bg-gradient-to-br from-rose-600 via-pink-600 to-orange-500 p-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-100">Host onboarding</p>
            <h1 className="mt-6 text-4xl font-black tracking-tight">Create your organizer account</h1>
            <p className="mt-4 max-w-md text-base text-rose-100/90">
              Set up your organization details and choose the plan that matches your event goals.
            </p>
          </div>

          <div className="p-8 sm:p-10">
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Full name</label>
                <input
                  value={form.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-rose-400 focus:bg-white"
                  placeholder="Alicia Mwangi"
                />
                {fieldErrors.fullName ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p> : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Organization name</label>
                <input
                  value={form.organizationName}
                  onChange={(event) => updateField('organizationName', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-rose-400 focus:bg-white"
                  placeholder="Lumo Events"
                />
                {fieldErrors.organizationName ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.organizationName}</p> : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Business email</label>
                <input
                  type="email"
                  value={form.businessEmail}
                  onChange={(event) => updateField('businessEmail', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-rose-400 focus:bg-white"
                  placeholder="hello@lumoevents.com"
                />
                {fieldErrors.businessEmail ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.businessEmail}</p> : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-rose-400 focus:bg-white"
                    placeholder="••••••••"
                  />
                  {fieldErrors.password ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p> : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Confirm password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-rose-400 focus:bg-white"
                    placeholder="••••••••"
                  />
                  {fieldErrors.confirmPassword ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.confirmPassword}</p> : null}
                </div>
              </div>

              {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

              <button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:-translate-y-0.5"
              >
                Continue to plan selection
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}