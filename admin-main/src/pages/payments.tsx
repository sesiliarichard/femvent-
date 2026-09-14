import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { PaymentForm } from '../components/PaymentForm';
import { PaymentList } from '../components/PaymentList';
import { useAuth } from '../hooks/useAuth';
import { getAllPayments, getPaymentStats, subscribeToPaymentStats } from '../services/firestore';
import type { Payment } from '../types';

export default function PaymentsPage() {
  const { user, loading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    completedPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0
  });
  const [showForm, setShowForm] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const [paymentsData, statsData] = await Promise.all([
          getAllPayments(),
          getPaymentStats()
        ]);
        setPayments(paymentsData);
        setPaymentStats(statsData);
      } catch (error) {
        console.error('Error loading payments:', error);
      } finally {
        setLoadingPayments(false);
      }
    };

    if (user) {
      loadPayments();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToPaymentStats((stats) => {
      setPaymentStats(stats);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-500">Please sign in to access this page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const handlePaymentAdded = (payment: Payment) => {
    setPayments(prev => [payment, ...prev]);
    setShowForm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Payment Management</h1>
              <p className="text-sm text-gray-500 mt-1">Monitor and manage all payment transactions</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Record Payment
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Total Payments</p>
                  <p className="text-2xl font-extrabold text-primary-600">{paymentStats.totalPayments}</p>
                </div>
                <div className="p-2.5 bg-primary-50 rounded-full text-primary-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Completed</p>
                  <p className="text-2xl font-extrabold text-emerald-600">{paymentStats.completedPayments}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-full text-emerald-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Pending</p>
                  <p className="text-2xl font-extrabold text-accent-700">{paymentStats.pendingPayments}</p>
                </div>
                <div className="p-2.5 bg-accent-50 rounded-full text-accent-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-extrabold text-secondary-600">{formatCurrency(paymentStats.totalRevenue)}</p>
                </div>
                <div className="p-2.5 bg-secondary-50 rounded-full text-secondary-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-extrabold text-gray-900">Record Manual Payment</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <PaymentForm onPaymentAdded={handlePaymentAdded} onCancel={() => setShowForm(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Payment List */}
        <div className="bg-white rounded-2xl border border-gray-100">
          {loadingPayments ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-7 w-7 border-4 border-gray-200 border-t-primary-600"></div>
              <span className="ml-3 text-gray-500 text-sm">Loading payments...</span>
            </div>
          ) : (
            <PaymentList payments={payments} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}