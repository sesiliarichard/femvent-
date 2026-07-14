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

      alert('Payment recorded successfully!');
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '2rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Record Payment for {userName}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Currency
            </label>
            <select
              value={paymentData.currency}
              onChange={(e) => setPaymentData({ ...paymentData, currency: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="NGN">NGN</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Payment Type
            </label>
            <select
              value={paymentData.type}
              onChange={(e) => setPaymentData({ ...paymentData, type: e.target.value as 'subscription' | 'ticket' })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            >
              <option value="subscription">Host Subscription</option>
              <option value="ticket">Event Ticket</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Payment Method
            </label>
            <select
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value as 'manual' | 'cash' | 'bank_transfer' })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            >
              <option value="manual">Manual Entry</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Description (optional)
            </label>
            <textarea
              value={paymentData.description}
              onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                resize: 'vertical'
              }}
              placeholder="Additional notes about this payment..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
