/**
 * ENHANCED SETTINGS PAGE (/settings)
 * Premium user settings with modern UI and smooth animations
 */
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export default function Settings() {
  const { userProfile } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="settings">
        <SettingsContent userProfile={userProfile} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function SettingsContent({ userProfile }: { userProfile: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'notifications' | 'payout'>('profile');

  const AUTO_PAYOUT_COUNTRIES = [
    { code: 'TZ', name: 'Tanzania' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'GH', name: 'Ghana' },
    { code: 'KE', name: 'Kenya' },
    { code: 'UG', name: 'Uganda' },
    { code: 'ZA', name: 'South Africa' },
  ];

  const [payoutData, setPayoutData] = useState({
    country: 'TZ',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });
  const [bankOptions, setBankOptions] = useState<{ code: string; name: string }[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState<string | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<'flutterwave' | 'wise' | 'crypto' | 'manual' | 'azampay' | 'pesapal'>('flutterwave');
  const [wiseEmail, setWiseEmail] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('USDT-TRC20');
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const isAutoPayoutCountry = AUTO_PAYOUT_COUNTRIES.some((c) => c.code === payoutData.country);

  const loadConnectedAccounts = async () => {
    if (!userProfile?.id) return;
    setLoadingAccounts(true);
    try {
      const res = await fetch(`/api/payments/list-accounts?userId=${userProfile.id}`);
      const data = await res.json();
      if (res.ok) setConnectedAccounts(data.accounts || []);
    } catch (err) {
      console.error('Failed to load connected accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadHistory = async () => {
    if (!userProfile?.id) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/payments/history?userId=${userProfile.id}`);
      const data = await res.json();
      if (res.ok) setHistoryItems(data.history || []);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadConnectedAccounts();
    loadHistory();
  }, [userProfile?.id]);

  const handleDeleteAccount = async (provider: string) => {
    if (!userProfile?.id) return;
    if (!confirm(`Remove your ${provider} payout method? Ticket buyers will no longer see this as a payment option.`)) {
      return;
    }
    setDeletingProvider(provider);
    try {
      const res = await fetch('/api/payments/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userProfile.id, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove payment method');
      await loadConnectedAccounts();
      await loadHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to remove payment method');
    } finally {
      setDeletingProvider(null);
    }
  };

  useEffect(() => {
    if (payoutMethod !== 'flutterwave' || !isAutoPayoutCountry) {
      setBankOptions([]);
      return;
    }
    const loadBanks = async () => {
      setLoadingBanks(true);
      try {
        const res = await fetch(`/api/payments/banks?country=${payoutData.country}`);
        const data = await res.json();
        setBankOptions(data.banks || []);
      } catch (err) {
        console.error('Failed to load banks:', err);
      } finally {
        setLoadingBanks(false);
      }
    };
    loadBanks();
  }, [payoutData.country, isAutoPayoutCountry, payoutMethod]);

 const handlePayoutSave = async () => {
    if (!userProfile?.id) return;
    setSavingPayout(true);
    setPayoutStatus(null);
    try {
      if (payoutMethod === 'flutterwave') {
        if (!isAutoPayoutCountry) {
          setPayoutStatus('Flutterwave isn\'t available in your selected country yet. Try Wise, Crypto, or Bank Wire instead.');
          setSavingPayout(false);
          return;
        }
        if (!payoutData.bankCode || !payoutData.accountNumber || !payoutData.accountName) {
          setPayoutStatus('Please fill in all payout fields.');
          setSavingPayout(false);
          return;
        }
        const res = await fetch('/api/payments/create-subaccount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userProfile.id,
            accountBankCode: payoutData.bankCode,
            accountNumber: payoutData.accountNumber,
            accountName: payoutData.accountName,
            businessName: profileData.name,
            businessEmail: profileData.email,
            country: payoutData.country,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save payout details');
        setPayoutStatus('Flutterwave connected! You\'ll now receive ticket payments automatically.');
      } else if (payoutMethod === 'wise') {
        if (!wiseEmail) {
          setPayoutStatus('Please enter your Wise account email.');
          setSavingPayout(false);
          return;
        }
        const res = await fetch('/api/payments/create-wise-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userProfile.id, wiseEmail }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to connect Wise');
        setPayoutStatus('Wise connected! You\'ll now receive ticket payments to your Wise account.');
      } else if (payoutMethod === 'crypto') {
        if (!cryptoAddress) {
          setPayoutStatus('Please enter your wallet address.');
          setSavingPayout(false);
          return;
        }
        const res = await fetch('/api/payments/create-crypto-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userProfile.id, cryptoAddress, cryptoNetwork }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save wallet address');
        setPayoutStatus('Wallet connected! You\'ll now receive ticket payments in crypto.');
      } else if (payoutMethod === 'azampay') {
        const res = await fetch('/api/payments/create-azampay-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userProfile.id, enabled: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to enable AzamPay');
        setPayoutStatus('AzamPay enabled! Buyers can now pay via mobile money or bank transfer.');
      } else if (payoutMethod === 'pesapal') {
        const res = await fetch('/api/payments/create-pesapal-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userProfile.id, enabled: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to enable Pesapal');
        setPayoutStatus('Pesapal enabled! Buyers can now pay via card or mobile money.');
      } else {
        if (!payoutData.bankCode || !payoutData.accountNumber || !payoutData.accountName) {
          setPayoutStatus('Please fill in all payout fields.');
          setSavingPayout(false);
          return;
        }
        await supabase
          .from('users')
          .update({
            bank_name: payoutData.bankCode,
            bank_account_number: payoutData.accountNumber,
            bank_account_name: payoutData.accountName,
          })
          .eq('id', userProfile.id);

        const res = await fetch('/api/payments/create-manual-payout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userProfile.id,
            bankName: payoutData.bankCode,
            accountNumber: payoutData.accountNumber,
            accountName: payoutData.accountName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save payout details');

        setPayoutStatus('Bank details saved. FemVents will send your ticket revenue manually.');
      }
      await loadConnectedAccounts();
      await loadHistory();
    } catch (err: any) {
      setPayoutStatus(err.message || 'Failed to save payout details');
    } finally {
      setSavingPayout(false);
    }
  };
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    bio: '',
    website: '',
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '24',
  });

  useEffect(() => {
    if (userProfile?.id) {
      loadUserData();
    }
  }, [userProfile?.id]);

  const loadUserData = async () => {
    try {
      if (!userProfile?.id) return;

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userProfile.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setProfileData({
          name: data.name || userProfile.name || '',
          email: data.email || userProfile.email || '',
          phone: data.phone || '',
          company: data.company || '',
          bio: data.bio || '',
          website: data.website || '',
        });

        if (data.preferences) {
          setPreferences({ ...preferences, ...data.preferences });
        }

        if (data.security) {
          setSecurity({ ...security, ...data.security });
        }
      } else {
        setProfileData({
          name: userProfile.name || '',
          email: userProfile.email || '',
          phone: '',
          company: '',
          bio: '',
          website: '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      logger.error('Failed to load user settings', {
        context: 'Settings',
        operation: 'loadUserData',
        error: error as Error,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!userProfile?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
      .from('users')
      .update({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        company: profileData.company,
        bio: profileData.bio,
        website: profileData.website,
      })
      .eq('id', userProfile.id);

    if (error) throw error;

    logger.logUserAction('profile_updated', {
        userId: userProfile.id,
        fields: Object.keys(profileData),
      });

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      logger.error('Failed to update profile', {
        context: 'Settings',
        operation: 'updateProfile',
        error: error as Error,
      });
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    if (!userProfile?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
      .from('users')
      .update({ preferences })
      .eq('id', userProfile.id);

    if (error) throw error;

    logger.logUserAction('preferences_updated', {
        userId: userProfile.id,
      });

      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      logger.error('Failed to update preferences', {
        context: 'Settings',
        operation: 'updatePreferences',
        error: error as Error,
      });
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityUpdate = async () => {
    if (!userProfile?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
      .from('users')
      .update({ security })
      .eq('id', userProfile.id);

    if (error) throw error;

    logger.logUserAction('security_settings_updated', {
        userId: userProfile.id,
      });

      alert('Security settings saved successfully!');
    } catch (error) {
      console.error('Error updating security:', error);
      logger.error('Failed to update security settings', {
        context: 'Settings',
        operation: 'updateSecurity',
        error: error as Error,
      });
      alert('Failed to save security settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-pink-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-secondary-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-2xl font-black bg-gradient-to-r from-secondary-500 to-accent-500 bg-clip-text text-transparent">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>, color: 'from-secondary-500 to-accent-500' },
    { id: 'payout', label: 'Payout', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'from-rose-500 to-pink-500' },
    { id: 'preferences', label: 'Preferences', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, color: 'from-purple-500 to-pink-500' },
    { id: 'security', label: 'Security', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>, color: 'from-emerald-500 to-teal-500' },
    { id: 'notifications', label: 'Notifications', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>, color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Premium Header */}
        <div className="mb-10 animate-[fadeIn_0.8s_ease-out]">
          <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-purple-900 via-secondary-900 to-accent-900 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-xl text-purple-600 font-medium mt-2">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Premium Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-pink-200/50 shadow-xl p-3">
            <div className="flex items-center gap-3 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-secondary-500 to-accent-500 text-white shadow-lg shadow-secondary-500/30 scale-105'
                      : 'bg-transparent text-purple-600 hover:bg-pink-100 hover:scale-105'
                  }`}
                >
                                   <span className={`w-5 h-5 transition-transform duration-300 ${
                    activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-pink-200/50 shadow-2xl p-10">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
              <div className="pb-6 border-b-2 border-pink-100">
                <h2 className="text-3xl font-black text-purple-900 mb-2">Profile Information</h2>
                <p className="text-lg text-purple-600 font-medium">Update your personal information and profile details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-semibold placeholder-slate-400"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-semibold placeholder-slate-400"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-semibold placeholder-slate-400"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Company/Organization
                  </label>
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-semibold placeholder-slate-400"
                    placeholder="Acme Inc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-semibold placeholder-slate-400"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={5}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-secondary-500 focus:ring-4 focus:ring-secondary-500/20 transition-all duration-300 text-purple-900 font-medium placeholder-purple-400 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t-2 border-pink-100">
                <button
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  className="group relative bg-gradient-to-r from-secondary-500 to-accent-500 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-secondary-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Changes</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
              <div className="pb-6 border-b-2 border-pink-100">
                <h2 className="text-3xl font-black text-purple-900 mb-2">Preferences</h2>
                <p className="text-lg text-purple-600 font-medium">Customize your app experience</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Language
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-bold cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Timezone
                  </label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-bold cursor-pointer"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Date Format
                  </label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-bold cursor-pointer"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Currency
                  </label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-bold cursor-pointer"
                  >
                     <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-pink-100">
                <h3 className="text-2xl font-black text-purple-900 mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                      { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg> },
                      { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get instant push notifications', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg> },
                      { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotional and marketing content', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m0 0l2.09 1.126a2.25 2.25 0 002.18 0l2.09-1.126M2.25 12.75l6.478-3.488M18.75 12.75l-6.478-3.488" /></svg> }
                  ].map((item, idx) => (
                    <label
                      key={item.key}
                      className="group flex items-center justify-between p-6 bg-gradient-to-r from-pink-50 to-purple-50/30 rounded-2xl border-2 border-pink-200 hover:border-secondary-300 transition-all duration-300 cursor-pointer"
                      style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1}s backwards` }}
                    >
                      <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                          {item.icon}
                        </div>
                        <div>
                          <span className="text-lg font-black text-purple-900 block">{item.label}</span>
                          <span className="text-sm text-purple-600 font-medium">{item.desc}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={preferences[item.key as keyof typeof preferences] as boolean}
                          onChange={(e) => setPreferences({ ...preferences, [item.key]: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                          preferences[item.key as keyof typeof preferences] ? 'bg-gradient-to-r from-secondary-500 to-accent-500' : 'bg-pink-300'
                        }`}>
                          <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                            preferences[item.key as keyof typeof preferences] ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t-2 border-slate-100">
                <button
                  onClick={handlePreferencesUpdate}
                  disabled={saving}
                  className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Preferences</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
              <div className="pb-6 border-b-2 border-slate-100">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Security Settings</h2>
                <p className="text-lg text-slate-600 font-medium">Manage your account security and privacy</p>
              </div>

              <div className="space-y-6">
                <label className="group flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-teal-50/30 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-900 block">Two-Factor Authentication</span>
                      <p className="text-sm text-slate-600 font-medium">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={security.twoFactorEnabled}
                      onChange={(e) => setSecurity({ ...security, twoFactorEnabled: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                      security.twoFactorEnabled ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-slate-300'
                    }`}>
                      <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                        security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                    </div>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                    Session Timeout
                  </label>
                  <select
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                    className="w-full md:w-96 px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-bold cursor-pointer"
                  >
                     <option value="1">1 hour</option>
                    <option value="6">6 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                    <option value="168">1 week</option>
                  </select>
                </div>

                <div className="pt-6 border-t-2 border-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 mb-4">Password</h3>
                  <button className="group flex items-center gap-3 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 px-8 py-4 rounded-2xl font-bold hover:from-slate-200 hover:to-slate-100 transition-all duration-300 hover:scale-105">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Change Password</span>
                  </button>
                  <p className="text-sm text-slate-500 font-medium mt-3">Update your password to keep your account secure</p>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t-2 border-slate-100">
                <button
                  onClick={handleSecurityUpdate}
                  disabled={saving}
                  className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Security Settings</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Payout Tab */}
          {activeTab === 'payout' && (
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                          <div className="pb-6 border-b-2 border-pink-100">
                <h2 className="text-3xl font-black text-purple-900 mb-2">Payout Details</h2>
                <p className="text-lg text-purple-600 font-medium">
                  Set up where you'll receive money from ticket sales
                </p>
              </div>

              {connectedAccounts.length > 0 && (
                <div>
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Connected Payment Methods
                  </label>
                  <div className="space-y-3">
                    {connectedAccounts.map((acc) => (
                      <div
                        key={acc.provider}
                        className="flex items-center justify-between p-5 bg-pink-50 border-2 border-pink-200 rounded-2xl"
                      >
                        <div>
                          <p className="font-black text-purple-900 uppercase text-sm tracking-wide">{acc.provider}</p>
                          <p className="text-sm text-purple-600 font-semibold">{acc.display_label}</p>
                        </div>
                        <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                              if (['manual', 'wise', 'crypto', 'flutterwave', 'azampay', 'pesapal'].includes(acc.provider)) {
                                setPayoutMethod(acc.provider as 'manual' | 'wise' | 'crypto' | 'flutterwave' | 'azampay' | 'pesapal');
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-white border-2 border-pink-300 text-purple-700 text-sm font-bold hover:bg-pink-100 transition-all duration-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc.provider)}
                            disabled={deletingProvider === acc.provider}
                            className="px-4 py-2 rounded-xl bg-white border-2 border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-all duration-300 disabled:opacity-50"
                          >
                            {deletingProvider === acc.provider ? 'Removing...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

<div>
                <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                  How do you want to receive payments?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('flutterwave')}
                    className={`px-4 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      payoutMethod === 'flutterwave'
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                        : 'bg-pink-50 text-purple-700 border-2 border-pink-200'
                    }`}
                  >
                                        <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>Flutterwave
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('wise')}
                    className={`px-4 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      payoutMethod === 'wise'
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                        : 'bg-pink-50 text-purple-700 border-2 border-pink-200'
                    }`}
                  >
                                        <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" /></svg>Wise
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('crypto')}
                    className={`px-4 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      payoutMethod === 'crypto'
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                        : 'bg-pink-50 text-purple-700 border-2 border-pink-200'
                    }`}
                  >
                                       <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Crypto (USDT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('manual')}
                    className={`px-4 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      payoutMethod === 'manual'
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                        : 'bg-pink-50 text-purple-700 border-2 border-pink-200'
                    }`}
                  >
                                        <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>Bank Wire
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('azampay')}
                    className={`px-4 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      payoutMethod === 'azampay'
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                        : 'bg-pink-50 text-purple-700 border-2 border-pink-200'
                    }`}
                  >
                                      <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>AzamPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('pesapal')}
                    className={`px-4 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                      payoutMethod === 'pesapal'
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                        : 'bg-pink-50 text-purple-700 border-2 border-pink-200'
                    }`}
                  >
                                      <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" /></svg>Pesapal
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-black text-purple-400 uppercase tracking-wide mb-3">Coming Soon</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                                          { icon: <svg className="inline-block w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'PayPal' },
                                          { icon: <svg className="inline-block w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>, label: 'Stripe' },
                    ].map((p) => (
                      <div
                        key={p.label}
                        className="px-4 py-4 rounded-2xl font-bold text-sm bg-slate-50 text-slate-400 border-2 border-slate-200 text-center cursor-not-allowed opacity-70"
                      >
                        {p.icon} {p.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {payoutMethod === 'flutterwave' && (
                <div className="p-6 bg-pink-50/50 border-2 border-pink-200 rounded-2xl space-y-6">
                  <div>
                    <p className="text-sm font-black text-purple-900 uppercase tracking-wide mb-1">Flutterwave</p>
                    <p className="text-sm text-purple-600 font-medium">
                      Instant automatic payouts — only available for organizers in supported countries.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                      Country
                    </label>
                    <select
                      value={payoutData.country}
                      onChange={(e) => setPayoutData({ ...payoutData, country: e.target.value, bankCode: '' })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold"
                    >
                      {AUTO_PAYOUT_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {!isAutoPayoutCountry && (
                    <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                      <p className="text-sm text-amber-800 font-semibold">
                        Flutterwave isn't available for this country yet. Try Wise, Crypto, or Bank Wire above instead.
                      </p>
                    </div>
                  )}

                  {isAutoPayoutCountry && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                          Bank / Mobile Money Provider
                        </label>
                        <select
                          value={payoutData.bankCode}
                          onChange={(e) => setPayoutData({ ...payoutData, bankCode: e.target.value })}
                          disabled={loadingBanks}
                          className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold"
                        >
                          <option value="">{loadingBanks ? 'Loading...' : 'Select a bank or mobile money provider'}</option>
                          {bankOptions.map((b) => (
                            <option key={b.code} value={b.code}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                          Account Number
                        </label>
                        <input
                          type="text"
                          placeholder="Account or mobile number"
                          value={payoutData.accountNumber}
                          onChange={(e) => setPayoutData({ ...payoutData, accountNumber: e.target.value })}
                          className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                        />
                      </div>
                    </div>
                  )}

                  {isAutoPayoutCountry && (
                    <div>
                      <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full name on the account"
                        value={payoutData.accountName}
                        onChange={(e) => setPayoutData({ ...payoutData, accountName: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {payoutMethod === 'wise' && (
                <div>
                  <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                    Wise Account Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={wiseEmail}
                    onChange={(e) => setWiseEmail(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                  />
                  <p className="text-sm text-purple-500 font-medium mt-2">
                    Use the email linked to your Wise account. Availability to receive money depends on your country.
                  </p>
                </div>
              )}

              {payoutMethod === 'crypto' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                      Network
                    </label>
                    <select
                      value={cryptoNetwork}
                      onChange={(e) => setCryptoNetwork(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold"
                    >
                      <option value="USDT-TRC20">USDT (TRC20 — Tron)</option>
                      <option value="USDT-BEP20">USDT (BEP20 — BNB Chain)</option>
                      <option value="USDT-ERC20">USDT (ERC20 — Ethereum)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      placeholder="Paste your wallet address"
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                    />
                  </div>
                  <p className="md:col-span-2 text-sm text-amber-700 font-semibold bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
                  <svg className="inline-block w-4 h-4 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>Double-check this address carefully — crypto transfers to a wrong or wrong-network address cannot be reversed or recovered.
                  </p>
                </div>
              )}

{payoutMethod === 'azampay' && (
                <div className="p-6 bg-pink-50/50 border-2 border-pink-200 rounded-2xl space-y-4">
                  <div>
                    <p className="text-sm font-black text-purple-900 uppercase tracking-wide mb-1">AzamPay</p>
                    <p className="text-sm text-purple-600 font-medium">
                      Buyers pay instantly via M-Pesa, Tigo Pesa, Airtel Money, HaloPesa, or bank transfer — best for Tanzania and Rwanda.
                    </p>
                  </div>
                  <p className="text-sm text-purple-500 font-medium">
                    No account details needed here — payments are processed through FemVents' platform account, and your revenue is settled to you separately.
                  </p>
                </div>
              )}

              {payoutMethod === 'pesapal' && (
                <div className="p-6 bg-pink-50/50 border-2 border-pink-200 rounded-2xl space-y-4">
                  <div>
                    <p className="text-sm font-black text-purple-900 uppercase tracking-wide mb-1">Pesapal</p>
                    <p className="text-sm text-purple-600 font-medium">
                      Buyers can pay by Visa, Mastercard, Amex, or mobile money — works for local buyers across East/Southern Africa and international cardholders anywhere.
                    </p>
                  </div>
                  <p className="text-sm text-purple-500 font-medium">
                    No account details needed here — payments are processed through FemVents' platform account, and your revenue is settled to you separately.
                  </p>
                </div>
              )}

              {payoutMethod === 'manual' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bank of America"
                        value={payoutData.bankCode}
                        onChange={(e) => setPayoutData({ ...payoutData, bankCode: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                        Account Number
                      </label>
                      <input
                        type="text"
                        placeholder="Account or mobile number"
                        value={payoutData.accountNumber}
                        onChange={(e) => setPayoutData({ ...payoutData, accountNumber: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-purple-900 mb-3 uppercase tracking-wide">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Full name on the account"
                      value={payoutData.accountName}
                      onChange={(e) => setPayoutData({ ...payoutData, accountName: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 font-semibold placeholder-slate-400"
                    />
                  </div>
                </>
              )}

{payoutStatus && (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl text-sm font-semibold text-blue-800">
                  {payoutStatus}
                </div>
              )}

              <div className="flex justify-end pt-6 border-t-2 border-pink-100">
                <button
                  onClick={handlePayoutSave}
                  disabled={savingPayout}
                  className="group relative bg-gradient-to-r from-rose-600 to-pink-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-rose-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPayout ? 'Saving...' : 'Save Payout Details'}
                </button>
              </div>

              <div className="pt-6 border-t-2 border-pink-100">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm font-black text-purple-700 uppercase tracking-wide hover:text-rose-600 transition-colors"
                >
                  {showHistory ? '▲ Hide' : '▼ Show'} Payout History
                </button>

                {showHistory && (
                  <div className="mt-4 space-y-2">
                    {loadingHistory ? (
                      <p className="text-sm text-purple-500 font-medium">Loading history...</p>
                    ) : historyItems.length === 0 ? (
                      <p className="text-sm text-purple-500 font-medium">No payout activity yet.</p>
                    ) : (
                      historyItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                        >
                                                   <span className="font-bold text-slate-700 inline-flex items-center gap-1.5">
                            {item.action === 'connected' && (<><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Connected</>)}
                            {item.action === 'updated' && (<><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Updated</>)}
                            {item.action === 'removed' && (<><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Removed</>)}
                            {' '}
                            <span className="uppercase">{item.provider}</span>
                            {item.display_label ? ` — ${item.display_label}` : ''}
                          </span>
                          <span className="text-slate-400 font-medium">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
              <div className="pb-6 border-b-2 border-slate-100">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Notification Settings</h2>
                <p className="text-lg text-slate-600 font-medium">Configure how you receive notifications</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h2a2 2 0 002-2 1 1 0 112 0 2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2h-2a2 2 0 00-2 2 1 1 0 11-2 0 2 2 0 00-2-2z" /></svg>
                    </span>
                    Event Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                        { label: 'New Event Registrations', desc: 'Get notified when someone registers for your events', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
                        { label: 'Payment Confirmations', desc: 'Receive alerts when payments are confirmed', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg> },
                        { label: 'Event Reminders', desc: 'Get reminders before your events start', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
                    ].map((item, idx) => (
                      <label
                        key={idx}
                        className="group flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 cursor-pointer"
                        style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1}s backwards` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{item.icon}</div>
                          <div>
                            <span className="text-lg font-black text-slate-900 block">{item.label}</span>
                            <span className="text-sm text-slate-600 font-medium">{item.desc}</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-6 h-6 text-blue-600 border-2 border-slate-300 rounded-lg focus:ring-4 focus:ring-blue-500/20 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center text-white text-lg">
                      ⚙️
                    </span>
                    System Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                                           { label: 'System Updates', desc: 'Important updates about the platform', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>, checked: true },
                                           { label: 'Maintenance Alerts', desc: 'Notifications about scheduled maintenance', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766m-3.704 3.796l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" /></svg>, checked: false }
                    ].map((item, idx) => (
                      <label
                        key={idx}
                        className="group flex items-center justify-between p-6 bg-gradient-to-r from-amber-50 to-orange-50/30 rounded-2xl border-2 border-amber-200 hover:border-amber-300 transition-all duration-300 cursor-pointer"
                        style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1 + 0.3}s backwards` }}
                      >
                        <div className="flex items-center gap-4">
                        <div className="w-6 h-6">{item.icon}</div>
                          <div>
                            <span className="text-lg font-black text-slate-900 block">{item.label}</span>
                            <span className="text-sm text-slate-600 font-medium">{item.desc}</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={item.checked}
                          className="w-6 h-6 text-amber-600 border-2 border-slate-300 rounded-lg focus:ring-4 focus:ring-amber-500/20 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t-2 border-slate-100">
                <button
                  onClick={handlePreferencesUpdate}
                  disabled={saving}
                  className="group relative bg-gradient-to-r from-amber-600 to-orange-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Notification Settings</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}