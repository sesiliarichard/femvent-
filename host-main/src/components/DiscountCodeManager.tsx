/**
 * DiscountCodeManager Component
 * Admin UI for creating and managing discount codes
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Copy } from 'lucide-react';

interface DiscountCode {
    id: string;
    code: string;
    type: 'percentage' | 'fixed' | 'free';
    value: number;
    maxUses: number | null;
    currentUses: number;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'disabled';
}

interface DiscountCodeManagerProps {
    eventId: string;
}

export default function DiscountCodeManager({ eventId }: DiscountCodeManagerProps) {
    const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage' as 'percentage' | 'fixed' | 'free',
        value: 0,
        maxUses: null as number | null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        minimumPurchase: 0,
        description: '',
    });

    const handleCreate = async () => {
        try {
            const response = await fetch('/api/discount-codes/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    ...formData,
                    createdBy: 'current-user-id', // Replace with actual user ID
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert(`Discount code ${data.code} created successfully!`);
                setShowCreateModal(false);
                // Reset form
                setFormData({
                    code: '',
                    type: 'percentage',
                    value: 0,
                    maxUses: null,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: '',
                    minimumPurchase: 0,
                    description: '',
                });
                // Refresh list
                fetchDiscountCodes();
            } else {
                alert(data.error || 'Failed to create discount code');
            }
        } catch (error) {
            console.error('Error creating discount code:', error);
            alert('Failed to create discount code');
        }
    };

    const fetchDiscountCodes = async () => {
        // TODO: Implement fetch logic
    };

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, code });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Discount Codes</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                    <Plus size={20} />
                    Create Code
                </button>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Create Discount Code</h3>

                        <div className="space-y-4">
                            {/* Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount Code
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="EARLY2024"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={generateRandomCode}
                                        className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="percentage">Percentage Off</option>
                                    <option value="fixed">Fixed Amount Off</option>
                                    <option value="free">Free Ticket</option>
                                </select>
                            </div>

                            {/* Value */}
                            {formData.type !== 'free' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {formData.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            )}

                            {/* Max Uses */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Maximum Uses (leave empty for unlimited)
                                </label>
                                <input
                                    type="number"
                                    value={formData.maxUses || ''}
                                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? Number(e.target.value) : null })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Minimum Purchase */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Minimum Purchase Amount ($)
                                </label>
                                <input
                                    type="number"
                                    value={formData.minimumPurchase}
                                    onChange={(e) => setFormData({ ...formData, minimumPurchase: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Create Code
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Codes List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Discount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Uses
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valid Until
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {discountCodes.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No discount codes yet. Create one to get started!
                                </td>
                            </tr>
                        ) : (
                            discountCodes.map((code) => (
                                <tr key={code.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold">{code.code}</span>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {code.type === 'percentage' ? `${code.value}%` : code.type === 'fixed' ? `$${code.value}` : 'Free'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {code.currentUses} / {code.maxUses || '∞'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {code.endDate.toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${code.status === 'active' ? 'bg-green-100 text-green-800' :
                                                code.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {code.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button className="text-indigo-600 hover:text-indigo-900 mx-2">
                                            <Edit size={18} />
                                        </button>
                                        <button className="text-red-600 hover:text-red-900">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
