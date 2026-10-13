import { supabaseAdmin } from '@/lib/supabaseAdmin';

// The price always comes from the database, never from the browser
export async function getTicketPrice(eventId: string, ticketTypeName: string): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from('ticket_types')
    .select('price')
    .eq('event_id', eventId)
    .eq('name', ticketTypeName)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const price = Number(data?.price);
  return price > 0 ? price : null;
}