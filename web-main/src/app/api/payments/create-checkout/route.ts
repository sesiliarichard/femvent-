import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { eventId, amount, email, name, userId, ticketTypeName } = await req.json();

    if (!eventId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'eventId and a valid amount are required' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    // Look up the event's host so we know where the money should go
    const { data: eventRow } = await supabaseAdmin
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .maybeSingle();

    let hostSubaccountId: string | null = null;
    if (eventRow?.host_id) {
      const { data: hostRow } = await supabaseAdmin
        .from('users')
        .select('flw_subaccount_id')
        .eq('id', eventRow.host_id)
        .maybeSingle();
      hostSubaccountId = hostRow?.flw_subaccount_id || null;
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
        ...(hostSubaccountId && {
          subaccounts: [{ id: hostSubaccountId, transaction_split_ratio: 1 }],
        }),
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