import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/requireUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // The caller is whoever the login token says, never a userId from the URL
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const { data, error } = await supabaseAdmin
      .from('payment_accounts')
      .select('id, provider, status, display_label')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ accounts: data || [] });
  } catch (error) {
    console.error('Error listing payment accounts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}