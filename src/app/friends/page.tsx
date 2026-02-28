'use client';

import { useState, useEffect } from 'react';
import { RecessHeatMap } from '@/components/RecessHeatMap';

interface FriendsData {
  username: string | null;
  friends: { id: string; displayName: string; username: string }[];
  pendingReceived: { id: string; requesterId: string; displayName: string }[];
}

interface ActivityPoint {
  lat: number;
  lng: number;
  weight?: number;
  username?: string;
  task?: string;
  photoUrl?: string;
}

export default function FriendsPage() {
  const [tab, setTab] = useState<'activity' | 'friends'>('activity');
  const [data, setData] = useState<FriendsData | null>(null);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchFriends = async (isRefetch = false) => {
    if (isRefetch) setLoading(true);
    try {
      const res = await fetch('/api/friends');
      if (res.ok) setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await fetch('/api/friends/activity');
      if (res.ok) {
        const json = await res.json();
        setActivity(json.activity ?? []);
      } else {
        setActivity([]);
      }
    } catch {
      setActivity([]);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (tab === 'activity') fetchActivity();
  }, [tab]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const username = usernameInput.trim().toLowerCase();
    if (!username) return;
    setAdding(true);
    try {
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(json.error ?? 'Failed');
        return;
      }
      setUsernameInput('');
      fetchFriends(true);
    } catch {
      setAddError('Failed');
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = (connectionId: string) => {
    fetch('/api/friends/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    }).then((r) => {
      if (r.ok) {
        fetchFriends(true);
        fetchActivity();
      }
    });
  };

  const handleDecline = (connectionId: string) => {
    fetch('/api/friends/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    }).then((r) => { if (r.ok) fetchFriends(true); });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-xs text-white/50">Loading</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-4">
        <div className="flex gap-6">
          <button
            onClick={() => setTab('activity')}
            className={`text-xs font-bold uppercase ${tab === 'activity' ? 'text-white underline' : 'text-white/50 hover:text-white'}`}
          >
            Activity
          </button>
          <button
            onClick={() => setTab('friends')}
            className={`text-xs font-bold uppercase ${tab === 'friends' ? 'text-white underline' : 'text-white/50 hover:text-white'}`}
          >
            Friends
          </button>
        </div>

        {tab === 'activity' && (
          <div className="space-y-3">
            <p className="text-sm text-white/80">Where friends are playing Recess</p>
            <div className="w-full overflow-hidden" style={{ height: 560 }}>
              <RecessHeatMap
                height="100%"
                points={activity.length > 0 ? activity : undefined}
                friends={activity.length === 0 ? data?.friends : undefined}
              />
            </div>
          </div>
        )}

        {tab === 'friends' && (
          <div className="space-y-4">
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                placeholder="Search username..."
                className="flex-1 border border-white/30 bg-black px-4 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:border-white/60"
              />
              <button
                type="submit"
                disabled={adding || !usernameInput.trim()}
                className="px-4 py-2 text-xs font-bold uppercase border border-white/30 hover:bg-white hover:text-black disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white"
              >
                {adding ? 'Sending' : 'Send'}
              </button>
            </form>
            {addError && <p className="text-xs text-white/60">{addError}</p>}

            {data?.pendingReceived?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-white/60">Requests</p>
                {data.pendingReceived.map((req) => (
                  <div key={req.id} className="flex items-center justify-between border border-white/20 p-3">
                    <span className="text-sm">{req.displayName}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="w-8 h-8 flex items-center justify-center bg-green-600 hover:bg-green-500 text-white text-sm font-bold"
                        aria-label="Accept"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        className="w-8 h-8 flex items-center justify-center border border-white/40 hover:bg-white/10 text-white/70 hover:text-white text-sm"
                        aria-label="Reject"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-white/60">Friends</p>
              {data?.friends?.length ? (
                <div className="space-y-1">
                  {data.friends.map((f) => (
                    <div key={f.id} className="flex items-center justify-between border border-white/10 p-3">
                      <span className="text-sm">{f.displayName || f.username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">No friends yet</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
