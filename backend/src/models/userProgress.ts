export interface UserProgress {
  id: string;
  userId: string;
  journeyId: string;
  nodeId: string;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: number;
  lastSeen: Date;
  nextReview: Date | null;
}

