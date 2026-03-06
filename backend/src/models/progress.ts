export type NodeState = 'unseen' | 'seen' | 'learned' | 'mastered' | 'fading';

export interface Progress {
  id: string;
  user_id: string;
  node_id: string;
  state: NodeState;
  times_correct: number;
  times_incorrect: number;
  consecutive_correct: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: Date;
  last_reviewed_at: Date | null;
  updated_at: Date;
}
