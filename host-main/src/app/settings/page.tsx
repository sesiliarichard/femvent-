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
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'notifications'>('profile');
  
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
    { id: 'profile', label: 'Profile', icon: '👤', color: 'from-secondary-500 to-accent-500' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️', color: 'from-purple-500 to-pink-500' },
    { id: 'security', label: 'Security', icon: '🔒', color: 'from-emerald-500 to-teal-500' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', color: 'from-amber-500 to-orange-500' },
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
            <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
              ⚙️
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
                  <span className={`text-2xl transition-transform duration-300 ${
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
                    <option value="en">🇺🇸 English</option>
                    <option value="es">🇪🇸 Spanish</option>
                    <option value="fr">🇫🇷 French</option>
                    <option value="de">🇩🇪 German</option>
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
                    <option value="USD">💵 USD ($)</option>
                    <option value="EUR">💶 EUR (€)</option>
                    <option value="GBP">💷 GBP (£)</option>
                    <option value="JPY">💴 JPY (¥)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-pink-100">
                <h3 className="text-2xl font-black text-purple-900 mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email', icon: '📧' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get instant push notifications', icon: '🔔' },
                    { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotional and marketing content', icon: '📬' }
                  ].map((item, idx) => (
                    <label
                      key={item.key}
                      className="group flex items-center justify-between p-6 bg-gradient-to-r from-pink-50 to-purple-50/30 rounded-2xl border-2 border-pink-200 hover:border-secondary-300 transition-all duration-300 cursor-pointer"
                      style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1}s backwards` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
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
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                      🔐
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
                    <option value="1">⏱️ 1 hour</option>
                    <option value="6">⏱️ 6 hours</option>
                    <option value="12">⏱️ 12 hours</option>
                    <option value="24">⏱️ 24 hours</option>
                    <option value="168">⏱️ 1 week</option>
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
                    <span className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg">
                      🎫
                    </span>
                    Event Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'New Event Registrations', desc: 'Get notified when someone registers for your events', icon: '👥' },
                      { label: 'Payment Confirmations', desc: 'Receive alerts when payments are confirmed', icon: '💳' },
                      { label: 'Event Reminders', desc: 'Get reminders before your events start', icon: '⏰' }
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
                      { label: 'System Updates', desc: 'Important updates about the platform', icon: '🔄', checked: true },
                      { label: 'Maintenance Alerts', desc: 'Notifications about scheduled maintenance', icon: '🛠️', checked: false }
                    ].map((item, idx) => (
                      <label
                        key={idx}
                        className="group flex items-center justify-between p-6 bg-gradient-to-r from-amber-50 to-orange-50/30 rounded-2xl border-2 border-amber-200 hover:border-amber-300 transition-all duration-300 cursor-pointer"
                        style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1 + 0.3}s backwards` }}
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