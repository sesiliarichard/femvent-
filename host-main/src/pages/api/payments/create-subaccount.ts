import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, accountBankCode, accountNumber, accountName, businessName, businessEmail, country } = req.body;

  if (!userId || !accountBankCode || !accountNumber || !accountName || !country) {
    return res.status(400).json({ error: 'Missing required payout details' });
  }

  try {
    const flwRes = await fetch('https://api.flutterwave.com/v3/subaccounts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: accountBankCode,
        account_number: accountNumber,
        business_name: businessName || accountName,
        business_email: businessEmail,
        business_mobile: '',
        country: country,
        split_type: 'percentage',
        split_value: 1, // host gets 100%
      }),
    });

    const data = await flwRes.json();

    if (data.status !== 'success' || !data.data?.subaccount_id) {
      console.error('Failed to create Flutterwave subaccount:', data);
      return res.status(502).json({ error: data.message || 'Failed to create payout account' });
    }

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        flw_subaccount_id: data.data.subaccount_id,
        bank_code: accountBankCode,
        bank_account_number: accountNumber,
        bank_account_name: accountName,
      })
      .eq('id', userId);

    if (dbError) throw dbError;

    return res.status(200).json({ success: true, subaccountId: data.data.subaccount_id });
  } catch (error) {
    console.error('Error creating subaccount:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}