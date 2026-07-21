import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transactionId } = req.query;
  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'Missing transactionId' });
  }

  try {
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*, event:events(title, event_date, venue)')
      .eq('payment_id', transactionId)
      .maybeSingle();

    if (error) throw error;

    if (!ticket) {
      return res.status(200).json({ found: false });
    }

    return res.status(200).json({ found: true, ticket });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}