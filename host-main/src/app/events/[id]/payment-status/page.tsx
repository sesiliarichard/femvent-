'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const flwStatus = searchParams?.get('status'); // 'successful' | 'cancelled' | 'failed'
  const transactionId = searchParams?.get('transaction_id');

  const [ticket, setTicket] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (flwStatus !== 'successful' || !transactionId) {
      setChecking(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 10; // ~20 seconds total

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/payments/status?transactionId=${transactionId}`);
        const data = await res.json();

        if (data.found) {
          setTicket(data.ticket);
          setChecking(false);
          return;
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }

      if (attempts >= maxAttempts) {
        setChecking(false);
        setTimedOut(true);
        return;
      }

      setTimeout(poll, 2000);
    };

    poll();
  }, [flwStatus, transactionId]);

  if (flwStatus !== 'successful') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Not Completed</h1>
          <p className="text-slate-600 mb-6">
            Your payment was {flwStatus || 'not completed'}. No charge was made.
          </p>
          <button
            onClick={() => router.push(`/events/${eventId}`)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (timedOut || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Almost There</h1>
          <p className="text-slate-600">
            Your payment succeeded, but we're still finalizing your ticket. Check your email shortly, or refresh this page.
          </p>
        </div>
      </div>
    );
  }

  const qrData = encodeURIComponent(ticket.id);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">You're In!</h1>
        <p className="text-slate-600 mb-6">{ticket.event?.title}</p>

        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}`}
          alt="Ticket QR Code"
          className="mx-auto mb-6 rounded-lg border border-slate-200"
        />

        <div className="text-left bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Ticket Type</span>
            <span className="font-semibold text-slate-900">{ticket.ticket_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount Paid</span>
            <span className="font-semibold text-slate-900">${ticket.payment_amount}</span>
          </div>
          {ticket.event?.event_date && (
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-semibold text-slate-900">
                {new Date(ticket.event.event_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Show this QR code at check-in. A confirmation has also been sent to your email.
        </p>
      </div>
    </div>
  );
}