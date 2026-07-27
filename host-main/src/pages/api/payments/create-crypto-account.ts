import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, cryptoAddress, cryptoNetwork } = req.body;

  if (!userId || !cryptoAddress || !cryptoNetwork) {
    return res.status(400).json({ error: 'Wallet address and network are required' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('payment_accounts')
      .upsert(
        {
          user_id: userId,
          provider: 'crypto',
          status: 'active',
          external_account_id: cryptoAddress,
          display_label: `${cryptoNetwork} — ${cryptoAddress.slice(0, 6)}...${cryptoAddress.slice(-4)}`,
          meta: { cryptoAddress, cryptoNetwork },
        },
        { onConflict: 'user_id,provider' }
      );

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving crypto wallet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}