import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ORIGIN = 'https://femvents.core23lab.org';

// DPO_SANDBOX=true routes to their sandbox environment. Flip to false only once
// you've confirmed sandbox checkout works end-to-end.
const DPO_SANDBOX = process.env.DPO_SANDBOX === 'true';

// Sandbox and live use the SAME endpoint — the environment is determined
// entirely by which Company Token you send (test token vs. live token).
const DPO_API_BASE = 'https://secure.3gdirectpay.com/API/v6/';
const DPO_PAY_URL = 'https://secure.3gdirectpay.com/payv3.php';

const DPO_COMPANY_TOKEN = DPO_SANDBOX
  ? process.env.DPO_SANDBOX_COMPANY_TOKEN
  : process.env.DPO_LIVE_COMPANY_TOKEN;

// From your DPO merchant dashboard, under Services — not guessable, set this
// after DPO approves your account.
const DPO_SERVICE_TYPE = process.env.DPO_SERVICE_TYPE;

function xmlEscape(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

function formatServiceDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

  if (!DPO_COMPANY_TOKEN || !DPO_SERVICE_TYPE) {
    return res.status(500).json({ error: 'DPO is not configured (missing company token or service type)' });
  }

  const { eventId, amount, email, name, phone, userId, ticketTypeName } = req.body;

  if (!eventId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'eventId and a valid amount are required' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Customer email is required' });
  }

  const orderId = `femvents-${eventId}-${Date.now()}`;
  const origin = req.headers.origin || process.env.NEXT_PUBLIC_ATTENDEE_SITE_URL;
  const redirectUrl = `${origin}/events/${eventId}/payment-status?dpo=1&order_id=${orderId}`;

  try {
    const createXml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${xmlEscape(DPO_COMPANY_TOKEN)}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${Number(amount).toFixed(2)}</PaymentAmount>
    <PaymentCurrency>USD</PaymentCurrency>
    <CompanyRef>${xmlEscape(orderId)}</CompanyRef>
    <RedirectURL>${xmlEscape(redirectUrl)}</RedirectURL>
    <BackURL>${xmlEscape(redirectUrl)}</BackURL>
    <customerFirstName>${xmlEscape((name || 'FemVents Attendee').split(' ')[0])}</customerFirstName>
    <customerLastName>${xmlEscape((name || '').split(' ').slice(1).join(' ') || 'Attendee')}</customerLastName>
    <customerEmail>${xmlEscape(email)}</customerEmail>
    <customerPhone>${xmlEscape(phone || '')}</customerPhone>
    <customerCountry>TZ</customerCountry>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${xmlEscape(DPO_SERVICE_TYPE)}</ServiceType>
      <ServiceDescription>${xmlEscape(`Ticket purchase for event ${eventId}${ticketTypeName ? ` (${ticketTypeName})` : ''}`)}</ServiceDescription>
      <ServiceDate>${formatServiceDate(new Date())}</ServiceDate>
    </Service>
  </Services>
</API3G>`;

    const createRes = await fetch(DPO_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: createXml,
    });

    const createRawText = await createRes.text();
    console.log('DPO createToken raw response:', createRes.status, createRawText);

    const result = extractXmlTag(createRawText, 'Result');
    const resultExplanation = extractXmlTag(createRawText, 'ResultExplanation');
    const transToken = extractXmlTag(createRawText, 'TransToken');

    if (result !== '000' || !transToken) {
      console.error('DPO createToken failed:', resultExplanation);
      return res.status(502).json({ error: `DPO createToken failed: ${resultExplanation || 'unknown error'}` });
    }

    const sessionUrl = `${DPO_PAY_URL}?ID=${transToken}`;

    // Create pending payment + ticket rows — verified later via dpo-verify
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        event_id: eventId,
        user_id: userId || null,
        amount: Math.round(amount),
        status: 'pending',
        payment_method: 'dpo',
        type: 'ticket',
        currency: 'USD',
        meta: { order_id: orderId, trans_token: transToken },
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
      payment_method: 'dpo',
      ticket_type: ticketTypeName || 'Standard',
      check_in_status: 'not-checked-in',
    });

    if (ticketError) throw ticketError;

    return res.status(200).json({ sessionUrl, orderId, transToken });
  } catch (error: any) {
    console.error('Error creating DPO checkout:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
}