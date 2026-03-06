export type BadgeType =
  | 'conqueror_l1'
  | 'conqueror_l2'
  | 'conqueror_l3'
  | 'streak_7'
  | 'streak_30'
  | 'accuracy_sharp'
  | 'social_challenger';

export interface Badge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  journey_id: string | null;
  metadata: Record<string, unknown>;
  awarded_at: Date;
}
