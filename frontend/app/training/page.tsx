'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';

import { getApiUrl } from '@/lib/api';

type NodeType = 'line' | 'trap' | 'puzzle' | 'transition';

interface OpeningNode {
  id: string;
  journeyId: string;
  parentId: string | null;
  moveSAN: string;
  fen: string;
  depth: number;
  isRequired: boolean;
  nodeType?: NodeType;
  explanation?: string | null;
  difficulty?: number;
}

interface Journey {
  id: string;
  name: string;
  description: string;
  side: 'white' | 'black';
  difficulty: number;
  estimatedDepth: number;
}

interface NodeProgress {
  masteryLevel: number;
  correctCount: number;
  incorrectCount: number;
}

interface ReviewItem {
  nodeId: string;
  masteryLevel: number;
  correctCount: number;
  incorrectCount: number;
  nextReview: string | null;
}

function getChildren(nodes: OpeningNode[], parentId: string): OpeningNode[] {
  return nodes.filter((n) => n.parentId === parentId);
}

function TrainingPageContent() {
  const searchParams = useSearchParams();
  const journeyId = searchParams.get('journey');

  const [journey, setJourney] = useState<Journey | null>(null);
  const [tree, setTree] = useState<OpeningNode[]>([]);
  const [loading, setLoading] = useState(!!journeyId);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [incorrectMessage, setIncorrectMessage] = useState<string | null>(null);
  const [correctMessage, setCorrectMessage] = useState<string | null>(null);
  const [progressByNode, setProgressByNode] = useState<Record<string, NodeProgress>>({});

  const currentQueueItem =
    reviewQueue.length > 0 && queueIndex < reviewQueue.length ? reviewQueue[queueIndex] : null;
  const currentNode =
    tree.find((n) => n.id === (currentQueueItem?.nodeId ?? currentNodeId ?? '')) ?? null;
  const children = currentNode ? getChildren(tree, currentNode.id) : [];
  const possibleMoves = children.map((n) => n.moveSAN);
  const currentFen = currentNode?.fen ?? '';
  const depth = currentNode?.depth ?? 0;
  const currentProgress = currentNode ? progressByNode[currentNode.id] : undefined;

  const trainingComplete =
    reviewQueue.length === 0 || queueIndex >= reviewQueue.length || !currentNode;

  const sendProgressUpdate = useCallback(
    async (nodeId: string, correct: boolean) => {
      if (!journeyId || !token) return;
      try {
        const res = await fetch(`${getApiUrl()}/api/progress/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ journeyId, nodeId, correct }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const updatedNodeId = data.nodeId as string;
        const masteryLevel = data.masteryLevel as number;
        const correctCount = data.correctCount as number;
        const incorrectCount = data.incorrectCount as number;
        setProgressByNode((prev) => ({
          ...prev,
          [updatedNodeId]: { masteryLevel, correctCount, incorrectCount },
        }));
      } catch {
        // ignore errors for now
      }
    },
    [journeyId, token]
  );

  const fetchData = useCallback(() => {
    if (!journeyId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${getApiUrl()}/api/journeys/${journeyId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${getApiUrl()}/api/journeys/${journeyId}/tree`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${getApiUrl()}/api/progress/review/${journeyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([journeyData, treeData, queueData]) => {
        setJourney(journeyData);
        const nodes = Array.isArray(treeData) ? treeData : [];
        const queue: ReviewItem[] = Array.isArray(queueData) ? queueData : [];
        setTree(nodes);
        setReviewQueue(queue);
        setQueueIndex(0);
        setIncorrectMessage(null);
        setCorrectMessage(null);

        const initialProgress: Record<string, NodeProgress> = {};
        queue.forEach((item) => {
          initialProgress[item.nodeId] = {
            masteryLevel: item.masteryLevel ?? 0,
            correctCount: item.correctCount ?? 0,
            incorrectCount: item.incorrectCount ?? 0,
          };
        });
        setProgressByNode(initialProgress);

        if (queue.length > 0) {
          setCurrentNodeId(queue[0].nodeId);
        } else {
          setCurrentNodeId(null);
        }

        if (!journeyData) setError('Journey not found');
      })
      .catch(() => setError('Failed to load training data'))
      .finally(() => setLoading(false));
  }, [journeyId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNextPosition = useCallback(() => {
    setCorrectMessage(null);
    setIncorrectMessage(null);
    setQueueIndex((idx) => {
      const next = idx + 1;
      if (next < reviewQueue.length) {
        setCurrentNodeId(reviewQueue[next].nodeId);
      }
      return next;
    });
  }, [reviewQueue]);

  const handleRestart = useCallback(() => {
    if (reviewQueue.length > 0) {
      setQueueIndex(0);
      setCurrentNodeId(reviewQueue[0].nodeId);
      setCorrectMessage(null);
      setIncorrectMessage(null);
    }
  }, [reviewQueue]);

  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (possibleMoves.length === 0 || !currentFen || !currentNode) return false;
      const game = new Chess(currentFen);
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      if (!move) return false;
      const playedSan = move.san;
      const matchingChild = children.find((c) => c.moveSAN === playedSan);
      if (!matchingChild) {
        setIncorrectMessage('Incorrect move, try again');
        setCorrectMessage(null);
        void sendProgressUpdate(currentNode.id, false);
        return false;
      }
      setIncorrectMessage(null);
      setCorrectMessage('Correct!');
      // For this simple training, we don't advance automatically to the child node;
      // we just record mastery on the parent node.
      void sendProgressUpdate(currentNode.id, true);
      return true;
    },
    [currentFen, possibleMoves.length, children, currentNode, sendProgressUpdate]
  );

  if (!journeyId) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold text-slate-800">Training</h1>
          <p className="mt-2 text-slate-600">
            Start a session from a journey detail page, or pick a journey below.
          </p>
          <div className="mt-6">
            <Link
              href="/journeys"
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
            >
              Choose a Journey
            </Link>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-slate-500">Loading training…</p>
        </div>
      </RequireAuth>
    );
  }

  if (error || !journey) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-red-600">{error ?? 'Journey not found'}</p>
          <Link
            href="/journeys"
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            ← Back to Journeys
          </Link>
        </div>
      </RequireAuth>
    );
  }

  if (tree.length === 0) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-slate-600">No opening tree for this journey yet.</p>
          <Link
            href={`/journeys/${journeyId}`}
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            ← Back to journey
          </Link>
        </div>
      </RequireAuth>
    );
  }

  if (trainingComplete) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold text-slate-800">Training</h1>
          <p className="mt-4 text-slate-600">Training complete for today.</p>
          <p className="mt-1 text-sm text-slate-500">
            You have no more positions due for review in this journey.
          </p>
          <Link
            href={`/journeys/${journeyId}`}
            className="mt-6 inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to journey
          </Link>
        </div>
      </RequireAuth>
    );
  }

  const correctMovesHint =
    possibleMoves.length > 0
      ? `Possible correct moves: ${possibleMoves.join(' or ')}`
      : '';

  return (
    <RequireAuth>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {currentNode?.nodeType === 'trap' ? 'Opening Trap!' : 'Training position'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {journey.name} · Move depth {depth}
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                Position mastery: Level {currentProgress?.masteryLevel ?? 0}
              </p>
              {correctMovesHint && (
                <p className="mt-0.5 text-sm text-slate-600">{correctMovesHint}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/journeys/${journeyId}`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to journey
              </Link>
              <button
                type="button"
                onClick={handleNextPosition}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
              >
                Next position
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Restart training
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            {correctMessage && (
              <p className="mb-2 text-sm font-medium text-green-600">{correctMessage}</p>
            )}
            {incorrectMessage && (
              <p className="mb-2 text-sm font-medium text-red-600">{incorrectMessage}</p>
            )}
            <div className="flex justify-center">
              <div className="w-full max-w-[min(100%,28rem)]">
                <Chessboard
                  options={{
                    position: currentFen,
                    onPieceDrop: ({ sourceSquare, targetSquare }) => {
                      if (!sourceSquare || !targetSquare) return false;
                      return handlePieceDrop(sourceSquare, targetSquare);
                    },
                    boardOrientation: journey.side === 'white' ? 'white' : 'black',
                  }}
                />
              </div>
            </div>
            {currentNode?.nodeType === 'trap' && currentNode.explanation && (
              <p className="mt-3 text-sm text-slate-600">{currentNode.explanation}</p>
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

export default function TrainingPage() {
  return (
    <Suspense fallback={<div>Loading training...</div>}>
      <TrainingPageContent />
    </Suspense>
  );
}
