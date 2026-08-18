import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transactionId, orderId } = req.query;

  if (!transactionId && !orderId) {
    return res.status(400).json({ error: 'Missing transactionId or orderId' });
  }

  try {
    let paymentId: string | null = null;

    if (transactionId && typeof transactionId === 'string') {
      paymentId = transactionId;
    } else if (orderId && typeof orderId === 'string') {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('id, status')
        .eq('meta->>order_id', orderId)
        .maybeSingle();

      if (paymentError) throw paymentError;

      if (!payment || payment.status !== 'confirmed') {
        return res.status(200).json({ found: false });
      }

      paymentId = payment.id;
    }

    if (!paymentId) {
      return res.status(200).json({ found: false });
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*, event:events(title, event_date, venue)')
      .eq('payment_id', paymentId)
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