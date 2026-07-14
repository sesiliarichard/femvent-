/**
 * Event Management Page with All Enterprise Features
 * 
 * Integrates: Discounts, Seating, Merchandising, Email Workflows, A/B Testing
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Settings,
    Tag,
    Armchair,
    Package,
    Mail,
    TestTube,
    BarChart,
    Users
} from 'lucide-react';

// Import all enterprise feature components
import DiscountCodeManager from '@/components/DiscountCodeManager';
import SeatMapBuilder from '@/components/SeatMapBuilder';
import ProductManager from '@/components/ProductManager';
import EmailWorkflowBuilder from '@/components/EmailWorkflowBuilder';
import ABTestCreator from '@/components/ABTestCreator';

export default function ManageEventPage() {
    const router = useRouter();
    const { id } = router.query;
    const eventId = id as string;

    const [activeTab, setActiveTab] = useState('details');
    const [event, setEvent] = useState<any>(null);

    useEffect(() => {
        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    const fetchEvent = async () => {
        // Fetch event details
        const response = await fetch(`/api/events/${eventId}`);
        const data = await response.json();
        setEvent(data.event);
    };

    const tabs = [
        {
            id: 'details',
            label: 'Event Details',
            icon: Settings,
            component: <div className="p-6">Event details form goes here</div>
        },
        {
            id: 'discounts',
            label: 'Discount Codes',
            icon: Tag,
            component: <DiscountCodeManager eventId={eventId} />
        },
        {
            id: 'seating',
            label: 'Reserved Seating',
            icon: Armchair,
            component: <SeatMapBuilder eventId={eventId} />
        },
        {
            id: 'merchandise',
            label: 'Merchandise',
            icon: Package,
            component: <ProductManager eventId={eventId} />
        },
        {
            id: 'emails',
            label: 'Email Automation',
            icon: Mail,
            component: <EmailWorkflowBuilder eventId={eventId} />
        },
        {
            id: 'abtests',
            label: 'A/B Testing',
            icon: TestTube,
            component: <ABTestCreator eventId={eventId} />
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: BarChart,
            component: <div className="p-6">Event analytics dashboard</div>
        },
        {
            id: 'attendees',
            label: 'Attendees',
            icon: Users,
            component: <div className="p-6">Attendee management</div>
        }
    ];

    const currentTab = tabs.find(t => t.id === activeTab);

    if (!eventId) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {event?.title || 'Manage Event'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Configure your event settings and features
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 overflow-x-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors
                    ${activeTab === tab.id
                                            ? 'border-indigo-600 text-indigo-600 font-medium'
                                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                        }
                  `}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {currentTab?.component}
            </div>
        </div>
    );
}
