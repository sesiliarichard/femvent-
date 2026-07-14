/**
 * INTEGRATIONS HUB
 * Central place for managing third-party integrations
 */

import React, { useState } from 'react';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: string;
    enabled: boolean;
    category: 'calendar' | 'email' | 'payment' | 'analytics' | 'crm';
    config?: any;
}

const IntegrationsHub: React.FC<{ eventId?: string }> = ({ eventId }) => {
    const [integrations, setIntegrations] = useState<Integration[]>([
        {
            id: 'google-calendar',
            name: 'Google Calendar',
            description: 'Sync events to Google Calendar',
            icon: '📅',
            enabled: false,
            category: 'calendar',
        },
        {
            id: 'outlook-calendar',
            name: 'Outlook Calendar',
            description: 'Sync events to Outlook Calendar',
            icon: '📆',
            enabled: false,
            category: 'calendar',
        },
        {
            id: 'mailchimp',
            name: 'Mailchimp',
            description: 'Email marketing automation',
            icon: '📧',
            enabled: false,
            category: 'email',
        },
        {
            id: 'stripe',
            name: 'Stripe',
            description: 'Payment processing',
            icon: '💳',
            enabled: true, // Already integrated
            category: 'payment',
        },
        {
            id: 'mpesa',
            name: 'M-Pesa',
            description: 'Mobile money payments',
            icon: '📱',
            enabled: false,
            category: 'payment',
        },
        {
            id: 'google-analytics',
            name: 'Google Analytics',
            description: 'Track event page analytics',
            icon: '📊',
            enabled: false,
            category: 'analytics',
        },
        {
            id: 'salesforce',
            name: 'Salesforce',
            description: 'CRM integration',
            icon: '☁️',
            enabled: false,
            category: 'crm',
        },
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">🔌 Integrations</h3>
                <p className="text-gray-600">Connect your favorite tools and services</p>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {categories.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${selectedCategory === cat.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIntegrations.map(integration => (
                    <div
                        key={integration.id}
                        className={`border rounded-lg p-4 transition-all ${integration.enabled
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{integration.icon}</span>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                                    <p className="text-xs text-gray-600">{integration.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${integration.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                                {integration.enabled ? 'Connected' : 'Not connected'}
                            </span>
                            <button
                                onClick={() => toggleIntegration(integration.id)}
                                className={`px-3 py-1 text-sm rounded ${integration.enabled
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {integration.enabled ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>

                        {integration.enabled && (
                            <button className="mt-2 w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Configure →
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {filteredIntegrations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No integrations found in this category
                </div>
            )}
        </div>
    );
};

export default IntegrationsHub;
