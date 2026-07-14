import React, { useState } from 'react';
import { createPayment } from '../services/firestore';

interface PaymentFormProps {
  onPaymentAdded: (payment: any) => void;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onPaymentAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    type: 'ticket' as 'subscription' | 'ticket',
    description: '',
    eventId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentId = await createPayment({
        userId: formData.userId,
        amount: Math.round(parseFloat(formData.amount) * 100), // convert dollars to cents
        type: formData.type,
        notes: formData.description,
        eventId: formData.eventId || undefined,
        status: 'completed',
      });

      onPaymentAdded({ id: paymentId, ...formData });

      // Reset form
      setFormData({
        userId: '',
        amount: '',
        type: 'ticket',
        description: '',
        eventId: '',
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              User ID
            </span>
          </label>
          <input
            type="text"
            value={formData.userId}
            onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter user ID (e.g., exW1YzsoNmQroLC5GT14UPzE5Df2)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Amount (USD)
            </span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Payment Type
            </span>
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'subscription' | 'ticket' }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="ticket">🎫 Event Ticket</option>
            <option value="subscription">💳 Host Subscription</option>
          </select>
        </div>

        {formData.type === 'ticket' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Event ID (Optional)
              </span>
            </label>
            <input
              type="text"
              value={formData.eventId}
              onChange={(e) => setFormData(prev => ({ ...prev, eventId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter event ID if this is for a specific event"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Description
            </span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            rows={3}
            placeholder="Enter payment description or notes..."
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-secondary-500 to-accent-500 text-white px-6 py-3 rounded-lg hover:from-secondary-600 hover:to-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Recording...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Record Payment
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
