'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

interface Bank {
  id: number;
  code: string;
  name: string;
}

interface PaymentAccount {
  id: string;
  provider: 'flutterwave' | 'stripe' | 'paypal' | 'manual' | 'azampay' | 'wise' | 'crypto';
  status: string;
  display_label: string | null;
}

const PROVIDER_META: Record<string, { name: string; blurb: string; comingSoon?: boolean }> = {
  azampay: { name: 'AzamPay (Mobile Money & Bank)', blurb: 'Buyers pay instantly via M-Pesa, Tigo Pesa, Airtel Money, HaloPesa, or bank transfer. Best for Tanzania & Rwanda.' },
  crypto: { name: 'Crypto (USDT)', blurb: 'Buyers pay with cryptocurrency. Works for buyers anywhere in the world.' },
  manual: { name: 'Manual bank transfer', blurb: 'Works anywhere. Buyers pay you directly and you confirm the ticket.' },
  wise: { name: 'Wise', blurb: 'For organizers who already use Wise to receive international transfers.' },
  flutterwave: { name: 'Flutterwave', blurb: 'Best for organizers in Africa.', comingSoon: true },
  stripe: { name: 'Stripe', blurb: 'Best for organizers in the US, UK, EU, Canada, Australia.', comingSoon: true },
  paypal: { name: 'PayPal', blurb: 'Wide reach for receiving international payments.', comingSoon: true },
};

