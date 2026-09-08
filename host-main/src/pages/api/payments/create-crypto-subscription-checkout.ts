import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ORIGIN = 'https://femvents.core23lab.org';

const PLAN_PRICES: Record<string, number> = {
  starter: 29,
  growth: 79,
  pro: 149,
};

function parsePriceToNumber(price: string): number {
  const match = String(price).replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

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

  if (!userId || !plan) {
    return res.status(400).json({ error: 'A valid userId and plan are required' });
  }

  const { data: siteContent, error: siteContentError } = await supabaseAdmin
    .from('site_content')
    .select('content')
    .eq('site', 'web-main')
    .maybeSingle();

  if (siteContentError) {
    console.error('Error fetching pricing plans:', siteContentError);
    return res.status(500).json({ error: 'Could not verify plan pricing' });
  }

  const pricingPlans = siteContent?.content?.pricingPlans || [];
  const planDetails = pricingPlans.find((p: any) => p.id === plan);
  const amount = planDetails ? parsePriceToNumber(planDetails.price) : PLAN_PRICES[plan];

  if (!amount) {
    return res.status(400).json({ error: 'Could not determine a valid amount for this plan' });
  }
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
      const routeErrText = await routeRes.text();
      console.error('NOWPayments subscription payout routing failed:', routeRes.status, routeErrText);
      return res.status(502).json({ error: `NOWPayments routing failed (status ${routeRes.status}): ${routeErrText.slice(0, 500)}` });
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