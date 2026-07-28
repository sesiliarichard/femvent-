import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function logPaymentAccountHistory({
  userId,
  provider,
  action,
  displayLabel,
}: {
  userId: string;
  provider: string;
  action: 'connected' | 'updated' | 'removed';
  displayLabel?: string | null;
}) {
  try {
    await supabaseAdmin.from('payment_account_history').insert({
      user_id: userId,
      provider,
      action,
      display_label: displayLabel || null,
    });
  } catch (err) {
    // Never let a history-logging failure block the actual payment operation
    console.error('Failed to log payment account history:', err);
  }
}