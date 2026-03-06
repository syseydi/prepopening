export type DrillType = 'guided' | 'recall' | 'blinded' | 'sparring' | 'error' | 'speed';

export interface Drill {
  id: string;
  node_id: string;
  drill_type: DrillType;
  prompt_fen: string;
  correct_san: string;
  distractor_sans: string[];
  hint_text: string | null;
  explanation: string | null;
  sort_order: number;
  created_at: Date;
}
