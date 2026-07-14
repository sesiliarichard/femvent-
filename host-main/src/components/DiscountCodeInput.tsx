/**
 * DiscountCodeInput Component
 * Checkout component for applying discount codes
 */

import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';

interface DiscountCodeInputProps {
    eventId: string;
    totalPrice?: number;
    subtotal?: number;
    ticketType?: string;
    onDiscountApplied: (discount: {
        code: string;
        discountAmount: number;
        finalPrice: number;
    }) => void;
    onDiscountRemoved?: () => void;
}

export default function DiscountCodeInput({
    eventId,
    totalPrice,
    subtotal,
    ticketType,
    onDiscountApplied,
    onDiscountRemoved,
}: DiscountCodeInputProps) {
    const effectiveTotalPrice = totalPrice || subtotal || 0;

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
    const [error, setError] = useState('');

    const handleApply = async () => {
        if (!code.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/discount-codes/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code.trim(),
                    eventId,
                    totalPrice: effectiveTotalPrice,
                    ticketType,
                }),
            });

            const data = await response.json();

            if (data.valid && data.discount) {
                setAppliedDiscount(data.discount);
                onDiscountApplied(data.discount);
                setCode('');
            } else {
                setError(data.error || 'Invalid discount code');
            }
        } catch (error) {
            setError('Failed to apply discount code');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        setAppliedDiscount(null);
        if (onDiscountRemoved) {
            onDiscountRemoved();
        }
        setError('');
    };

    return (
        <div className="space-y-3">
            {!appliedDiscount ? (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Code
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Tag className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    setError('');
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                                placeholder="Enter code"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button
                            onClick={handleApply}
                            disabled={loading || !code.trim()}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Checking...' : 'Apply'}
                        </button>
                    </div>
                    {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                </div>
            ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div>
                                <p className="font-medium text-green-900">
                                    Discount Applied: {appliedDiscount.code}
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                    {appliedDiscount.type === 'percentage'
                                        ? `${appliedDiscount.value}% off`
                                        : appliedDiscount.type === 'fixed'
                                            ? `$${appliedDiscount.value} off`
                                            : 'Free ticket'}
                                    {' - '}
                                    You save ${appliedDiscount.discountAmount.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemove}
                            className="text-green-700 hover:text-green-900"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
