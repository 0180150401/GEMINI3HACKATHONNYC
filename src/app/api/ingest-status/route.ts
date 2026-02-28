import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ sources: [] });
  }

  const { data } = await supabase
    .from('data_connections')
    .select('provider')
    .eq('user_id', user.id);

  const providers = (data ?? []).map((r) => r.provider);
  const spotify = providers.includes('spotify');

  const sources: string[] = ['news', 'weather', 'terrain', 'location'];
  if (spotify) sources.push('spotify');
  if (process.env.GOOGLE_MAPS_API_KEY) sources.push('places');

  return NextResponse.json({ sources });
}
