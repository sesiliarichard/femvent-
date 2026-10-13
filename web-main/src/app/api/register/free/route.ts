import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    // Verify who is asking from their login token, never from the request body
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Please log in first' }, { status: 401 });
    }
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Please log in first' }, { status: 401 });
    }
    const user = authData.user;

    const { eventId, ticketTypeName } = await req.json();
    if (!eventId || !ticketTypeName) {
      return NextResponse.json({ error: 'eventId and ticketTypeName are required' }, { status: 400 });
    }

    // Only genuinely free ticket types can be issued here
    const { data: ticketType } = await supabaseAdmin
      .from('ticket_types')
      .select('name, price')
      .eq('event_id', eventId)
      .eq('name', ticketTypeName)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!ticketType || Number(ticketType.price) > 0) {
      return NextResponse.json({ error: 'This ticket is not free' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .in('status', ['confirmed', 'pending'])
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'You are already registered for this gathering.' }, { status: 409 });
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: 'confirmed',
        ticket_type: ticketType.name,
        payment_amount: 0,
        payment_method: 'free',
        confirmed_at: new Date().toISOString(),
        check_in_status: 'not-checked-in',
        qr_code_id: crypto.randomUUID(),
      })
      .select('id, qr_code_id')
      .single();

    if (error) throw error;
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Free registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}