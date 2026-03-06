'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';

import { getApiUrl } from '@/lib/api';

interface Journey {
  id: string;
  name: string;
  description: string;
  side: 'white' | 'black';
  difficulty: number;
  estimatedDepth: number;
}

function difficultyLabel(d: number): string {
  if (d <= 2) return 'Beginner';
  if (d <= 3) return 'Intermediate';
  return 'Advanced';
}

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/journeys`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load journeys');
        return res.json();
      })
      .then((data) => {
        setJourneys(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold text-slate-800">Journeys</h1>
          <p className="mt-4 text-slate-500">Loading journeys…</p>
        </div>
      </RequireAuth>
    );
  }

  if (error) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold text-slate-800">Journeys</h1>
          <p className="mt-4 text-red-600">{error}</p>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Journeys</h1>
      <p className="mt-2 text-slate-600">
        Choose an opening journey to train. Each journey has levels and required lines.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {journeys.map((j) => (
          <div
            key={j.id}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-accent hover:shadow"
          >
            <h2 className="font-semibold text-slate-800">{j.name}</h2>
            <p className="mt-1 text-sm capitalize text-slate-500">{j.side}</p>
            <p className="mt-2 flex-1 text-sm text-slate-600 line-clamp-3">{j.description}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {difficultyLabel(j.difficulty)} · ~{j.estimatedDepth} moves
            </p>
            <Link
              href={`/journeys/${j.id}`}
              className="mt-4 inline-flex w-full justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
            >
              Start Journey
            </Link>
          </div>
        ))}
      </div>
    </div>
    </RequireAuth>
  );
}
