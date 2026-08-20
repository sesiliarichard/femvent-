import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface PlatformPaymentSetting {
  id: string;
  provider: 'pesapal' | 'crypto' | 'azampay';
  status: string;
  credentials: Record<string, string>;
  display_label: string | null;
}

const PROVIDER_META: Record<string, { name: string; blurb: string }> = {
  pesapal: { name: 'Pesapal', blurb: 'Card & mobile money — East/Southern Africa + international cards.' },
  crypto: { name: 'Crypto (NOWPayments)', blurb: 'Accept crypto payments platform-wide via NOWPayments.' },
  azampay: { name: 'AzamPay', blurb: 'Mobile money — Tanzania/Rwanda (M-Pesa, Tigo Pesa, Airtel Money, etc.)' },
};

export default function PaymentMethodsPage() {
  const [settings, setSettings] = useState<PlatformPaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<'pesapal' | 'crypto' | 'azampay' | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('platform_payment_settings').select('*');
      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Error loading platform payment settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const getSettingFor = (provider: string) =>
    settings.find((s) => s.provider === provider && s.status === 'active');

  const handleDelete = async (provider: string) => {
    if (!confirm(`Disconnect ${PROVIDER_META[provider].name}? This will stop host subscription payments via this method.`)) return;
    try {
      const { error } = await supabase
        .from('platform_payment_settings')
        .update({ status: 'inactive', credentials: {}, updated_at: new Date().toISOString() })
        .eq('provider', provider);
      if (error) throw error;
      loadSettings();
    } catch (err) {
      console.error('Error disconnecting provider:', err);
      alert('Failed to disconnect');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Payment Methods</h1>
          <p className="text-gray-600">
            Configure which payment providers hosts can use to pay for dashboard access.
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-2xl">
          {Object.entries(PROVIDER_META).map(([provider, meta]) => {
            const setting = getSettingFor(provider);
            const isOpen = activeForm === provider;

            return (
              <div key={provider} className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{meta.name}</p>
                    <p className="text-sm text-gray-500">{meta.blurb}</p>
                  </div>

                  {setting ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-green-700">✅ Connected</span>
                      <button
                        onClick={() => handleDelete(provider)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveForm(isOpen ? null : (provider as any))}
                      className="text-sm font-semibold px-4 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      {isOpen ? 'Cancel' : 'Connect'}
                    </button>
                  )}
                </div>

                {isOpen && provider === 'pesapal' && (
                  <PesapalForm onSaved={() => { setActiveForm(null); loadSettings(); }} />
                )}
                {isOpen && provider === 'crypto' && (
                  <CryptoForm onSaved={() => { setActiveForm(null); loadSettings(); }} />
                )}
                {isOpen && provider === 'azampay' && (
                  <AzamPayForm onSaved={() => { setActiveForm(null); loadSettings(); }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

async function saveProvider(provider: string, credentials: Record<string, string>, displayLabel: string) {
  const { error } = await supabase
    .from('platform_payment_settings')
    .upsert(
      {
        provider,
        status: 'active',
        credentials,
        display_label: displayLabel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider' }
    );
  if (error) throw error;
}

function PesapalForm({ onSaved }: { onSaved: () => void }) {
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [ipnId, setIpnId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await saveProvider(
        'pesapal',
        { consumer_key: consumerKey, consumer_secret: consumerSecret, ipn_id: ipnId },
        'Pesapal — Card & Mobile Money'
      );
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
           <input required autoComplete="off" placeholder="Consumer Key" value={consumerKey} onChange={(e) => setConsumerKey(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input required type="password" autoComplete="new-password" placeholder="Consumer Secret" value={consumerSecret} onChange={(e) => setConsumerSecret(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input required autoComplete="off" placeholder="IPN ID" value={ipnId} onChange={(e) => setIpnId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm disabled:opacity-50">
        {submitting ? 'Saving...' : 'Save Pesapal credentials'}
      </button>
    </form>
  );
}

function CryptoForm({ onSaved }: { onSaved: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [ipnSecret, setIpnSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await saveProvider(
        'crypto',
        { api_key: apiKey, ipn_secret: ipnSecret },
        'Crypto — NOWPayments'
      );
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <input required type="password" autoComplete="new-password" placeholder="NOWPayments API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input required type="password" autoComplete="new-password" placeholder="NOWPayments IPN Secret" value={ipnSecret} onChange={(e) => setIpnSecret(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm disabled:opacity-50">
        {submitting ? 'Saving...' : 'Save Crypto credentials'}
      </button>
    </form>
  );
}

function AzamPayForm({ onSaved }: { onSaved: () => void }) {
  const [appName, setAppName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await saveProvider(
        'azampay',
        { app_name: appName, client_id: clientId, client_secret: clientSecret, api_key: apiKey },
        'AzamPay — Mobile Money & Bank'
      );
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input required autoComplete="off" placeholder="App Name" value={appName} onChange={(e) => setAppName(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input required autoComplete="off" placeholder="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input required type="password" autoComplete="new-password" placeholder="Client Secret" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      <input required type="password" autoComplete="new-password" placeholder="API Key (Token)" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm disabled:opacity-50">
        {submitting ? 'Saving...' : 'Save AzamPay credentials'}
      </button>
    </form>
  );
}