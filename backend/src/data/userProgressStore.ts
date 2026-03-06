import { UserProgress } from '../models/userProgress';

const progressRecords: UserProgress[] = [];
let idCounter = 1;

export function findByUserAndNode(userId: string, nodeId: string): UserProgress | undefined {
  return progressRecords.find((p) => p.userId === userId && p.nodeId === nodeId);
}

export function findAllByUserAndJourney(userId: string, journeyId: string): UserProgress[] {
  return progressRecords.filter((p) => p.userId === userId && p.journeyId === journeyId);
}

export function create(data: {
  userId: string;
  journeyId: string;
  nodeId: string;
}): UserProgress {
  const now = new Date();
  const record: UserProgress = {
    id: String(idCounter++),
    userId: data.userId,
    journeyId: data.journeyId,
    nodeId: data.nodeId,
    correctCount: 0,
    incorrectCount: 0,
    masteryLevel: 0,
    lastSeen: now,
    nextReview: null,
  };
  progressRecords.push(record);
  return record;
}

export function save(record: UserProgress): UserProgress {
  const index = progressRecords.findIndex((p) => p.id === record.id);
  if (index === -1) {
    progressRecords.push(record);
  } else {
    progressRecords[index] = record;
  }
  return record;
}

