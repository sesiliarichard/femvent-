import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ORIGIN = 'https://femvents.core23lab.org';

const PLAN_PRICES: Record<string, number> = {
  starter: 29,
  growth: 79,
  pro: 149,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, plan } = req.body;

  if (!userId || !plan || !PLAN_PRICES[plan]) {
    return res.status(400).json({ error: 'A valid userId and plan are required' });
  }

  const amount = PLAN_PRICES[plan];

  try {
    const { data: cryptoSettings } = await supabaseAdmin
      .from('platform_payment_settings')
      .select('credentials')
      .eq('provider', 'crypto')
      .maybeSingle();

    const payoutAddress = cryptoSettings?.credentials?.cryptoAddress;
    const payoutCurrency = cryptoSettings?.credentials?.payoutCurrency;

    if (!payoutAddress || !payoutCurrency) {
      console.error('No crypto payout address configured in platform_payment_settings');
      return res.status(500).json({ error: 'Crypto payments are not configured' });
    }

    const orderId = `femvents-sub-${userId}-${Date.now()}`;

    const npRes = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: payoutCurrency,
        order_id: orderId,
        order_description: `${plan} plan subscription`,
        ipn_callback_url: `https://femvents.core23lab.org/host/api/payments/nowpayments-webhook`,
        success_url: `https://femvents.core23lab.org/host/dashboard?subscription=pending&order_id=${orderId}`,
        cancel_url: `https://femvents.core23lab.org/host/signup/plan?subscription=cancelled`,
      }),
    });

    const data = await npRes.json();

    if (!npRes.ok || !data.invoice_url) {
      console.error('NOWPayments subscription invoice creation failed:', data);
      return res.status(502).json({ error: 'Failed to create crypto payment session' });
    }

    const routeRes = await fetch('https://api.nowpayments.io/v1/invoice-payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        iid: data.id,
        pay_currency: payoutCurrency,
        payout_address: payoutAddress,
        payout_currency: payoutCurrency,
      }),
    });

    if (!routeRes.ok) {
      const routeErr = await routeRes.json().catch(() => ({}));
      console.error('NOWPayments subscription payout routing failed:', routeErr);
      return res.status(502).json({ error: 'Failed to configure crypto payout routing' });
    }

    const { error: paymentError } = await supabaseAdmin.from('payments').insert({
      user_id: userId,
      amount,
      status: 'pending',
      payment_method: 'crypto',
      type: 'subscription',
      currency: 'USD',
      meta: { order_id: orderId, plan },
    });

    if (paymentError) throw paymentError;

    return res.status(200).json({ sessionUrl: data.invoice_url, orderId });
  } catch (error: any) {
    console.error('Error creating crypto subscription checkout:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
}