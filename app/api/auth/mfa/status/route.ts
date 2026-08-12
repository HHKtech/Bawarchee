import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totpFactor = factors?.totp?.find((f) => f.status === 'verified') ?? null;

  return NextResponse.json({
    enabled: !!totpFactor,
    factorId: totpFactor?.id ?? null,
  });
}
