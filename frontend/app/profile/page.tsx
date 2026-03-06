'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RequireAuth } from '@/components/RequireAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface BadgeItem {
  id: string;
  journeyId: string;
  journeyName: string;
  badgeType: string;
  earnedAt: string;
}

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setBadgesLoading(false);
      return;
    }
    fetch(`${API_URL}/api/badges/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setBadges(Array.isArray(data) ? data : []))
      .catch(() => setBadges([]))
      .finally(() => setBadgesLoading(false));
  }, [token]);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800">Profile</h1>
        <p className="mt-2 text-slate-600">Your stats, badges, and settings.</p>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-700">User</h2>
          <div className="mt-3 space-y-1">
            <p className="text-slate-800 font-medium">{user?.name ?? '—'}</p>
            <p className="text-sm text-slate-500">
              Elo: {user?.elo != null ? user.elo : '—'}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-700">Badges</h2>
          <p className="mt-1 text-sm text-slate-500">
            Earn Conqueror and streak badges as you train.
          </p>
          {badgesLoading ? (
            <p className="mt-3 text-sm text-slate-400">Loading badges…</p>
          ) : badges.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No badges yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {badges.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm"
                >
                  <span>🏆</span>
                  <span className="font-medium text-slate-800">
                    {b.journeyName} Conqueror
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-700">Stats</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold text-slate-800">0</p>
              <p className="text-sm text-slate-500">Moves trained</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">0%</p>
              <p className="text-sm text-slate-500">Accuracy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">0</p>
              <p className="text-sm text-slate-500">Day streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">0</p>
              <p className="text-sm text-slate-500">XP</p>
            </div>
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
