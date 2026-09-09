import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email';

const PESAPAL_BASE = 'https://pay.pesapal.com/v3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { OrderTrackingId, OrderMerchantReference } = req.query;

  if (!OrderTrackingId || typeof OrderTrackingId !== 'string') {
    return res.status(400).json({ error: 'Missing OrderTrackingId' });
  }

  try {
    // Get a fresh auth token
    const authRes = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        consumer_key: process.env.PESAPAL_LIVE_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_LIVE_CONSUMER_SECRET,
      }),
    });
    const authData = await authRes.json();
    const token = authData?.token;

    if (!token) {
      console.error('Pesapal webhook auth failed:', authData);
      return res.status(502).json({ error: 'Failed to authenticate with Pesapal' });
    }

    // Verify the real transaction status directly with Pesapal — never trust the IPN alone
    const statusRes = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const statusData = await statusRes.json();

    console.log('Pesapal transaction status:', JSON.stringify(statusData));

    if (statusData.payment_status_description !== 'Completed') {
      return res.status(200).json({ received: true, ignored: statusData.payment_status_description });
    }

    const orderId = OrderMerchantReference || statusData.merchant_reference;

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('meta->>order_id', orderId)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) {
      console.error('No matching payment found for Pesapal order_id:', orderId);
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.status === 'confirmed') {
      return res.status(200).json({ received: true, duplicate: true });
    }

    await supabaseAdmin.from('payments').update({ status: 'confirmed' }).eq('id', payment.id);

    // Subscription payments grant host access here — no ticket involved.
    if (payment.type === 'subscription') {
      const plan = payment.meta?.plan;

      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({ role: 'host', subscription_status: 'active', plan })
        .eq('id', payment.user_id);

      if (userUpdateError) throw userUpdateError;

      try {
        const { data: hostUser } = await supabaseAdmin
          .from('users')
          .select('email, name')
          .eq('id', payment.user_id)
          .maybeSingle();

          if (hostUser?.email) {
            const dashboardUrl = 'https://femvents.core23lab.org/host/dashboard';
            await sendEmail({
              to: hostUser.email,
              subject: `Your ${plan} plan is active`,
              body: `Thanks for subscribing! Your payment of $${payment.amount} was confirmed and your ${plan} plan is now active. Go to your dashboard: ${dashboardUrl}`,
              html: `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDE7ED; padding:48px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FBF3FA; padding:40px 32px; border-radius:4px;">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; color:#9B1F5C; padding-bottom:28px;">FEMVENTS</td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#2E1F45; border-radius:2px;">
                            <tr>
                              <td style="padding:32px 28px;">
                                <span style="display:inline-block; background:#E8743B; color:#2E1F45; font-family:Arial,Helvetica,sans-serif; font-weight:800; font-size:10.5px; letter-spacing:1px; padding:5px 12px; border-radius:999px; margin-bottom:18px;">Subscription active</span>
                                <p style="margin:18px 0 8px; font-family:Arial,Helvetica,sans-serif; font-size:26px; font-weight:800; color:#FBF3FA; line-height:1.2;">Your ${plan} plan is active</p>
                                <p style="margin:0 0 24px; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#D9C9E0; line-height:1.6;">Thanks for subscribing — your payment was confirmed and your dashboard is unlocked.</p>
                                <div style="border-top:1px solid rgba(255,255,255,0.15); margin:22px 0; height:0; line-height:0; font-size:0;">&nbsp;</div>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                  <tr>
                                    <td style="font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#B9A9C4; padding-bottom:10px;">Plan</td>
                                    <td align="right" style="font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:700; color:#FBF3FA; padding-bottom:10px;">${plan}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#B9A9C4;">Amount paid</td>
                                    <td align="right" style="font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:700; color:#FBF3FA;">$${payment.amount}</td>
                                  </tr>
                                </table>
                                <a href="${dashboardUrl}" style="display:block; text-align:center; background:#E8743B; color:#2E1F45; text-decoration:none; font-family:Arial,Helvetica,sans-serif; font-weight:800; font-size:14px; padding:14px; border-radius:999px;">Go to your dashboard</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              `,
                          });
                        }
                    } catch (emailError) {
                      console.error('Subscription confirmation email failed (payment still confirmed):', emailError);
                    }
              
                    return res.status(200).json({ received: true, type: 'subscription' });
                  }
              
                  const { data: ticket, error: ticketError } = await supabaseAdmin
                    .from('tickets')
                    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
                    .eq('payment_id', payment.id)
                    .select('*, event:events(title, event_date, venue)')
                    .single();
              
                  if (ticketError) throw ticketError;
              
                  try {
                    const recipientEmail = ticket.guest_email;
                    
      if (recipientEmail && ticket.event) {
        const eventUrl = `https://femvents.core23lab.org/events/${ticket.event_id}`;
        await sendEmail({
          to: recipientEmail,
          subject: `Your ticket for ${ticket.event.title}`,
          body: `Thanks for registering! Your payment of $${ticket.payment_amount} was confirmed for ${ticket.event.title}. View your event: ${eventUrl}`,
          html: `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDE7ED; padding:48px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background:#FBF3FA; padding:40px 32px; border-radius:4px;">
                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; color:#9B1F5C; padding-bottom:28px;">FEMVENTS</td>
                  </tr>
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border:1px solid #D9C9E0; border-radius:2px;">
                        <tr>
                          <td style="padding:28px 28px 24px;">
                            <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:700; color:#9B1F5C;">Ticket confirmed</p>
                            <p style="margin:0 0 20px; font-family:Arial,Helvetica,sans-serif; font-size:26px; font-weight:800; color:#2E1F45; line-height:1.15;">${ticket.event.title}</p>
                            <table role="presentation" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-right:28px;">
                                  <p style="margin:0 0 4px; font-family:Arial,Helvetica,sans-serif; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8A7A97;">Date</p>
                                  <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:600; color:#2E1F45;">${ticket.event.event_date ? new Date(ticket.event.event_date).toLocaleDateString() : 'TBD'}</p>
                                </td>
                                <td>
                                  <p style="margin:0 0 4px; font-family:Arial,Helvetica,sans-serif; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8A7A97;">Venue</p>
                                  <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:600; color:#2E1F45;">${ticket.event.venue || 'TBD'}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 28px;">
                            <div style="border-top:2px dashed #D9C9E0; height:0; line-height:0; font-size:0;">&nbsp;</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:22px 28px 28px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td>
                                  <p style="margin:0 0 2px; font-family:Arial,Helvetica,sans-serif; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8A7A97;">Amount paid</p>
                                  <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:20px; font-weight:800; color:#2E1F45;">$${ticket.payment_amount}</p>
                                </td>
                                <td align="right">
                                  <a href="${eventUrl}" style="display:inline-block; background:#E8743B; color:#ffffff; text-decoration:none; font-family:Arial,Helvetica,sans-serif; font-weight:700; font-size:14px; padding:13px 26px; border-radius:999px;">View event details</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:26px; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#5C4A6B; line-height:1.6;">
                      See you there — bring this email or your account login for check-in.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          `,
                  });
                }
              } catch (emailError) {
                console.error('Confirmation email failed (payment still confirmed):', emailError);
              }

    const { data: confirmedTickets } = await supabaseAdmin
      .from('tickets')
      .select('user_id')
      .eq('event_id', ticket.event_id)
      .eq('status', 'confirmed');

    const uniqueUserIds = new Set((confirmedTickets || []).map((t: any) => t.user_id).filter(Boolean));

    await supabaseAdmin.from('events').update({ tickets_sold: uniqueUserIds.size }).eq('id', ticket.event_id);

    return res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Pesapal webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}