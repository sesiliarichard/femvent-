import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PlatformSettings {
    fees: {
        platformFee: number;
        paymentProcessingFee: number;
        categoryFees: { [category: string]: number };
    };
    features: { [featureName: string]: boolean };
    maintenanceMode: {
        enabled: boolean;
        message: string;
    };
}

const PlatformSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<PlatformSettings>({
        fees: { platformFee: 5, paymentProcessingFee: 2.9, categoryFees: {} },
        features: {
            userRegistration: true,
            eventCreation: true,
            ticketSales: true,
            bulkOperations: true,
            templates: true,
        },
        maintenanceMode: { enabled: false, message: '' },
    });
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'fees' | 'features' | 'maintenance'>('fees');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*')
                .eq('id', 'config')
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setSettings({
                    fees: data.fees,
                    features: data.features,
                    maintenanceMode: data.maintenance_mode,
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.from('platform_settings').upsert({
                id: 'config',
                fees: settings.fees,
                features: settings.features,
                maintenance_mode: settings.maintenanceMode,
                last_updated: new Date().toISOString(),
            });

            if (error) throw error;
            alert('✅ Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Platform Settings</h2>
                <p className="text-gray-600">Configure platform-wide settings</p>
            </div>

            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button onClick={() => setActiveTab('fees')} className={`px-4 py-2 font-medium ${activeTab === 'fees' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>Fees & Commission</button>
                <button onClick={() => setActiveTab('features')} className={`px-4 py-2 font-medium ${activeTab === 'features' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>Feature Flags</button>
                <button onClick={() => setActiveTab('maintenance')} className={`px-4 py-2 font-medium ${activeTab === 'maintenance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>Maintenance Mode</button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                {activeTab === 'fees' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Platform Fee (%)</label>
                            <input
                                type="number"
                                value={settings.fees.platformFee}
                                onChange={(e) => setSettings({ ...settings, fees: { ...settings.fees, platformFee: parseFloat(e.target.value) } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                step="0.1" min="0" max="100"
                            />
                            <p className="text-xs text-gray-500 mt-1">Fee charged on each ticket sale</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Processing Fee (%)</label>
                            <input
                                type="number"
                                value={settings.fees.paymentProcessingFee}
                                onChange={(e) => setSettings({ ...settings, fees: { ...settings.fees, paymentProcessingFee: parseFloat(e.target.value) } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                step="0.1" min="0" max="10"
                            />
                            <p className="text-xs text-gray-500 mt-1">Stripe/payment gateway fee</p>
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="space-y-4">
                        {Object.entries(settings.features).map(([feature, enabled]) => (
                            <label key={feature} className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900 capitalize">{feature.replace(/([A-Z])/g, ' $1')}</p>
                                    <p className="text-sm text-gray-500">Enable or disable this feature</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={(e) => setSettings({ ...settings, features: { ...settings.features, [feature]: e.target.checked } })}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                            </label>
                        ))}
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div className="space-y-6">
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                            <div>
                                <p className="font-medium text-gray-900">Enable Maintenance Mode</p>
                                <p className="text-sm text-gray-500">Block access to the platform for users</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.maintenanceMode.enabled}
                                onChange={(e) => setSettings({ ...settings, maintenanceMode: { ...settings.maintenanceMode, enabled: e.target.checked } })}
                                className="w-5 h-5 text-red-600 rounded"
                            />
                        </label>

                        {settings.maintenanceMode.enabled && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Message</label>
                                <textarea
                                    value={settings.maintenanceMode.message}
                                    onChange={(e) => setSettings({ ...settings, maintenanceMode: { ...settings.maintenanceMode, message: e.target.value } })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    rows={3}
                                    placeholder="We're currently performing maintenance. Please check back soon."
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlatformSettingsPage;