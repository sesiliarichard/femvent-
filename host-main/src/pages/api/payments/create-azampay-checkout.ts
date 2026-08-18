import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ORIGIN = 'https://femvents.netlify.app';

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

  const { eventId, amount, phoneNumber, provider, email, name, userId, ticketTypeName } = req.body;

  if (!eventId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'eventId and a valid amount are required' });
  }
  if (!phoneNumber || !provider) {
    return res.status(400).json({ error: 'phoneNumber and provider are required' });
  }

  try {
    // Step 1: get an auth token
    const tokenRes = await fetch('https://authenticator-sandbox.azampay.co.tz/AppRegistration/GenerateToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName: process.env.AZAMPAY_APP_NAME,
        clientId: process.env.AZAMPAY_CLIENT_ID,
        clientSecret: process.env.AZAMPAY_CLIENT_SECRET,
        apiKey: process.env.AZAMPAY_TOKEN,
      }),
    });

    const tokenRawText = await tokenRes.text();
    console.log('AzamPay token raw response:', tokenRes.status, tokenRawText);

    let tokenData: any;
    try {
      tokenData = JSON.parse(tokenRawText);
    } catch {
      return res.status(502).json({ error: `AzamPay token endpoint returned non-JSON (status ${tokenRes.status}): ${tokenRawText.slice(0, 300)}` });
    }

    const accessToken = tokenData?.data?.accessToken;
    if (!accessToken) {
      console.error('AzamPay token generation failed:', tokenData);
      return res.status(502).json({ error: 'Failed to authenticate with AzamPay' });
    }

    // Convert USD ticket price to TZS
    const rate = Number(process.env.AZAMPAY_USD_TO_TZS_RATE || 2700);
    const amountTzs = Math.round(amount * rate);
    const externalId = `femvents-${eventId}-${Date.now()}`;

    // Step 2: initiate MNO checkout (push prompt to buyer's phone)
    const checkoutRes = await fetch('https://sandbox.azampay.co.tz/azampay/mno/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountNumber: phoneNumber,
        amount: String(amountTzs),
        currency: 'TZS',
        externalId,
        provider,
      }),
    });

    const checkoutRawText = await checkoutRes.text();
    console.log('AzamPay checkout raw response:', checkoutRes.status, checkoutRawText);

    let checkoutData: any = {};
    if (checkoutRawText.trim().length > 0) {
      try {
        checkoutData = JSON.parse(checkoutRawText);
      } catch {
        return res.status(502).json({ error: `AzamPay checkout endpoint returned non-JSON (status ${checkoutRes.status}): ${checkoutRawText.slice(0, 300)}` });
      }
    }

    // AzamPay sandbox sometimes returns 200 with an empty body when the push was accepted
    const checkoutAccepted = checkoutRes.ok && (checkoutRawText.trim().length === 0 || checkoutData.success !== false);

    if (!checkoutAccepted) {
      console.error('AzamPay MNO checkout failed:', checkoutRes.status, checkoutData);
      return res.status(502).json({ error: checkoutData.message || 'Failed to initiate mobile money payment' });
    }

    // Create pending payments + ticket rows — webhook flips them to confirmed
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        event_id: eventId,
        user_id: userId || null,
        amount: Math.round(amount),
        status: 'pending',
        payment_method: 'azampay',
        type: 'ticket',
        currency: 'USD',
        meta: { external_id: externalId, amount_tzs: amountTzs, provider, transaction_id: checkoutData.transactionId },
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    const { error: ticketError } = await supabaseAdmin.from('tickets').insert({
      event_id: eventId,
      user_id: userId || null,
      guest_name: userId ? null : name || null,
      guest_email: userId ? null : email || null,
      status: 'pending',
      payment_id: payment.id,
      payment_amount: amount,
      payment_method: 'azampay',
      ticket_type: ticketTypeName || 'Standard',
      check_in_status: 'not-checked-in',
    });

    if (ticketError) throw ticketError;

    return res.status(200).json({
      success: true,
      externalId,
      message: checkoutData.message || 'Check your phone to approve the payment',
    });
  } catch (error: any) {
    console.error('Error creating AzamPay checkout:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
}