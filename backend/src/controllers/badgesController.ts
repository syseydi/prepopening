import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as badgeStore from '../data/badgeStore';
import { mockJourneys } from '../data/mockJourneys';

export function getMyBadges(req: AuthRequest, res: Response): void {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const userBadges = badgeStore.findByUser(userId);
  const journeyById = new Map(mockJourneys.map((j) => [j.id, j]));
  const result = userBadges.map((b) => ({
    id: b.id,
    userId: b.userId,
    journeyId: b.journeyId,
    journeyName: journeyById.get(b.journeyId)?.name ?? 'Unknown',
    badgeType: b.badgeType,
    earnedAt: b.earnedAt,
  }));
  res.json(result);
}
