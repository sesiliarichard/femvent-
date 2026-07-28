import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logPaymentAccountHistory } from '@/lib/paymentHistory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, provider } = req.body;

  if (!userId || !provider) {
    return res.status(400).json({ error: 'userId and provider are required' });
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from('payment_accounts')
      .select('display_label')
      .eq('user_id', userId)
      .eq('provider', provider)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from('payment_accounts')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) throw error;

    await logPaymentAccountHistory({
      userId,
      provider,
      action: 'removed',
      displayLabel: existing?.display_label,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting payment account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}