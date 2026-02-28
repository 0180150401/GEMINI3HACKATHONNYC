import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSpotifyAuthUrl } from '@/lib/api/spotify';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const returnTo = reqUrl.searchParams.get('returnTo') ?? '/';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? crypto.randomUUID();
  const state = Buffer.from(JSON.stringify({ userId, returnTo })).toString('base64');

  const cookieStore = await cookies();
  cookieStore.set('spotify_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' });

  const url = getSpotifyAuthUrl(state);
  return NextResponse.redirect(url);
}
