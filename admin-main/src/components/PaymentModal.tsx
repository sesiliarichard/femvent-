import React, { useState } from 'react';
import { recordPayment } from '../services/firestore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onPaymentRecorded: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  onPaymentRecorded
}) => {
  const [paymentData, setPaymentData] = useState({
    amount: '',
    currency: 'USD',
    type: 'subscription' as 'subscription' | 'ticket',
    method: 'manual' as 'manual' | 'cash' | 'bank_transfer',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await recordPayment({
        userId,
        amount: parseFloat(paymentData.amount),
        currency: paymentData.currency,
        type: paymentData.type,
        status: 'succeeded',
        method: paymentData.method,
        description: paymentData.description || `Payment for ${userName}`,
        meta: {
          recordedBy: 'admin', // In real app, get from auth context
          recordedAt: new Date(),
        },
        createdAt: new Date(),
      });

      onPaymentRecorded();
      onClose();
      setPaymentData({
        amount: '',
        currency: 'USD',
        type: 'subscription',
        method: 'manual',
        description: '',
      });
    } catch (error: unknown) {
      console.error('Error recording payment:', error);
      const message = error instanceof Error ? error.message : String(error);
      alert(`Failed to record payment: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-lg font-extrabold text-gray-900 mb-6">Record payment for {userName}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Currency</label>
            <select
              value={paymentData.currency}
              onChange={(e) => setPaymentData({ ...paymentData, currency: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="NGN">NGN</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Payment type</label>
            <select
              value={paymentData.type}
              onChange={(e) => setPaymentData({ ...paymentData, type: e.target.value as 'subscription' | 'ticket' })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="subscription">Host subscription</option>
              <option value="ticket">Event ticket</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Payment method</label>
            <select
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value as 'manual' | 'cash' | 'bank_transfer' })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="manual">Manual entry</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Description (optional)</label>
            <textarea
              value={paymentData.description}
              onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-y"
              placeholder="Additional notes about this payment..."
            />
          </div>

          <div className="flex gap-2.5 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-secondary-500 hover:bg-secondary-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {loading ? 'Recording...' : 'Record payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};