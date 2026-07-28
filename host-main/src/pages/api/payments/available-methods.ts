import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId } = req.query;
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Missing eventId' });
  }

  try {
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event?.host_id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('payment_accounts')
      .select('provider, display_label, meta')
      .eq('user_id', event.host_id)
      .eq('status', 'active');

    if (accountsError) throw accountsError;

    // Only return what a buyer needs — never expose raw account numbers beyond display_label
    const methods = (accounts || []).map((a) => ({
      provider: a.provider,
      label: a.display_label,
      instructions:
        a.provider === 'manual'
          ? { bankName: a.meta?.bankName, accountNumber: a.meta?.accountNumber, accountName: a.meta?.accountName, notes: a.meta?.instructions }
          : a.provider === 'wise'
          ? { wiseEmail: a.meta?.wiseEmail }
          : a.provider === 'crypto'
          ? { address: a.meta?.cryptoAddress, network: a.meta?.cryptoNetwork }
          : a.provider === 'paypal'
          ? { paypalEmail: a.meta?.paypalEmail }
          : null,
    }));

    return res.status(200).json({ methods });
  } catch (error) {
    console.error('Error fetching available payment methods:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}