export default function PaymentSettingsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [activeForm, setActiveForm] = useState<'flutterwave' | 'manual' | 'azampay' | 'wise' | 'crypto' | null>(null);

  const loadAccounts = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/payments/list-accounts?userId=${user.id}`);
      const data = await res.json();
      if (res.ok) setAccounts(data.accounts || []);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [user?.id]);

  const getAccountFor = (provider: string) =>
    accounts.find((a) => a.provider === provider && a.status === 'active');

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Payment settings</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Connect at least one payment method so ticket money comes directly to you.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(PROVIDER_META).map(([provider, meta]) => {
            const account = getAccountFor(provider);
            const isOpen = activeForm === provider;

            return (
              <div
                key={provider}
                style={{
                  border: '1px solid #e5e5e5',
                  borderRadius: 12,
                  padding: 16,
                  opacity: meta.comingSoon ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 16 }}>{meta.name}</p>
                    <p style={{ fontSize: 13, color: '#888' }}>{meta.blurb}</p>
                  </div>

                  {meta.comingSoon ? (
                    <span style={{ fontSize: 12, color: '#999', fontWeight: 600 }}>Coming soon</span>
                  ) : account ? (
                    <span style={{ fontSize: 12, color: '#065f46', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {account.display_label}
                  </span>
                  ) : (
                    <button
                    onClick={() => setActiveForm(isOpen ? null : (provider as 'flutterwave' | 'manual' | 'azampay' | 'wise' | 'crypto'))}
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1px solid #4f46e5',
                        color: '#4f46e5',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {isOpen ? 'Cancel' : 'Connect'}
                    </button>
                  )}
                </div>

                {isOpen && provider === 'flutterwave' && (
                  <FlutterwaveForm userId={user?.id} onConnected={() => { setActiveForm(null); loadAccounts(); }} />
                )}
                {isOpen && provider === 'manual' && (
                  <ManualForm userId={user?.id} onConnected={() => { setActiveForm(null); loadAccounts(); }} />
                )}
               {isOpen && provider === 'azampay' && (
                  <AzamPayForm userId={user?.id} onConnected={() => { setActiveForm(null); loadAccounts(); }} />
                )}
                {isOpen && provider === 'wise' && (
                  <WiseForm userId={user?.id} onConnected={() => { setActiveForm(null); loadAccounts(); }} />
                )}
                {isOpen && provider === 'crypto' && (
                  <CryptoForm userId={user?.id} onConnected={() => { setActiveForm(null); loadAccounts(); }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

function FlutterwaveForm({ userId, onConnected }: { userId?: string; onConnected: () => void }) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/payments/banks?country=TZ')
      .then((r) => r.json())
      .then((d) => setBanks(d.banks || []))
      .catch(() => setError('Failed to load banks'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/create-subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          accountBankCode: bankCode,
          accountNumber,
          accountName,
          businessName: accountName,
          country: 'TZ',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to connect');
        return;
      }
      onConnected();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <select required value={bankCode} onChange={(e) => setBankCode(e.target.value)} style={inputStyle}>
        <option value="">Select your bank</option>
        {banks.map((b) => <option key={b.id} value={b.code}>{b.name}</option>)}
      </select>
      <input required placeholder="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={inputStyle} />
      <input required placeholder="Account holder name" value={accountName} onChange={(e) => setAccountName(e.target.value)} style={inputStyle} />
      {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
      <button type="submit" disabled={submitting} style={submitButtonStyle}>
        {submitting ? 'Connecting...' : 'Connect Flutterwave'}
      </button>
    </form>
  );
}

function ManualForm({ userId, onConnected }: { userId?: string; onConnected: () => void }) {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/create-manual-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bankName, accountNumber, accountName, instructions }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }
      onConnected();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input required placeholder="Bank or mobile money name" value={bankName} onChange={(e) => setBankName(e.target.value)} style={inputStyle} />
      <input required placeholder="Account / phone number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={inputStyle} />
      <input required placeholder="Account holder name" value={accountName} onChange={(e) => setAccountName(e.target.value)} style={inputStyle} />
      <textarea placeholder="Instructions for buyers (optional)" value={instructions} onChange={(e) => setInstructions(e.target.value)} style={{ ...inputStyle, minHeight: 70 }} />
      {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
      <button type="submit" disabled={submitting} style={submitButtonStyle}>
        {submitting ? 'Saving...' : 'Save bank details'}
      </button>
    </form>
  );
}

function AzamPayForm({ userId, onConnected }: { userId?: string; onConnected: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnable = async () => {
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/create-azampay-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, enabled: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to enable');
        return;
      }
      onConnected();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, color: '#666' }}>
        No account details needed — payments go through our platform, and payouts are
        settled to you separately.
      </p>
      {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
      <button onClick={handleEnable} disabled={submitting} style={submitButtonStyle}>
        {submitting ? 'Enabling...' : 'Enable AzamPay'}
      </button>
    </div>
  );
}

function WiseForm({ userId, onConnected }: { userId?: string; onConnected: () => void }) {
  const [wiseEmail, setWiseEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/create-wise-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, wiseEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to connect');
        return;
      }
      onConnected();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input required type="email" placeholder="Your Wise account email" value={wiseEmail} onChange={(e) => setWiseEmail(e.target.value)} style={inputStyle} />
      {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
      <button type="submit" disabled={submitting} style={submitButtonStyle}>
        {submitting ? 'Connecting...' : 'Connect Wise'}
      </button>
    </form>
  );
}

function CryptoForm({ userId, onConnected }: { userId?: string; onConnected: () => void }) {
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('USDT-TRC20');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/create-crypto-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, cryptoAddress, cryptoNetwork }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to connect');
        return;
      }
      onConnected();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <select value={cryptoNetwork} onChange={(e) => setCryptoNetwork(e.target.value)} style={inputStyle}>
        <option value="USDT-TRC20">USDT (TRC-20)</option>
        <option value="USDT-ERC20">USDT (ERC-20)</option>
        <option value="BTC">Bitcoin</option>
      </select>
      <input required placeholder="Wallet address" value={cryptoAddress} onChange={(e) => setCryptoAddress(e.target.value)} style={inputStyle} />
      {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
      <button type="submit" disabled={submitting} style={submitButtonStyle}>
        {submitting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: 14,
};

const submitButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};