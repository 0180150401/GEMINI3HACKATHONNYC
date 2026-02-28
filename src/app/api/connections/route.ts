import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('data_connections')
    .select('provider')
    .eq('user_id', user.id);

  const providers = (data ?? []).map((r) => r.provider);
  return NextResponse.json({
    spotify: providers.includes('spotify'),
  });
}
