'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface JourneyProgress {
  totalNodes: number;
  masteredNodes: number;
  progressPercent: number;
}

interface Journey {
  id: string;
  name: string;
  description: string;
  side: 'white' | 'black';
  difficulty: number;
  estimatedDepth: number;
}

interface OpeningNode {
  id: string;
  journeyId: string;
  parentId: string | null;
  moveSAN: string;
  fen: string;
  depth: number;
  isRequired: boolean;
}

function difficultyLabel(d: number): string {
  if (d <= 2) return 'Beginner';
  if (d <= 3) return 'Intermediate';
  return 'Advanced';
}

/** Build ordered list of nodes (root first, then by depth and tree order). */
function orderedNodes(nodes: OpeningNode[]): OpeningNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ordered: OpeningNode[] = [];
  const visit = (id: string) => {
    const node = byId.get(id);
    if (!node) return;
    if (node.parentId) visit(node.parentId);
    if (!ordered.find((n) => n.id === node.id)) ordered.push(node);
  };
  nodes.forEach((n) => visit(n.id));
  return ordered.sort((a, b) => a.depth - b.depth);
}

/** Format move sequence from root to the given node (e.g. "1.e4 1...c5 2.Nf3"). */
function moveSequence(nodes: OpeningNode[], upToNode: OpeningNode): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const path: OpeningNode[] = [];
  let current: OpeningNode | undefined = upToNode;
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  let moveNum = 0;
  const parts: string[] = [];
  path.forEach((n, i) => {
    if (i === 0 && n.depth === 0) return; // skip root
    if (n.depth % 2 === 1) {
      moveNum++;
      parts.push(`${moveNum}.${n.moveSAN}`);
    } else {
      parts.push(`${moveNum}...${n.moveSAN}`);
    }
  });
  return parts.join(' ');
}

export default function JourneyDetailPage({ params }: { params: { id: string } }) {
  const { token } = useAuth();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [tree, setTree] = useState<OpeningNode[]>([]);
  const [journeyProgress, setJourneyProgress] = useState<JourneyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/journeys/${params.id}`)
      .then((res) => {
        if (res.status === 404) {
          setError('Journey not found');
          return null;
        }
        if (!res.ok) throw new Error('Failed to load journey');
        return res.json();
      })
      .then((data) => {
        if (data) setJourney(data);
        setError((e) => (data === null ? e : null));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    fetch(`${API_URL}/api/journeys/${params.id}/tree`)
      .then((res) => {
        if (res.status === 404) return [];
        if (!res.ok) throw new Error('Failed to load tree');
        return res.json();
      })
      .then((data) => setTree(Array.isArray(data) ? data : []))
      .catch(() => setTree([]))
      .finally(() => setTreeLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!token || !params.id) return;
    fetch(`${API_URL}/api/progress/journey/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setJourneyProgress(data))
      .catch(() => setJourneyProgress(null));
  }, [params.id, token]);

  if (loading) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-slate-500">Loading journey…</p>
        </div>
      </RequireAuth>
    );
  }

  if (error || !journey) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Link href="/journeys" className="text-sm font-medium text-accent hover:underline">
            ← Back to Journeys
          </Link>
          <p className="mt-4 text-red-600">{error ?? 'Journey not found'}</p>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/journeys"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Back to Journeys
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-800">{journey.name}</h1>
      <p className="mt-1 capitalize text-slate-500">{journey.side}</p>
      <p className="mt-4 text-slate-600">{journey.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {difficultyLabel(journey.difficulty)}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          ~{journey.estimatedDepth} moves
        </span>
      </div>

      {journeyProgress !== null && (
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-800">Journey Progress</h2>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${journeyProgress.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {journeyProgress.masteredNodes} / {journeyProgress.totalNodes} positions mastered
          </p>
          <p className="text-sm font-medium text-slate-700">
            {journeyProgress.progressPercent}% complete
          </p>
        </section>
      )}

      <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-lg font-semibold text-slate-800">Level 1 – Core Lines</h2>
        <p className="mt-2 text-sm text-slate-600">
          This level teaches the main branches of the opening.
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-800">Opening Tree</h2>
        {treeLoading ? (
          <p className="mt-2 text-sm text-slate-500">Loading tree…</p>
        ) : tree.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No tree data for this journey yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {orderedNodes(tree).map((node) => (
              <li
                key={node.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-500">Depth {node.depth}</span>
                <span className="text-slate-700">
                  {node.depth === 0 ? 'Start position' : node.moveSAN}
                </span>
                <span className="text-slate-600">
                  {node.depth > 0 ? moveSequence(tree, node) : '—'}
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                  {node.isRequired ? 'Required' : 'Optional'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8">
        <Link
          href={`/training?journey=${journey.id}`}
          className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
        >
          Start Training
        </Link>
      </div>
    </div>
    </RequireAuth>
  );
}
