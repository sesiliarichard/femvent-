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
    if (enabled === false) {
      const { error } = await supabaseAdmin
        .from('payment_accounts')
        .update({ status: 'inactive' })
        .eq('user_id', userId)
        .eq('provider', 'dpo');

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    const { data: existing, error: findError } = await supabaseAdmin
      .from('payment_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'dpo')
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from('payment_accounts')
        .update({ status: 'active', display_label: 'DPO Pay' })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('payment_accounts')
        .insert({
          user_id: userId,
          provider: 'dpo',
          status: 'active',
          display_label: 'DPO Pay',
          meta: {},
        });
      if (insertError) throw insertError;
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error enabling DPO Pay:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
}