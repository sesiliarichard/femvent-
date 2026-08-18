import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get('transactionId');
  const orderId = req.nextUrl.searchParams.get('orderId');

  if (!transactionId && !orderId) {
    return NextResponse.json({ error: 'Missing transactionId or orderId' }, { status: 400 });
  }

  try {
    let paymentId: string | null = transactionId;

    if (!paymentId && orderId) {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('id, status')
        .eq('meta->>order_id', orderId)
        .maybeSingle();

      if (paymentError) throw paymentError;

      if (!payment || payment.status !== 'confirmed') {
        return NextResponse.json({ found: false });
      }

      paymentId = payment.id;
    }

    if (!paymentId) {
      return NextResponse.json({ found: false });
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*, event:events(title, event_date, venue)')
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (error) throw error;

    if (!ticket) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, ticket });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}