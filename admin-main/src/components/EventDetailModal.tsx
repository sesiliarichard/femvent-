import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Event } from '@/types';

interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
}

interface TicketSummary {
  totalSold: number;
  totalRevenue: number;
  confirmedCount: number;
  pendingCount: number;
  refundedCount: number;
  refundedAmount: number;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TicketSummary>({
    totalSold: 0,
    totalRevenue: 0,
    confirmedCount: 0,
    pendingCount: 0,
    refundedCount: 0,
    refundedAmount: 0,
  });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  useEffect(() => {
    loadEventDetails();
  }, [event.id]);

  const loadEventDetails = async () => {
    setLoading(true);
    try {
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('event_id', event.id);

      if (paymentsError) throw paymentsError;

      const confirmed = (tickets || []).filter((t) => t.status === 'confirmed');
      const pending = (tickets || []).filter((t) => t.status === 'pending');
      const refunded = (payments || []).filter((p) => p.status === 'refunded');

      setSummary({
        totalSold: (tickets || []).length,
        totalRevenue: confirmed.reduce((sum, t) => sum + (t.payment_amount || 0), 0),
        confirmedCount: confirmed.length,
        pendingCount: pending.length,
        refundedCount: refunded.length,
        refundedAmount: refunded.reduce((sum, p) => sum + (p.amount || 0), 0),
      });

      setRecentTickets((tickets || []).slice(0, 10));
    } catch (err) {
      console.error('Error loading event details:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Hosted by {event.host?.name || 'Unknown host'} · {event.location}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-semibold uppercase">Tickets Sold</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{summary.totalSold}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 font-semibold uppercase">Revenue</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">${summary.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-xs text-yellow-600 font-semibold uppercase">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">{summary.pendingCount}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 font-semibold uppercase">Refunded</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{summary.refundedCount}</p>
                  {summary.refundedAmount > 0 && (
                    <p className="text-xs text-red-500 mt-0.5">${summary.refundedAmount.toFixed(2)} returned</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Host</h3>
                <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                    {event.host?.name?.[0]?.toUpperCase() || 'H'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{event.host?.name || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Ticket Activity</h3>
                {recentTickets.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No tickets yet</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Buyer</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Type</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Amount</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTickets.map((t) => (
                          <tr key={t.id} className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-700">{t.guest_email || t.user_id || '—'}</td>
                            <td className="px-4 py-2 text-gray-700">{t.ticket_type || 'Standard'}</td>
                            <td className="px-4 py-2 text-gray-700">${t.payment_amount || 0}</td>
                            <td className="px-4 py-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                t.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};