/**
 * ABTestCreator Component
 * 
 * Feature 8 Completion: Create and manage A/B tests
 * Test different page variants to optimize conversions
 */

import React, { useState } from 'react';
import { Plus, TrendingUp, Users, Save } from 'lucide-react';

interface Variant {
    id: string;
    name: string;
    isControl: boolean;
    trafficPercentage: number;
    changes: {
        headline?: string;
        subheadline?: string;
        ctaText?: string;
        ctaColor?: string;
        heroImage?: string;
    };
}

export default function ABTestCreator({ eventId }: { eventId: string }) {
    const [testName, setTestName] = useState('');
    const [hypothesis, setHypothesis] = useState('');
    const [testType, setTestType] = useState<'headline' | 'cta' | 'image'>('headline');
    const [goalMetric, setGoalMetric] = useState<'registration' | 'ticket_purchase'>('ticket_purchase');
    const [variants, setVariants] = useState<Variant[]>([
        {
            id: 'control',
            name: 'Control (Original)',
            isControl: true,
            trafficPercentage: 50,
            changes: {}
        },
        {
            id: 'variant-a',
            name: 'Variant A',
            isControl: false,
            trafficPercentage: 50,
            changes: {}
        }
    ]);

    const addVariant = () => {
        const newVariant: Variant = {
            id: `variant-${Date.now()}`,
            name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`,
            isControl: false,
            trafficPercentage: 0,
            changes: {}
        };

        // Redistribute traffic
        const newTraffic = Math.floor(100 / (variants.length + 1));
        const updatedVariants = variants.map(v => ({
            ...v,
            trafficPercentage: newTraffic
        }));

        setVariants([...updatedVariants, { ...newVariant, trafficPercentage: newTraffic }]);
    };

    const updateVariant = (id: string, updates: Partial<Variant>) => {
        setVariants(variants.map(v => v.id === id ? { ...v, ...updates } : v));
    };

    const createTest = async () => {
        const testData = {
            eventId,
            name: testName,
            hypothesis,
            testType,
            variants: variants.map((v, index) => ({
                ...v,
                visitors: 0,
                conversions: 0,
                conversionRate: 0
            })),
            trafficAllocation: variants.reduce((acc, v) => ({
                ...acc,
                [v.id]: v.trafficPercentage
            }), {}),
            goalMetric,
            confidenceLevel: 95,
            minimumSampleSize: 100,
            status: 'draft' as const
        };

        const response = await fetch('/api/ab-tests/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        const data = await response.json();
        if (data.success) {
            alert('A/B test created! Starting test...');
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Create A/B Test</h2>

            <div className="space-y-6">
                {/* Test Details */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Test Details</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Test Name
                            </label>
                            <input
                                type="text"
                                value={testName}
                                onChange={(e) => setTestName(e.target.value)}
                                placeholder="Homepage CTA Test"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hypothesis
                            </label>
                            <textarea
                                value={hypothesis}
                                onChange={(e) => setHypothesis(e.target.value)}
                                placeholder="Changing the CTA button from 'Register' to 'Get Tickets Now' will increase conversion by 15%"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Test Type
                                </label>
                                <select
                                    value={testType}
                                    onChange={(e) => setTestType(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="headline">Headline</option>
                                    <option value="cta">Call to Action</option>
                                    <option value="image">Hero Image</option>
                                    <option value="layout">Page Layout</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Success Metric
                                </label>
                                <select
                                    value={goalMetric}
                                    onChange={(e) => setGoalMetric(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="ticket_purchase">Ticket Purchase</option>
                                    <option value="registration">Registration Started</option>
                                    <option value="click_through">CTA Click</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variants */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Variants</h3>
                        <button
                            onClick={addVariant}
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                            <Plus size={16} />
                            Add Variant
                        </button>
                    </div>

                    <div className="space-y-4">
                        {variants.map((variant, index) => (
                            <div key={variant.id} className="border-2 border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={variant.name}
                                            onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                                            className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-600 outline-none"
                                        />
                                        {variant.isControl && (
                                            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                CONTROL
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-gray-400" />
                                        <input
                                            type="number"
                                            value={variant.trafficPercentage}
                                            onChange={(e) => updateVariant(variant.id, {
                                                trafficPercentage: Number(e.target.value)
                                            })}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                            min="0"
                                            max="100"
                                        />
                                        <span className="text-sm text-gray-600">%</span>
                                    </div>
                                </div>

                                {/* Variant Changes */}
                                <div className="space-y-3">
                                    {testType === 'headline' && (
                                        <>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Headline</label>
                                                <input
                                                    type="text"
                                                    value={variant.changes.headline || ''}
                                                    onChange={(e) => updateVariant(variant.id, {
                                                        changes: { ...variant.changes, headline: e.target.value }
                                                    })}
                                                    placeholder={variant.isControl ? 'Current headline' : 'New headline'}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Subheadline</label>
                                                <input
                                                    type="text"
                                                    value={variant.changes.subheadline || ''}
                                                    onChange={(e) => updateVariant(variant.id, {
                                                        changes: { ...variant.changes, subheadline: e.target.value }
                                                    })}
                                                    placeholder={variant.isControl ? 'Current subheadline' : 'New subheadline'}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {testType === 'cta' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">CTA Text</label>
                                                <input
                                                    type="text"
                                                    value={variant.changes.ctaText || ''}
                                                    onChange={(e) => updateVariant(variant.id, {
                                                        changes: { ...variant.changes, ctaText: e.target.value }
                                                    })}
                                                    placeholder={variant.isControl ? 'Register Now' : 'Get Tickets'}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">CTA Color</label>
                                                <input
                                                    type="color"
                                                    value={variant.changes.ctaColor || '#4F46E5'}
                                                    onChange={(e) => updateVariant(variant.id, {
                                                        changes: { ...variant.changes, ctaColor: e.target.value }
                                                    })}
                                                    className="w-full h-10 rounded"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {testType === 'image' && (
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Hero Image URL</label>
                                            <input
                                                type="text"
                                                value={variant.changes.heroImage || ''}
                                                onChange={(e) => updateVariant(variant.id, {
                                                    changes: { ...variant.changes, heroImage: e.target.value }
                                                })}
                                                placeholder="https://..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Traffic Warning */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                            Total traffic: {variants.reduce((sum, v) => sum + v.trafficPercentage, 0)}%
                            {variants.reduce((sum, v) => sum + v.trafficPercentage, 0) !== 100 && (
                                <span className="font-semibold"> (Must equal 100%)</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Create Button */}
                <div className="flex justify-end gap-3">
                    <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Save as Draft
                    </button>
                    <button
                        onClick={createTest}
                        disabled={variants.reduce((sum, v) => sum + v.trafficPercentage, 0) !== 100}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        <TrendingUp size={20} />
                        Start Test
                    </button>
                </div>
            </div>
        </div>
    );
}
