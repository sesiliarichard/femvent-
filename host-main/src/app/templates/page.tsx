'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TemplateCard from '../../components/TemplateCard';
import { useAuth } from '../../contexts/AuthContext';

interface EventTemplate {
    id: string;
    hostId: string;
    name: string;
    description?: string;
    category: string;
    title: string;
    capacity: number;
    price: number;
    currency: string;
    usageCount: number;
    createdAt: string;
}

export default function TemplatesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [templates, setTemplates] = useState<EventTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = ['all', 'conference', 'workshop', 'networking', 'social', 'sports', 'arts', 'other'];

    useEffect(() => {
        if (user?.id) {
            fetchTemplates();
        }
    }, [user]);

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`/api/templates?hostId=${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUseTemplate = async (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        // Navigate to create event page with template data in query params
        const params = new URLSearchParams({
            templateId,
            fromTemplate: 'true'
        });
        router.push(`/events/create?${params.toString()}`);
    };

    const handleEditTemplate = async (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        const newName = prompt('Enter new template name:', template.name);
        if (!newName || newName.trim() === template.name) return;

        try {
            const response = await fetch(`/api/templates/${templateId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...template, name: newName.trim() }),
            });

            if (response.ok) {
                fetchTemplates();
            }
        } catch (error) {
            console.error('Error updating template:', error);
            alert('Failed to update template');
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/templates/${templateId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setTemplates(templates.filter(t => t.id !== templateId));
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
        }
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900">Event Templates</h1>
                            <p className="mt-1.5 text-sm text-gray-500">
                                Create events faster with reusable templates
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/events')}
                            className="px-5 py-2.5 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl font-bold text-sm transition-colors"
                        >
                            View Events
                        </button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900 placeholder-gray-400 font-medium transition-colors"
                            />
                        </div>

                        {/* Category Filter */}
                        <div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900 font-medium transition-colors"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Templates Grid */}
                {filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredTemplates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onUse={handleUseTemplate}
                                onEdit={handleEditTemplate}
                                onDelete={handleDeleteTemplate}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                        <svg
                            className="mx-auto h-10 w-10 text-primary-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <h3 className="mt-3 text-sm font-bold text-gray-900">No templates found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchQuery || selectedCategory !== 'all'
                                ? 'Try adjusting your search or filter'
                                : 'Save your first event as a template to get started'}
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => router.push('/events')}
                                className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-secondary-500 hover:bg-secondary-600 transition-colors"
                            >
                                Go to Events
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}