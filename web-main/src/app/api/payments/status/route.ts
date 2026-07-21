import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get('transactionId');

  if (!transactionId) {
    return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 });
  }

  try {
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*, event:events(title, event_date, venue)')
      .eq('payment_id', transactionId)
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