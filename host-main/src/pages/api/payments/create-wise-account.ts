import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, wiseEmail } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!userId || !wiseEmail || !emailRegex.test(wiseEmail)) {
    return res.status(400).json({ error: 'A valid Wise account email is required' });
  }

  try {
    // Only one payout method can be active at a time
    await supabaseAdmin
      .from('payment_accounts')
      .update({ status: 'inactive' })
      .eq('user_id', userId)
      .neq('provider', 'wise');

    const { error } = await supabaseAdmin
      .from('payment_accounts')
      .upsert(
        {
          user_id: userId,
          provider: 'wise',
          status: 'active',
          external_account_id: wiseEmail,
          display_label: `Wise — ${wiseEmail}`,
          meta: { wiseEmail },
        },
        { onConflict: 'user_id,provider' }
      );

    if (error) throw error;
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving Wise account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}