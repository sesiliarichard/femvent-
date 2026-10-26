import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ exists: false });

  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', String(email).trim().toLowerCase())
    .maybeSingle();

  return NextResponse.json({ exists: !!data });
}