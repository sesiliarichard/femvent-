import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

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

      // TEMPORARY DEBUG — remove once we've diagnosed this
      console.log('DEBUG status.ts:', {
        orderId,
        payment,
        paymentError,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20),
        keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
      });

      if (paymentError) {
        // TEMPORARY — surface the real error instead of throwing generically
        return NextResponse.json({ found: false, debugError: paymentError }, { status: 200 });
      }
      if (!payment || payment.status !== 'completed') {
        return NextResponse.json({
          found: false,
          debugPayment: payment,
          debugOrderId: orderId,
        });
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