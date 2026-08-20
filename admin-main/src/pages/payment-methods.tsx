import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface PlatformPaymentSetting {
  provider: 'pesapal' | 'crypto' | 'azampay';
  status: string;
}

const PROVIDER_META: Record<string, { name: string; blurb: string }> = {
  pesapal: { name: 'Pesapal', blurb: 'Card & mobile money — East/Southern Africa + international cards.' },
  crypto: { name: 'Crypto (NOWPayments)', blurb: 'Accept crypto payments platform-wide via NOWPayments.' },
  azampay: { name: 'AzamPay', blurb: 'Mobile money — Tanzania/Rwanda (M-Pesa, Tigo Pesa, Airtel Money, etc.)' },
};

export default function PaymentMethodsPage() {
  const [settings, setSettings] = useState<PlatformPaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('platform_payment_settings').select('provider, status');
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

  const isActive = (provider: string) =>
    settings.find((s) => s.provider === provider)?.status === 'active';

  const toggleProvider = async (provider: string, currentlyActive: boolean) => {
    setSaving(provider);
    try {
      const { error } = await supabase
        .from('platform_payment_settings')
        .upsert(
          {
            provider,
            status: currentlyActive ? 'inactive' : 'active',
            credentials: {},
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
            Choose which payment providers hosts can use to pay for dashboard access.
            API credentials are configured separately in the hosting environment.
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-2xl">
          {Object.entries(PROVIDER_META).map(([provider, meta]) => {
            const active = isActive(provider);
            return (
              <label
                key={provider}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-900">{meta.name}</p>
                  <p className="text-sm text-gray-500">{meta.blurb}</p>
                </div>
                <input
                  type="checkbox"
                  checked={active}
                  disabled={saving === provider}
                  onChange={() => toggleProvider(provider, active)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}