import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ORIGIN = 'https://femvents.core23lab.org';
const PESAPAL_BASE = 'https://pay.pesapal.com/v3';

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

  const { userId, plan, email, name, phone } = req.body;

  if (!userId || !plan) {
    return res.status(400).json({ error: 'A valid userId and plan are required' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
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
    const authRes = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        consumer_key: process.env.PESAPAL_LIVE_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_LIVE_CONSUMER_SECRET,
      }),
    });

    const authRawText = await authRes.text();
    let authData: any;
    try {
      authData = JSON.parse(authRawText);
    } catch {
      return res.status(502).json({ error: `Pesapal auth endpoint returned non-JSON (status ${authRes.status}): ${authRawText.slice(0, 300)}` });
    }

    const token = authData?.token;
    if (!token) {
      console.error('Pesapal auth failed:', authData);
      return res.status(502).json({ error: `Pesapal auth failed (status ${authRes.status}): ${JSON.stringify(authData).slice(0, 500)}` });
    }

    const orderId = `femvents-sub-${userId}-${Date.now()}`;
    const origin = req.headers.origin || process.env.NEXT_PUBLIC_ATTENDEE_SITE_URL;

    const orderRes = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: orderId,
        currency: 'USD',
        amount,
        description: `${plan} plan subscription`,
        callback_url: `${origin}/dashboard?subscription=pending&order_id=${orderId}`,
        notification_id: process.env.PESAPAL_LIVE_IPN_ID,
        billing_address: {
          email_address: email,
          phone_number: phone || '',
          country_code: 'TZ',
          first_name: (name || 'FemVents Host').split(' ')[0],
          last_name: (name || '').split(' ').slice(1).join(' ') || 'Host',
        },
      }),
    });

    const orderRawText = await orderRes.text();
    let orderData: any;
    try {
      orderData = JSON.parse(orderRawText);
    } catch {
      return res.status(502).json({ error: `Pesapal order endpoint returned non-JSON (status ${orderRes.status}): ${orderRawText.slice(0, 300)}` });
    }

    if (!orderData.redirect_url) {
      console.error('Pesapal subscription order submission failed:', orderData);
      return res.status(502).json({ error: `Pesapal order failed (status ${orderRes.status}): ${JSON.stringify(orderData).slice(0, 500)}` });
    }

    const { error: paymentError } = await supabaseAdmin.from('payments').insert({
      user_id: userId,
      amount,
      status: 'pending',
      payment_method: 'pesapal',
      type: 'subscription',
      currency: 'USD',
      meta: { order_id: orderId, order_tracking_id: orderData.order_tracking_id, plan },
    });

    if (paymentError) throw paymentError;

    return res.status(200).json({ sessionUrl: orderData.redirect_url, orderId });
  } catch (error: any) {
    console.error('Error creating subscription checkout:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
}