import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, bankName, accountNumber, accountName, instructions } = req.body;

  if (!userId || !bankName || !accountNumber || !accountName) {
    return res.status(400).json({ error: 'Missing required bank details' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('payment_accounts')
      .upsert(
        {
          user_id: userId,
          provider: 'manual',
          status: 'active',
          external_account_id: null,
          display_label: `${bankName} — ****${String(accountNumber).slice(-4)}`,
          meta: { bankName, accountNumber, accountName, instructions: instructions || null },
        },
        { onConflict: 'user_id,provider' }
      );

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving manual payment account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}