import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface PlatformPaymentSetting {
  provider: 'pesapal' | 'crypto' | 'azampay';
  status: string;
  credentials?: Record<string, any>;
}

const PROVIDER_META: Record<string, { name: string; blurb: string }> = {
  pesapal: { name: 'Pesapal', blurb: 'Card & mobile money — East/Southern Africa + international cards.' },
  crypto: { name: 'Crypto (NOWPayments)', blurb: 'Accept crypto payments platform-wide via NOWPayments.' },
  azampay: { name: 'AzamPay', blurb: 'Mobile money — Tanzania/Rwanda (M-Pesa, Tigo Pesa, Airtel Money, etc.)' },
};

const CRYPTO_OPTIONS = [
  { label: 'USDT (TRC20)', code: 'usdttrc20' },
  { label: 'USDT (ERC20)', code: 'usdterc20' },
  { label: 'USDT (BEP20)', code: 'usdtbsc' },
  { label: 'BTC', code: 'btc' },
  { label: 'ETH (ERC20)', code: 'eth' },
];

export default function PaymentMethodsPage() {
  const [settings, setSettings] = useState<PlatformPaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [payoutCurrency, setPayoutCurrency] = useState(CRYPTO_OPTIONS[0].code);
  const [savingCrypto, setSavingCrypto] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('platform_payment_settings').select('provider, status, credentials');
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

  useEffect(() => {
    const crypto = settings.find((s) => s.provider === 'crypto');
    setCryptoAddress(crypto?.credentials?.cryptoAddress || '');
    setPayoutCurrency(crypto?.credentials?.payoutCurrency || CRYPTO_OPTIONS[0].code);
  }, [settings]);

  const isActive = (provider: string) =>
    settings.find((s) => s.provider === provider)?.status === 'active';

  const toggleProvider = async (provider: string, currentlyActive: boolean) => {
    setSaving(provider);
    try {
      const existing = settings.find((s) => s.provider === provider);
      const { error } = await supabase
        .from('platform_payment_settings')
        .upsert(
          {
            provider,
            status: currentlyActive ? 'inactive' : 'active',
            credentials: existing?.credentials ?? {},
            display_label: PROVIDER_META[provider].name,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'provider' }
        );
      if (error) throw error;
      await loadSettings();
    } catch (err) {
      console.error('Error toggling provider:', err);
      alert('Failed to update');
    } finally {
      setSaving(null);
    }
  };

  const saveCryptoAddress = async () => {
    if (!cryptoAddress.trim() || !payoutCurrency) {
      alert('Please enter a wallet address and select a currency/network');
      return;
    }
    setSavingCrypto(true);
    try {
      const existing = settings.find((s) => s.provider === 'crypto');
      const { error } = await supabase
        .from('platform_payment_settings')
        .upsert(
          {
            provider: 'crypto',
            status: existing?.status ?? 'inactive',
            credentials: { cryptoAddress: cryptoAddress.trim(), payoutCurrency },
            display_label: PROVIDER_META.crypto.name,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'provider' }
        );
      if (error) throw error;
      await loadSettings();
      alert('Crypto receiving address saved');
    } catch (err) {
      console.error('Error saving crypto address:', err);
      alert('Failed to save address');
    } finally {
      setSavingCrypto(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Platform Payment Methods</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Choose which payment providers hosts can use to pay for dashboard access.
            API credentials are configured separately in the hosting environment.
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-2xl">
          {Object.entries(PROVIDER_META).map(([provider, meta]) => {
            const active = isActive(provider);
            return (
              <div key={provider} className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
                <label className="flex items-center justify-between p-5 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{meta.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{meta.blurb}</p>
                  </div>
                  <div className="relative w-12 h-7 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={active}
                      disabled={saving === provider}
                      onChange={() => toggleProvider(provider, active)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-7 rounded-full transition-colors ${active ? 'bg-primary-600' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                </label>

                {provider === 'crypto' && (
                  <div className="p-5 pt-0 flex flex-col gap-2 border-t border-gray-100">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mt-3">Receiving wallet address</label>
                    <input
                      type="text"
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      placeholder="e.g. 0x1234... or bc1q..."
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                    />
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Currency & network</label>
                    <select
                      value={payoutCurrency}
                      onChange={(e) => setPayoutCurrency(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                    >
                      {CRYPTO_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={saveCryptoAddress}
                      disabled={savingCrypto}
                      className="self-start mt-2 px-5 py-2.5 text-sm font-bold text-white bg-secondary-500 rounded-xl hover:bg-secondary-600 disabled:opacity-50 transition-colors"
                    >
                      {savingCrypto ? 'Saving...' : 'Save address'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}