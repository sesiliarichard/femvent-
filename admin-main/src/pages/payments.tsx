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

    // Temporarily allow all authenticated users (remove role check for now)
    if (user) {
      loadPayments();
    }
  }, [user]);

  useEffect(() => {
    // Temporarily allow all authenticated users (remove role check for now)
    if (!user) return;

    // Subscribe to real-time payment updates
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Temporarily allow all authenticated users (remove role check for now)
  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in to access this page.</p>
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
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Management</h1>
              <p className="text-gray-600">Monitor and manage all payment transactions</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Record Payment
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-3xl font-bold text-gray-900">{paymentStats.totalPayments}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{paymentStats.completedPayments}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{paymentStats.pendingPayments}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-purple-600">{formatCurrency(paymentStats.totalRevenue)}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Record Manual Payment</h2>
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          {loadingPayments ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading payments...</span>
            </div>
          ) : (
            <PaymentList payments={payments} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
