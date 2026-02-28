import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: asRequester } = await supabase
    .from('friend_connections')
    .select('receiver_id')
    .eq('requester_id', user.id)
    .eq('status', 'accepted');

  const { data: asReceiver } = await supabase
    .from('friend_connections')
    .select('requester_id')
    .eq('receiver_id', user.id)
    .eq('status', 'accepted');

  const friendIds = new Set<string>();
  (asRequester ?? []).forEach((r) => friendIds.add(r.receiver_id));
  (asReceiver ?? []).forEach((r) => friendIds.add(r.requester_id));

  if (friendIds.size === 0) {
    return NextResponse.json({ activity: [] });
  }

  const { data: completions } = await supabase
    .from('task_completions')
    .select('user_id, task, photo_url, lat, lng, created_at')
    .in('user_id', Array.from(friendIds))
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('created_at', { ascending: false });

  if (!completions?.length) {
    return NextResponse.json({ activity: [] });
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, username')
    .in('user_id', [...new Set(completions.map((c) => c.user_id))]);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, { displayName: p.display_name, username: p.username }])
  );

  const activity = completions.map((c) => {
    const p = profileMap.get(c.user_id);
    return {
      lat: c.lat!,
      lng: c.lng!,
      weight: 2,
      username: p?.username ?? 'friend',
      task: c.task,
      photoUrl: c.photo_url ?? undefined,
    };
  });

  return NextResponse.json({ activity });
}
