import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('verif-hash');
  if (!signature || signature !== process.env.FLUTTERWAVE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = await req.json();
    const transactionId = event?.data?.id;
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
    }

    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
    );
    const verifyData = await verifyRes.json();

    if (verifyData.status !== 'success' || verifyData.data?.status !== 'successful') {
      console.error('Transaction verification failed:', verifyData);
      return NextResponse.json({ error: 'Transaction not verified as successful' }, { status: 400 });
    }

    const tx = verifyData.data;
    const meta = tx.meta || {};
    const eventId = meta.eventId;
    const userId = meta.userId || null;
    const ticketTypeName = meta.ticketTypeName || 'Standard';
    const guestName = tx.customer?.name || null;
    const guestEmail = tx.customer?.email || null;

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId in transaction meta' }, { status: 400 });
    }

    const { data: existingTicket } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('payment_id', String(tx.id))
      .maybeSingle();

    if (existingTicket) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const { error: insertError } = await supabaseAdmin.from('tickets').insert({
      event_id: eventId,
      user_id: userId,
      guest_name: userId ? null : guestName,
      guest_email: userId ? null : guestEmail,
      status: 'confirmed',
      payment_id: String(tx.id),
      payment_amount: tx.amount,
      payment_method: tx.payment_type || 'card',
      confirmed_at: new Date().toISOString(),
      ticket_type: ticketTypeName,
      check_in_status: 'not-checked-in',
      qr_code_id: crypto.randomUUID(),
    });

    if (insertError) throw insertError;

    const { data: confirmedTickets } = await supabaseAdmin
      .from('tickets')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('status', 'confirmed');

    const uniqueUserIds = new Set(
      (confirmedTickets || []).map((t: any) => t.user_id).filter(Boolean)
    );

    await supabaseAdmin
      .from('events')
      .update({ tickets_sold: uniqueUserIds.size })
      .eq('id', eventId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}