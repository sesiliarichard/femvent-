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
            {slideshowImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 relative overflow-hidden">
        {/* Subtle animated background for right side */}
        <div className="absolute top-1/4 -right-32 h-64 w-64 rounded-full bg-primary-400/5 blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 h-64 w-64 rounded-full bg-secondary-400/5 blur-3xl" />

      <div className="relative w-full max-w-md z-10">
        {/* Logo and branding - Mobile Only */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-rose-500 to-orange-400 shadow-2xl shadow-purple-600/30 mb-5 p-1">
            <div className="bg-white rounded-xl w-full h-full flex items-center justify-center">
              <img
                src="/icon.png"
                alt="FemVents App"
                className="h-14 w-14 rounded-lg"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 via-rose-500 to-orange-400 bg-clip-text text-transparent">
              Create Account
            </span>
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Join the FemVents community
          </p>
        </div>

        {/* Logo and branding - Desktop (Right Side) */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:mb-8">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-rose-500 to-orange-400 shadow-2xl shadow-purple-600/30 mb-5 p-1">
            <div className="bg-white rounded-xl w-full h-full flex items-center justify-center">
              <img
                src="/icon.png"
                alt="FemVents App"
                className="h-14 w-14 rounded-lg"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 via-rose-500 to-orange-400 bg-clip-text text-transparent">
              Create Account
            </span>
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Join the FemVents community
          </p>
        </div>
        
        {/* Card */}
        <div className="border border-gray-200/30 bg-white/60 backdrop-blur-xl shadow-2xl shadow-black/20 rounded-lg p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name Input */}
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
            </div>

            {/* Email Input */}
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
              {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
            </div>

            {/* Password Input with Eye Icon */}
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
            </div>

            {/* Confirm Password Input with Eye Icon */}
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {confirmPasswordError && <p className="mt-1 text-xs text-red-600">{confirmPasswordError}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 via-rose-500 to-orange-400 hover:from-purple-700 hover:via-rose-600 hover:to-orange-500 shadow-lg shadow-purple-600/25 transition-all duration-300 hover:shadow-purple-600/40 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
            </div>

            {/* Already have account - Sign In button */}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Already have an account? Sign In
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
