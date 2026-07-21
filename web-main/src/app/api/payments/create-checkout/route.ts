import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { eventId, amount, email, name, userId, ticketTypeName } = await req.json();

    if (!eventId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'eventId and a valid amount are required' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    const txRef = `femvents-${eventId}-${Date.now()}`;
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL;

    const flutterwaveRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: 'USD',
        redirect_url: `${origin}/events/${eventId}/payment-status`,
        customer: { email, name: name || 'FemVents Attendee' },
        customizations: {
          title: 'FemVents Ticket Purchase',
          description: `Ticket purchase for event ${eventId}`,
        },
        meta: { eventId, userId: userId || null, ticketTypeName: ticketTypeName || 'Standard' },
      }),
    });

    const data = await flutterwaveRes.json();

    if (data.status !== 'success' || !data.data?.link) {
      console.error('Flutterwave checkout creation failed:', data);
      return NextResponse.json({ error: 'Failed to create payment session' }, { status: 502 });
    }

    return NextResponse.json({ sessionUrl: data.data.link, txRef });
  } catch (error) {
    console.error('Error creating Flutterwave checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}