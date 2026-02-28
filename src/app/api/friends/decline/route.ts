import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const connectionId = body.connectionId ?? body.id;
  if (!connectionId) {
    return NextResponse.json({ error: 'Missing connection ID' }, { status: 400 });
  }

  const { data: conn } = await supabase
    .from('friend_connections')
    .select('id, receiver_id')
    .eq('id', connectionId)
    .single();

  if (!conn || conn.receiver_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await supabase.from('friend_connections').delete().eq('id', connectionId);
  return NextResponse.json({ ok: true });
}
