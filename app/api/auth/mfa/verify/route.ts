import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { factorId, code } = body as { factorId?: string; code?: string };

  if (!factorId || !code) {
    return NextResponse.json({ error: 'factorId and code are required.' }, { status: 400 });
  }

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
