import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing event id' });
  }

  // Require a logged-in user
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  try {
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.status(200).json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}