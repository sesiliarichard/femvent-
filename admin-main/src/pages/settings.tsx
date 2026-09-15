/**
 * PLATFORM SETTINGS - Admin Settings Page
 * Configure platform fees, features, and maintenance
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface PlatformSettings {
    fees: {
        platformFee: number;
        paymentProcessingFee: number;
    };
    features: {
        [key: string]: boolean;
    };
    paymentMethods: {
        pesapal: boolean;
        crypto: boolean;
        azampay: boolean;
    };
    maintenanceMode: {
        enabled: boolean;
        message: string;
    };
}

const ToggleSwitch = ({ checked, onChange, activeColor = 'bg-primary-600' }: { checked: boolean; onChange: (v: boolean) => void; activeColor?: string }) => (
    <div className="relative w-12 h-7 flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div onClick={() => onChange(!checked)} className={`w-12 h-7 rounded-full cursor-pointer transition-colors ${checked ? activeColor : 'bg-gray-300'}`}>
            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
    </div>
);

export default function SettingsPage() {
    const [settings, setSettings] = useState<PlatformSettings>({
        fees: {
            platformFee: 5,
            paymentProcessingFee: 2.9,
        },
        features: {
            userRegistration: true,
            eventCreation: true,
            ticketSales: true,
            bulkOperations: true,
            templates: true,
            waitlist: true,
        },
        paymentMethods: {
            pesapal: true,
            crypto: true,
            azampay: true,
        },
        maintenanceMode: {
            enabled: false,
            message: 'We are currently performing maintenance. Please check back soon.',
        },
    });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'fees' | 'features' | 'maintenance'>('fees');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*')
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setSettings({
                    fees: {
                        platformFee: data.platform_fee,
                        paymentProcessingFee: data.payment_processing_fee,
                    },
                    features: data.features,
                    paymentMethods: data.payment_methods || {
                        pesapal: true,
                        crypto: true,
                        azampay: true,
                    },
                    maintenanceMode: {
                        enabled: data.maintenance_enabled,
                        message: data.maintenance_message,
                    },
                });
            } else {
                // No settings row exists yet — create one with the defaults
                const { data: created, error: insertError } = await supabase
                .from('platform_settings')
                .insert({
                    platform_fee: settings.fees.platformFee,
                    payment_processing_fee: settings.fees.paymentProcessingFee,
                    features: settings.features,
                    payment_methods: settings.paymentMethods,
                    maintenance_enabled: settings.maintenanceMode.enabled,
                    maintenance_message: settings.maintenanceMode.message,
                })
                .select()
                .single();

                if (insertError) throw insertError;
                if (created) {
                    setSettings({
                        fees: {
                            platformFee: created.platform_fee,
                            paymentProcessingFee: created.payment_processing_fee,
                        },
                        features: created.features,
                        paymentMethods: created.payment_methods || {
                            pesapal: true,
                            crypto: true,
                            azampay: true,
                        },
                        maintenanceMode: {
                            enabled: created.maintenance_enabled,
                            message: created.maintenance_message,
                        },
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('platform_settings')
                .update({
                    platform_fee: settings.fees.platformFee,
                    payment_processing_fee: settings.fees.paymentProcessingFee,
                    features: settings.features,
                    payment_methods: settings.paymentMethods,
                    maintenance_enabled: settings.maintenanceMode.enabled,
                    maintenance_message: settings.maintenanceMode.message,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', (await supabase.from('platform_settings').select('id').maybeSingle()).data?.id);

            if (error) throw error;
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500 text-sm">Loading settings...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const tabs = [
        { key: 'fees', label: 'Fees & Commission', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0" /><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg> },
        { key: 'features', label: 'Feature Flags', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 6v4M14 12h6M14 12v4M4 18h10" /></svg> },
        { key: 'maintenance', label: 'Maintenance Mode', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766m-3.704 3.796l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" /></svg> },
    ];

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-gray-900">Platform Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure platform-wide settings and features</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white border border-gray-100 rounded-2xl p-2 w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${activeTab === tab.key
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    {/* Fees Tab */}
                    {activeTab === 'fees' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Platform Fee (%)
                                </label>
                                <input
                                    type="number"
                                    value={settings.fees.platformFee}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        fees: { ...settings.fees, platformFee: parseFloat(e.target.value) || 0 }
                                    })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                />
                                <p className="text-xs text-gray-500 mt-1.5">Percentage charged on each ticket sale</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Payment Processing Fee (%)
                                </label>
                                <input
                                    type="number"
                                    value={settings.fees.paymentProcessingFee}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        fees: { ...settings.fees, paymentProcessingFee: parseFloat(e.target.value) || 0 }
                                    })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                />
                                <p className="text-xs text-gray-500 mt-1.5">Payment gateway processing fee (e.g., Stripe)</p>
                            </div>

                            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                                <p className="text-sm text-primary-800 font-semibold">
                                    Total Fee: {(settings.fees.platformFee + settings.fees.paymentProcessingFee).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Features Tab */}
                    {activeTab === 'features' && (
                        <div className="space-y-3">
                            {Object.entries(settings.features).map(([feature, enabled]) => (
                                <div
                                    key={feature}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                                >
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm capitalize">
                                            {feature.replace(/([A-Z])/g, ' $1').trim()}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {feature === 'userRegistration' && 'Allow new users to register'}
                                            {feature === 'eventCreation' && 'Allow hosts to create new events'}
                                            {feature === 'ticketSales' && 'Enable ticket purchasing'}
                                            {feature === 'bulkOperations' && 'Enable bulk email/SMS operations'}
                                            {feature === 'templates' && 'Enable event templates'}
                                            {feature === 'waitlist' && 'Enable waitlist for sold-out events'}
                                        </p>
                                    </div>
                                    <ToggleSwitch
                                        checked={enabled}
                                        onChange={(v) => setSettings({
                                            ...settings,
                                            features: { ...settings.features, [feature]: v }
                                        })}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Maintenance Tab */}
                    {activeTab === 'maintenance' && (
                        <div className="space-y-6">
                            <div className={`p-5 border-2 rounded-xl ${settings.maintenanceMode.enabled ? 'border-red-200 bg-red-50' : 'border-gray-200'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Enable Maintenance Mode</p>
                                        <p className={`text-xs mt-1 font-semibold flex items-center gap-1.5 ${settings.maintenanceMode.enabled ? 'text-red-600' : 'text-emerald-600'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${settings.maintenanceMode.enabled ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                            {settings.maintenanceMode.enabled
                                                ? 'Platform is in maintenance mode'
                                                : 'Platform is operational'
                                            }
                                        </p>
                                    </div>
                                    <ToggleSwitch
                                        checked={settings.maintenanceMode.enabled}
                                        onChange={(v) => setSettings({
                                            ...settings,
                                            maintenanceMode: { ...settings.maintenanceMode, enabled: v }
                                        })}
                                        activeColor="bg-red-600"
                                    />
                                </div>
                            </div>

                            {settings.maintenanceMode.enabled && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">
                                        Maintenance Message
                                    </label>
                                    <textarea
                                        value={settings.maintenanceMode.message}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            maintenanceMode: { ...settings.maintenanceMode, message: e.target.value }
                                        })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                        rows={4}
                                        placeholder="Enter the message users will see during maintenance..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">This message will be displayed to all users</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl disabled:opacity-50 font-bold text-sm transition-colors flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-8H7v8M7 3v5h8" /></svg>
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}