import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('user_id', user.id)
    .single();

  const { data: asRequester } = await supabase
    .from('friend_connections')
    .select('id, receiver_id, status, created_at')
    .eq('requester_id', user.id);

  const { data: asReceiver } = await supabase
    .from('friend_connections')
    .select('id, requester_id, status, created_at')
    .eq('receiver_id', user.id);

  const pendingSent = (asRequester ?? []).filter((r) => r.status === 'pending');
  const pendingReceived = (asReceiver ?? []).filter((r) => r.status === 'pending');
  const acceptedAsReq = (asRequester ?? []).filter((r) => r.status === 'accepted');
  const acceptedAsRec = (asReceiver ?? []).filter((r) => r.status === 'accepted');

  const friendIds = new Set<string>();
  acceptedAsReq.forEach((r) => friendIds.add(r.receiver_id));
  acceptedAsRec.forEach((r) => friendIds.add(r.requester_id));

  const friendProfiles: Record<string, { display_name: string | null; username: string | null }> = {};
  if (friendIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username')
      .in('user_id', Array.from(friendIds));
    (profiles ?? []).forEach((p) => {
      friendProfiles[p.user_id] = { display_name: p.display_name, username: p.username };
    });
  }

  const requesterProfiles: Record<string, { display_name: string | null; username: string | null }> = {};
  const receiverIds = pendingReceived.map((r) => r.requester_id);
  if (receiverIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username')
      .in('user_id', receiverIds);
    (profiles ?? []).forEach((p) => {
      requesterProfiles[p.user_id] = { display_name: p.display_name, username: p.username };
    });
  }

  return NextResponse.json({
    username: profile?.username ?? null,
    displayName: profile?.display_name ?? null,
    friends: Array.from(friendIds).map((id) => ({
      id,
      displayName: friendProfiles[id]?.display_name ?? friendProfiles[id]?.username ?? 'Friend',
      username: friendProfiles[id]?.username ?? '',
    })),
    pendingSent: pendingSent.map((r) => ({ id: r.id, receiverId: r.receiver_id })),
    pendingReceived: pendingReceived.map((r) => ({
      id: r.id,
      requesterId: r.requester_id,
      displayName: requesterProfiles[r.requester_id]?.display_name ?? requesterProfiles[r.requester_id]?.username ?? 'Someone',
    })),
  });
}
