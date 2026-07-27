import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, paypalEmail } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!userId || !paypalEmail || !emailRegex.test(paypalEmail)) {
    return res.status(400).json({ error: 'A valid PayPal email is required' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('payment_accounts')
      .upsert(
        {
          user_id: userId,
          provider: 'paypal',
          status: 'active',
          external_account_id: paypalEmail,
          display_label: `PayPal — ${paypalEmail}`,
          meta: { paypalEmail },
        },
        { onConflict: 'user_id,provider' }
      );

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving PayPal account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}