import { UserBadge } from '../models/userBadge';

const badges: UserBadge[] = [];
let idCounter = 1;

export function findByUser(userId: string): UserBadge[] {
  return badges.filter((b) => b.userId === userId);
}

export function hasBadgeForJourney(userId: string, journeyId: string): boolean {
  return badges.some((b) => b.userId === userId && b.journeyId === journeyId);
}

export function create(data: {
  userId: string;
  journeyId: string;
  badgeType: string;
}): UserBadge {
  const record: UserBadge = {
    id: String(idCounter++),
    userId: data.userId,
    journeyId: data.journeyId,
    badgeType: data.badgeType,
    earnedAt: new Date(),
  };
  badges.push(record);
  return record;
}
