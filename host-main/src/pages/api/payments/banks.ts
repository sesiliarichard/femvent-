import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const country = (req.query.country as string) || 'TZ';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let flwRes;
    try {
      flwRes = await fetch(`https://api.flutterwave.com/v3/banks/${country}`, {
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await flwRes.json();

    if (data.status !== 'success') {
      console.error('Flutterwave banks API error:', data);
      return res.status(502).json({ error: data.message || 'Failed to fetch banks list' });
    }

    return res.status(200).json({ banks: data.data });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}