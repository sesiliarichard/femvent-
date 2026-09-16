/**
 * INTEGRATIONS HUB
 * Central place for managing third-party integrations
 */

import React, { useState } from 'react';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
    category: 'calendar' | 'email' | 'payment' | 'analytics' | 'crm';
    config?: any;
}

const icon = (path: string) => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>
);

const IntegrationsHub: React.FC<{ eventId?: string }> = ({ eventId }) => {
    const [integrations, setIntegrations] = useState<Integration[]>([
        { id: 'google-calendar', name: 'Google Calendar', description: 'Sync events to Google Calendar', icon: icon('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'), enabled: false, category: 'calendar' },
        { id: 'outlook-calendar', name: 'Outlook Calendar', description: 'Sync events to Outlook Calendar', icon: icon('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'), enabled: false, category: 'calendar' },
        { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing automation', icon: icon('M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'), enabled: false, category: 'email' },
        { id: 'stripe', name: 'Stripe', description: 'Payment processing', icon: icon('M1 10h22M1 6h22a1 1 0 011 1v10a1 1 0 01-1 1H1a1 1 0 01-1-1V7a1 1 0 011-1z'), enabled: true, category: 'payment' },
        { id: 'mpesa', name: 'M-Pesa', description: 'Mobile money payments', icon: icon('M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'), enabled: false, category: 'payment' },
        { id: 'google-analytics', name: 'Google Analytics', description: 'Track event page analytics', icon: icon('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'), enabled: false, category: 'analytics' },
        { id: 'salesforce', name: 'Salesforce', description: 'CRM integration', icon: icon('M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'), enabled: false, category: 'crm' },
    ]);

    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = [
        { value: 'all', label: 'All' },
        { value: 'calendar', label: 'Calendar' },
        { value: 'email', label: 'Email' },
        { value: 'payment', label: 'Payment' },
        { value: 'analytics', label: 'Analytics' },
        { value: 'crm', label: 'CRM' },
    ];

    const filteredIntegrations = selectedCategory === 'all'
        ? integrations
        : integrations.filter(i => i.category === selectedCategory);

    const toggleIntegration = (id: string) => {
        setIntegrations(integrations.map(i =>
            i.id === id ? { ...i, enabled: !i.enabled } : i
        ));
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="mb-6">
                <h3 className="text-lg font-extrabold text-gray-900 mb-1">Integrations</h3>
                <p className="text-sm text-gray-500">Connect your favorite tools and services</p>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto">
                {categories.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-colors ${selectedCategory === cat.value
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIntegrations.map(integration => (
                    <div
                        key={integration.id}
                        className={`border rounded-xl p-4 transition-all ${integration.enabled
                                ? 'border-emerald-200 bg-emerald-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                                    {integration.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{integration.name}</h4>
                                    <p className="text-xs text-gray-500">{integration.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${integration.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {integration.enabled ? 'Connected' : 'Not connected'}
                            </span>
                            <button
                                onClick={() => toggleIntegration(integration.id)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${integration.enabled
                                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                    }`}
                            >
                                {integration.enabled ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>

                        {integration.enabled && (
                            <button className="mt-2 w-full text-xs text-primary-600 hover:text-primary-700 font-bold">
                                Configure →
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {filteredIntegrations.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                    No integrations found in this category
                </div>
            )}
        </div>
    );
};

export default IntegrationsHub;