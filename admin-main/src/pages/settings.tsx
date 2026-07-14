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
    maintenanceMode: {
        enabled: boolean;
        message: string;
    };
}

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
                    maintenance_enabled: settings.maintenanceMode.enabled,
                    maintenance_message: settings.maintenanceMode.message,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', (await supabase.from('platform_settings').select('id').maybeSingle()).data?.id);

            if (error) throw error;
            alert('✅ Settings saved successfully!');
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading settings...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Settings</h1>
                    <p className="text-gray-600">Configure platform-wide settings and features</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {[
                        { key: 'fees', label: 'Fees & Commission', icon: '💰' },
                        { key: 'features', label: ' Feature Flags', icon: '🎚️' },
                        { key: 'maintenance', label: 'Maintenance Mode', icon: '🔧' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.key
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    {/* Fees Tab */}
                    {activeTab === 'fees' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Platform Fee (%)
                                </label>
                                <input
                                    type="number"
                                    value={settings.fees.platformFee}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        fees: { ...settings.fees, platformFee: parseFloat(e.target.value) || 0 }
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                />
                                <p className="text-sm text-gray-500 mt-1">Percentage charged on each ticket sale</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Processing Fee (%)
                                </label>
                                <input
                                    type="number"
                                    value={settings.fees.paymentProcessingFee}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        fees: { ...settings.fees, paymentProcessingFee: parseFloat(e.target.value) || 0 }
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                />
                                <p className="text-sm text-gray-500 mt-1">Payment gateway processing fee (e.g., Stripe)</p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900">
                                    <strong>Total Fee:</strong> {(settings.fees.platformFee + settings.fees.paymentProcessingFee).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Features Tab */}
                    {activeTab === 'features' && (
                        <div className="space-y-3">
                            {Object.entries(settings.features).map(([feature, enabled]) => (
                                <label
                                    key={feature}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 capitalize">
                                            {feature.replace(/([A-Z])/g, ' $1').trim()}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {feature === 'userRegistration' && 'Allow new users to register'}
                                            {feature === 'eventCreation' && 'Allow hosts to create new events'}
                                            {feature === 'ticketSales' && 'Enable ticket purchasing'}
                                            {feature === 'bulkOperations' && 'Enable bulk email/SMS operations'}
                                            {feature === 'templates' && 'Enable event templates'}
                                            {feature === 'waitlist' && 'Enable waitlist for sold-out events'}
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={enabled}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            features: { ...settings.features, [feature]: e.target.checked }
                                        })}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Maintenance Tab */}
                    {activeTab === 'maintenance' && (
                        <div className="space-y-6">
                            <div className={`p-4 border-2 rounded-lg ${settings.maintenanceMode.enabled ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <p className="font-medium text-gray-900">Enable Maintenance Mode</p>
                                        <p className="text-sm text-gray-600">
                                            {settings.maintenanceMode.enabled
                                                ? '🔴 Platform is in maintenance mode'
                                                : '🟢 Platform is operational'
                                            }
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.maintenanceMode.enabled}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            maintenanceMode: { ...settings.maintenanceMode, enabled: e.target.checked }
                                        })}
                                        className="w-6 h-6 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                                    />
                                </label>
                            </div>

                            {settings.maintenanceMode.enabled && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maintenance Message
                                    </label>
                                    <textarea
                                        value={settings.maintenanceMode.message}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            maintenanceMode: { ...settings.maintenanceMode, message: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={4}
                                        placeholder="Enter the message users will see during maintenance..."
                                    />
                                    <p className="text-sm text-gray-500 mt-1">This message will be displayed to all users</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
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
                                    💾 Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
