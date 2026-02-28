import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { UserMetrics } from '@/types';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const metrics = body.metrics as Partial<UserMetrics>;

  const { error } = await supabase
    .from('user_metrics')
    .upsert(
      {
        user_id: user.id,
        provider: 'manual',
        metrics: metrics || {},
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
