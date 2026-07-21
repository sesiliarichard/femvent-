import { createClient } from '@supabase/supabase-js';

// Admin client — uses the service role key, bypasses RLS.
// NEVER import this into client-side ("use client") components.
// Only use inside API routes / server code.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);