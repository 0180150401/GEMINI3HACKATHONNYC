const SPOTIFY_AUTH = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API = 'https://api.spotify.com/v1';

export function getSpotifyAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/spotify/callback`,
    scope: 'user-read-playback-state user-read-currently-playing',
    state,
  });
  return `${SPOTIFY_AUTH}?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const res = await fetch(SPOTIFY_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/spotify/callback`,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPlaybackState(accessToken: string): Promise<{
  is_playing?: boolean;
  item?: { name?: string; artists?: { name?: string }[] };
  tempo?: number;
} | null> {
  const res = await fetch(`${SPOTIFY_API}/me/player`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 204) return null; // no active device
  if (!res.ok) return null;
  const data = (await res.json()) as {
    is_playing?: boolean;
    item?: { name?: string; artists?: { name?: string }[] };
  };
  // Tempo comes from audio features - need separate call
  let tempo: number | undefined;
  const trackId = (data.item as { id?: string } | undefined)?.id;
  if (trackId) {
    const featRes = await fetch(
      `${SPOTIFY_API}/audio-features/${trackId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (featRes.ok) {
      const feat = (await featRes.json()) as { tempo?: number };
      tempo = feat.tempo;
    }
  }
  return {
    ...data,
    tempo,
  };
}
