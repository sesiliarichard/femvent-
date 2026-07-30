import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logPaymentAccountHistory } from '@/lib/paymentHistory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, bankName, accountNumber, accountName, instructions } = req.body;

  if (!userId || !bankName || !accountNumber || !accountName) {
    return res.status(400).json({ error: 'Missing required bank details' });
  }

  try {
    const displayLabel = `${bankName} — ****${String(accountNumber).slice(-4)}`;

    // Only one payout method can be active at a time
    await supabaseAdmin
      .from('payment_accounts')
      .update({ status: 'inactive' })
      .eq('user_id', userId)
      .neq('provider', 'manual');

    const { data: existing } = await supabaseAdmin
      .from('payment_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'manual')
      .maybeSingle();
      
    const { error } = await supabaseAdmin
      .from('payment_accounts')
      .upsert(
        {
          user_id: userId,
          provider: 'manual',
          status: 'active',
          external_account_id: null,
          display_label: displayLabel,
          meta: { bankName, accountNumber, accountName, instructions: instructions || null },
        },
        { onConflict: 'user_id,provider' }
      );

    if (error) throw error;

    await logPaymentAccountHistory({
      userId,
      provider: 'manual',
      action: existing ? 'updated' : 'connected',
      displayLabel,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving manual payment account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}