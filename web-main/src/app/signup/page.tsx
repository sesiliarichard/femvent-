'use client';

import { useState, type FormEvent } from 'react';

export default function OrganizerSignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    companyAddress: '',
    email: '',
    phone: '',
    plan: 'starter',
  });
  const [error, setError] = useState('');

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.fullName || !formData.companyName || !formData.companyAddress || !formData.email) {
      setError('Please fill in your name, company name, address, and email.');
      return;
    }

    const payload = {
      ...formData,
      submittedAt: new Date().toISOString(),
    };

    window.localStorage.setItem('organizerApplication', JSON.stringify(payload));
    window.localStorage.setItem('organizerAccess', 'granted');

    try {
      const resp = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Failed to store application');
      const json = await resp.json();
      const appId = json.id;

      const hostAppBaseUrl = process.env.NEXT_PUBLIC_HOST_APP_URL || 'http://localhost:3001';
      const params = new URLSearchParams({ appId });
      window.location.assign(`${hostAppBaseUrl}/signup?${params.toString()}`);
    } catch (err) {
      const hostAppBaseUrl = process.env.NEXT_PUBLIC_HOST_APP_URL || 'http://localhost:3001';
      const params = new URLSearchParams({
        fullName: formData.fullName,
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        email: formData.email,
        phone: formData.phone,
        plan: formData.plan,
      });
      window.location.assign(`${hostAppBaseUrl}/signup?${params.toString()}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 px-6 py-20">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-xl shadow-rose-100/70">
        <h1 className="text-4xl font-black tracking-tight text-gray-900">Become a host and start creating events</h1>
        <p className="mt-3 text-lg text-gray-600">
          Create your organizer profile and continue into the host dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Full name
              <input
                required
                value={formData.fullName}
                onChange={(event) => handleChange('fullName', event.target.value)}
                placeholder="Alicia Mwangi"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:bg-white"
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              Email address
              <input
                required
                type="email"
                value={formData.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="you@company.com"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:bg-white"
              />
            </label>
          </div>

          <label className="text-sm font-medium text-gray-700">
            Company name
            <input
              required
              value={formData.companyName}
              onChange={(event) => handleChange('companyName', event.target.value)}
              placeholder="Lumo Events"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:bg-white"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Company address
            <textarea
              required
              rows={3}
              value={formData.companyAddress}
              onChange={(event) => handleChange('companyAddress', event.target.value)}
              placeholder="Street, city, country"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:bg-white"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Phone number
            <input
              value={formData.phone}
              onChange={(event) => handleChange('phone', event.target.value)}
              placeholder="+254 700 000000"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:bg-white"
            />
          </label>

          {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:-translate-y-0.5"
          >
            Continue to host dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
