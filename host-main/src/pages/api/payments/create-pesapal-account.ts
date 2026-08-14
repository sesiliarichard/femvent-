import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, enabled } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    await supabaseAdmin
      .from('payment_accounts')
      .update({ status: 'inactive' })
      .eq('user_id', userId)
      .in('provider', ['flutterwave']);

    const { error } = await supabaseAdmin
      .from('payment_accounts')
      .upsert(
        {
          user_id: userId,
          provider: 'pesapal',
          status: enabled === false ? 'inactive' : 'active',
          external_account_id: null,
          display_label: 'Pesapal — Card & Mobile Money (East/Southern Africa + international cards)',
          meta: {},
        },
        { onConflict: 'user_id,provider' }
      );

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error toggling Pesapal:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}