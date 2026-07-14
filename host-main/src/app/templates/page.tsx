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
        if (user?.uid) {
            fetchTemplates();
        }
    }, [user]);

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`/api/templates?hostId=${user?.uid}`);
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto"></div>
                    <p className="mt-4 text-purple-600">Loading templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-purple-900">Event Templates</h1>
                            <p className="mt-2 text-sm text-purple-600">
                                Create events faster with reusable templates
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/events')}
                            className="px-4 py-2 bg-gradient-to-r from-secondary-500 to-accent-500 text-white rounded-md hover:shadow-lg hover:shadow-secondary-500/30 transition-all duration-200"
                        >
                            View Events
                        </button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="mb-6 bg-white/80 backdrop-blur-xl rounded-lg shadow-lg p-4 border border-pink-200/50">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 text-purple-900 placeholder-purple-400 font-medium"
                            />
                        </div>

                        {/* Category Filter */}
                        <div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2 border-2 border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 text-purple-900 font-medium"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-lg shadow-lg border border-pink-200/50">
                        <svg
                            className="mx-auto h-12 w-12 text-purple-400"
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
                        <h3 className="mt-2 text-sm font-medium text-purple-900">No templates found</h3>
                        <p className="mt-1 text-sm text-purple-500">
                            {searchQuery || selectedCategory !== 'all'
                                ? 'Try adjusting your search or filter'
                                : 'Save your first event as a template to get started'}
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => router.push('/events')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-secondary-500 to-accent-500 hover:shadow-lg hover:shadow-secondary-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
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
