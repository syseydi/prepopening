export type ColorSide = 'white' | 'black';

export interface Journey {
  id: string;
  slug: string;
  name: string;
  color_side: ColorSide;
  eco_codes: string[];
  description: string | null;
  difficulty_rating: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Node {
  id: string;
  journey_id: string;
  parent_id: string | null;
  fen: string;
  san: string;
  move_number: number;
  color_to_move: ColorSide;
  depth_level: 1 | 2 | 3;
  is_required: boolean;
  difficulty: number;
  annotation: string | null;
  sort_order: number;
  created_at: Date;
}
