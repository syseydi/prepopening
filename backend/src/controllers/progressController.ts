import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserProgress } from '../models/userProgress';
import * as userProgressStore from '../data/userProgressStore';
import * as badgeStore from '../data/badgeStore';
import { getTreeForJourney } from '../data/mockOpeningTree';

const MASTERY_THRESHOLD = 3;

/** Get tree nodes for a journey (trainable = nodes that have children). */
function getTrainableNodeIds(journeyId: string): string[] {
  const tree = getTreeForJourney(journeyId);
  const nodeIds = new Set(tree.map((n) => n.id));
  const parentIds = new Set(tree.map((n) => n.parentId).filter(Boolean) as string[]);
  return tree.filter((n) => parentIds.has(n.id)).map((n) => n.id);
}

export function getMyProgress(_req: Request, res: Response): void {
  // Placeholder for future aggregation
  res.status(501).json({ error: 'Not implemented', message: 'GET /progress/me' });
}

export function getJourneyProgress(req: AuthRequest, res: Response): void {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { journeyId } = req.params;
  const trainableIds = getTrainableNodeIds(journeyId);
  const totalNodes = trainableIds.length;
  const progressRecords = userProgressStore.findAllByUserAndJourney(userId, journeyId);
  const progressByNode = new Map(progressRecords.map((p) => [p.nodeId, p]));
  let masteredNodes = 0;
  for (const nodeId of trainableIds) {
    const p = progressByNode.get(nodeId);
    if (p && p.masteryLevel >= MASTERY_THRESHOLD) masteredNodes += 1;
  }
  const progressPercent =
    totalNodes > 0 ? Math.round((masteredNodes / totalNodes) * 100) : 0;
  res.json({
    totalNodes,
    masteredNodes,
    progressPercent,
  });
}

const REVIEW_QUEUE_MAX = 10;

/** Response item for review queue (matches frontend ReviewItem). */
interface ReviewQueueItem {
  nodeId: string;
  masteryLevel: number;
  correctCount: number;
  incorrectCount: number;
  nextReview: string | null;
}

export function getReviewQueueForJourney(req: AuthRequest, res: Response): void {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { journeyId } = req.params;
  if (!journeyId) {
    res.status(400).json({ error: 'Missing journeyId' });
    return;
  }

  const trainableIds = getTrainableNodeIds(journeyId);
  if (trainableIds.length === 0) {
    res.json([]);
    return;
  }

  const now = new Date();
  const progressRecords = userProgressStore.findAllByUserAndJourney(userId, journeyId);
  const progressByNode = new Map(progressRecords.map((p) => [p.nodeId, p]));

  const toItem = (p: UserProgress): ReviewQueueItem => ({
    nodeId: p.nodeId,
    masteryLevel: p.masteryLevel,
    correctCount: p.correctCount,
    incorrectCount: p.incorrectCount,
    nextReview: p.nextReview ? p.nextReview.toISOString() : null,
  });

  const due: ReviewQueueItem[] = [];
  const newNodeIds: string[] = [];

  for (const nodeId of trainableIds) {
    const p = progressByNode.get(nodeId);
    if (p) {
      if (p.nextReview == null || p.nextReview <= now) {
        due.push(toItem(p));
      }
    } else {
      newNodeIds.push(nodeId);
    }
  }

  let queue: ReviewQueueItem[] = [...due];
  for (const nodeId of newNodeIds) {
    if (queue.length >= REVIEW_QUEUE_MAX) break;
    queue.push({
      nodeId,
      masteryLevel: 0,
      correctCount: 0,
      incorrectCount: 0,
      nextReview: null,
    });
  }
  queue = queue.slice(0, REVIEW_QUEUE_MAX);

  res.json(queue);
}

export function getReviewQueue(_req: Request, res: Response): void {
  res.status(501).json({ error: 'Not implemented', message: 'GET /progress/review-queue' });
}

export function updateProgress(req: AuthRequest, res: Response): void {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { journeyId, nodeId, correct } = req.body as {
    journeyId?: string;
    nodeId?: string;
    correct?: boolean;
  };

  if (!journeyId || !nodeId || typeof correct !== 'boolean') {
    res.status(400).json({ error: 'Missing required fields: journeyId, nodeId, correct' });
    return;
  }

  let record = userProgressStore.findByUserAndNode(userId, nodeId);
  if (!record) {
    record = userProgressStore.create({ userId, journeyId, nodeId });
  }

  const now = new Date();
  if (correct) {
    record.correctCount += 1;
    record.masteryLevel += 1;
  } else {
    record.incorrectCount += 1;
    record.masteryLevel = Math.max(0, record.masteryLevel - 1);
  }
  record.lastSeen = now;
  record.nextReview = now;

  const saved: UserProgress = userProgressStore.save(record);

  // Check journey completion and award Conqueror badge if applicable
  const trainableIds = getTrainableNodeIds(journeyId);
  const totalNodes = trainableIds.length;
  if (totalNodes > 0) {
    const progressRecords = userProgressStore.findAllByUserAndJourney(userId, journeyId);
    const progressByNode = new Map(progressRecords.map((p) => [p.nodeId, p]));
    let masteredNodes = 0;
    for (const nid of trainableIds) {
      const p = progressByNode.get(nid);
      if (p && p.masteryLevel >= MASTERY_THRESHOLD) masteredNodes += 1;
    }
    if (masteredNodes === totalNodes && !badgeStore.hasBadgeForJourney(userId, journeyId)) {
      badgeStore.create({ userId, journeyId, badgeType: 'Conqueror' });
    }
  }

  res.json(saved);
}

