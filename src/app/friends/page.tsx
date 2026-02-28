'use client';

import { useState, useEffect } from 'react';

interface FriendsData {
  username: string | null;
  friends: { id: string; displayName: string; username: string }[];
  pendingReceived: { id: string; requesterId: string; displayName: string }[];
}

export default function FriendsPage() {
  const [tab, setTab] = useState<'requests' | 'lookup'>('lookup');
  const [data, setData] = useState<FriendsData | null>(null);
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

  useEffect(() => {
    fetchFriends();
  }, []);

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
    }).then((r) => { if (r.ok) fetchFriends(true); });
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
      <div className="max-w-lg mx-auto px-6 py-12 space-y-4">
        <div className="flex border-2 border-white">
          <button
            onClick={() => setTab('requests')}
            className={`flex-1 py-3 text-xs font-bold uppercase ${tab === 'requests' ? 'bg-white text-black' : ''}`}
          >
            Requests
          </button>
          <button
            onClick={() => setTab('lookup')}
            className={`flex-1 py-3 text-xs font-bold uppercase ${tab === 'lookup' ? 'bg-white text-black' : ''}`}
          >
            Lookup
          </button>
        </div>

        {tab === 'requests' && (
          <div className="space-y-2">
            {data?.pendingReceived?.length ? (
              data.pendingReceived.map((req) => (
                <div key={req.id} className="flex items-center justify-between border-2 border-white p-3">
                  <span className="text-sm">{req.displayName}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(req.id)} className="text-xs font-bold uppercase hover:underline">Accept</button>
                    <button onClick={() => handleDecline(req.id)} className="text-xs text-white/50 hover:text-white">Decline</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/50">No requests</p>
            )}
          </div>
        )}

        {tab === 'lookup' && (
          <form onSubmit={handleAddFriend} className="space-y-3">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
              placeholder="username"
              className="w-full border-2 border-white bg-black px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none"
            />
            {addError && <p className="text-xs text-white/60">{addError}</p>}
            <button
              type="submit"
              disabled={adding || !usernameInput.trim()}
              className="w-full border-2 border-white py-3 text-xs font-bold uppercase hover:bg-white hover:text-black disabled:opacity-50"
            >
              {adding ? 'Sending' : 'Send'}
            </button>
          </form>
        )}

        {!data?.username && (
          <p className="text-xs text-white/40">
            <a href="/settings" className="underline">Set username</a> in Settings
          </p>
        )}
      </div>
    </div>
  );
}
