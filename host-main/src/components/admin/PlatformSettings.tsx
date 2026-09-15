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

const TABS = [
    { id: 'fees', label: 'Fees & Commission', icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.8l.9.7c1.2.9 3 .9 4.2 0" /><circle cx="12" cy="12" r="9" /></svg>
    )},
    { id: 'features', label: 'Feature Flags', icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M8 6v4M14 12h6M14 12v4M4 18h10" /></svg>
    )},
    { id: 'maintenance', label: 'Maintenance Mode', icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6" /></svg>
    )},
] as const;

const Toggle: React.FC<{ on: boolean; onClick: () => void; tone?: 'primary' | 'danger' }> = ({ on, onClick, tone = 'primary' }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        className={`w-[42px] h-6 rounded-full relative flex-shrink-0 transition-colors ${
            on ? (tone === 'danger' ? 'bg-red-600' : 'bg-primary-600') : 'bg-gray-300'
        }`}
    >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'right-0.5' : 'left-0.5'}`} />
    </button>
);

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
            alert('Settings saved successfully.');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const totalFee = (settings.fees.platformFee + settings.fees.paymentProcessingFee).toFixed(1);

    return (
        <div className="p-6 max-w-3xl">
            <div className="mb-5">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Platform Settings</h2>
                <p className="text-sm text-gray-500">Configure platform-wide settings and features</p>
            </div>

            <div className="flex gap-1.5 bg-white border border-gray-200 rounded-2xl p-1.5 mb-5">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${
                            activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                {activeTab === 'fees' && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Platform fee (%)</label>
                            <input
                                type="number"
                                value={settings.fees.platformFee}
                                onChange={(e) => setSettings({ ...settings, fees: { ...settings.fees, platformFee: parseFloat(e.target.value) } })}
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                step="0.1" min="0" max="100"
                            />
                            <p className="text-xs text-gray-500 mt-1.5">Percentage charged on each ticket sale</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Payment processing fee (%)</label>
                            <input
                                type="number"
                                value={settings.fees.paymentProcessingFee}
                                onChange={(e) => setSettings({ ...settings, fees: { ...settings.fees, paymentProcessingFee: parseFloat(e.target.value) } })}
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                step="0.1" min="0" max="10"
                            />
                            <p className="text-xs text-gray-500 mt-1.5">Payment gateway processing fee (e.g., Stripe)</p>
                        </div>

                        <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3.5 text-sm font-bold text-primary-700">
                            Total fee: {totalFee}%
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="space-y-2.5">
                        {Object.entries(settings.features).map(([feature, enabled]) => (
                            <div key={feature} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm capitalize">{feature.replace(/([A-Z])/g, ' $1')}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Enable or disable this feature</p>
                                </div>
                                <Toggle
                                    on={enabled}
                                    onClick={() => setSettings({ ...settings, features: { ...settings.features, [feature]: !enabled } })}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div className="space-y-5">
                        <div className={`p-4 rounded-2xl border-2 ${settings.maintenanceMode.enabled ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Enable maintenance mode</p>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs font-bold">
                                        <span className={`w-1.5 h-1.5 rounded-full ${settings.maintenanceMode.enabled ? 'bg-red-600' : 'bg-green-600'}`} />
                                        <span className={settings.maintenanceMode.enabled ? 'text-red-700' : 'text-gray-500'}>
                                            {settings.maintenanceMode.enabled ? 'Platform is in maintenance mode' : 'Platform is live'}
                                        </span>
                                    </div>
                                </div>
                                <Toggle
                                    tone="danger"
                                    on={settings.maintenanceMode.enabled}
                                    onClick={() => setSettings({ ...settings, maintenanceMode: { ...settings.maintenanceMode, enabled: !settings.maintenanceMode.enabled } })}
                                />
                            </div>
                        </div>

                        {settings.maintenanceMode.enabled && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Maintenance message</label>
                                <textarea
                                    value={settings.maintenanceMode.message}
                                    onChange={(e) => setSettings({ ...settings, maintenanceMode: { ...settings.maintenanceMode, message: e.target.value } })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                    rows={3}
                                    placeholder="We're currently performing maintenance. Please check back soon."
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8M7 3v5h8" /></svg>
                        {saving ? 'Saving...' : 'Save settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlatformSettingsPage;