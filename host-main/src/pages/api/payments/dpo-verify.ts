import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DPO_SANDBOX = process.env.DPO_SANDBOX === 'true';
const DPO_API_BASE = 'https://secure.3gdirectpay.com/API/v6/';
const DPO_COMPANY_TOKEN = DPO_SANDBOX
  ? process.env.DPO_SANDBOX_COMPANY_TOKEN
  : process.env.DPO_LIVE_COMPANY_TOKEN;

function extractXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.query;
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'Missing orderId' });
  }

  try {
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('meta->>order_id', orderId)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.status === 'confirmed') {
      return res.status(200).json({ status: 'confirmed', duplicate: true });
    }

    const transToken = payment.meta?.trans_token;
    if (!transToken || !DPO_COMPANY_TOKEN) {
      return res.status(500).json({ error: 'Missing transToken or DPO company token' });
    }

    const verifyXml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${DPO_COMPANY_TOKEN}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${transToken}</TransactionToken>
</API3G>`;

    const verifyRes = await fetch(DPO_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: verifyXml,
    });

    const verifyRawText = await verifyRes.text();
    console.log('DPO verifyToken raw response:', verifyRes.status, verifyRawText);

    const result = extractXmlTag(verifyRawText, 'Result');
    const resultExplanation = extractXmlTag(verifyRawText, 'ResultExplanation');

    if (result !== '000') {
      // Not yet paid, or failed — don't confirm
      return res.status(200).json({ status: 'pending', explanation: resultExplanation });
    }

    await supabaseAdmin.from('payments').update({ status: 'confirmed' }).eq('id', payment.id);

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('payment_id', payment.id)
      .select()
      .single();

    if (ticketError) throw ticketError;

    // TODO: send confirmation email here, same pattern as pesapal-webhook.ts,
    // once checkout + verify are confirmed working in sandbox.

    return res.status(200).json({ status: 'confirmed', ticket });
  } catch (error: any) {
    console.error('DPO verify error:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
}