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

  const { data: conn, error: fetchError } = await supabase
    .from('friend_connections')
    .select('id, receiver_id, status')
    .eq('id', connectionId)
    .single();

  if (fetchError || !conn) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }
  if (conn.receiver_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized to accept' }, { status: 403 });
  }
  if (conn.status !== 'pending') {
    return NextResponse.json({ error: 'Request already handled' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('friend_connections')
    .update({ status: 'accepted' })
    .eq('id', connectionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
