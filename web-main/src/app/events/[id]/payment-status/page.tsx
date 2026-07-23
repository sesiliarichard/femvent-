'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const flwStatus = searchParams?.get('status');
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
    const maxAttempts = 10;

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
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Completed</h1>
          <p className="text-gray-600 mb-6">
            Your payment was {flwStatus || 'not completed'}. No charge was made.
          </p>
          <button
            onClick={() => router.push(`/events/${eventId}`)}
            className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg"
          >
            Back to Event
          </button>
        </div>
      </main>
    );
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Confirming your payment...</p>
        </div>
      </main>
    );
  }

  if (timedOut || !ticket) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Almost There</h1>
          <p className="text-gray-600">
            Your payment succeeded, but we're still finalizing your ticket. Check your email shortly, or refresh this page.
          </p>
        </div>
      </main>
    );
  }

  const qrPayload = JSON.stringify({
    ticketId: ticket.id,
    eventId: ticket.event_id,
    userId: ticket.user_id,
    qrCodeId: ticket.qr_code_id || `qr_${ticket.id}`,
    timestamp: Date.now(),
  });
  const qrData = encodeURIComponent(qrPayload);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're In!</h1>
        <p className="text-gray-600 mb-6">{ticket.event?.title}</p>

        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}`}
          alt="Ticket QR Code"
          className="mx-auto mb-6 rounded-xl border border-gray-200"
        />

        <div className="text-left bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Ticket Type</span>
            <span className="font-semibold text-gray-900">{ticket.ticket_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount Paid</span>
            <span className="font-semibold text-gray-900">${ticket.payment_amount}</span>
          </div>
          {ticket.event?.event_date && (
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold text-gray-900">
                {new Date(ticket.event.event_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Show this QR code at check-in.
        </p>
      </div>
    </main>
  );
}