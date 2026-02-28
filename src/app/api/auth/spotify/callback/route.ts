import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens } from '@/lib/api/spotify';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/game/new?error=${error}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/game/new?error=missing_params`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get('spotify_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/game/new?error=invalid_state`);
  }
  cookieStore.delete('spotify_oauth_state');

  let userId: string;
  try {
    userId = JSON.parse(Buffer.from(state, 'base64').toString()).userId;
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/game/new?error=invalid_state`);
  }

  const tokens = await exchangeCodeForTokens(code);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const supabase = await createClient();
  await supabase.from('data_connections').upsert(
    {
      user_id: userId,
      provider: 'spotify',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' }
  );

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/game/new?spotify=connected`);
}
