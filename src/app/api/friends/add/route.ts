import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const username = (body.username ?? '').toString().trim().toLowerCase();
  if (!username || username.length < 2) {
    return NextResponse.json({ error: 'Enter a username' }, { status: 400 });
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('username', username)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const receiverId = targetProfile.user_id;
  if (receiverId === user.id) {
    return NextResponse.json({ error: "You can't add yourself" }, { status: 400 });
  }

  const [{ data: existing1 }, { data: existing2 }] = await Promise.all([
    supabase.from('friend_connections').select('id, status').eq('requester_id', user.id).eq('receiver_id', receiverId).maybeSingle(),
    supabase.from('friend_connections').select('id, status').eq('requester_id', receiverId).eq('receiver_id', user.id).maybeSingle(),
  ]);
  const existing = existing1 ?? existing2;

  if (existing) {
    if (existing.status === 'accepted') {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 });
    }
    if (existing.status === 'pending') {
      return NextResponse.json({ error: 'Request already sent' }, { status: 400 });
    }
  }

  const { error } = await supabase.from('friend_connections').insert({
    requester_id: user.id,
    receiver_id: receiverId,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
