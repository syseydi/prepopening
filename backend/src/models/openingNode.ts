export type NodeType = 'line' | 'trap' | 'puzzle' | 'transition';

export interface OpeningNode {
  id: string;
  journeyId: string;
  parentId: string | null;
  moveSAN: string;
  fen: string;
  depth: number;
  isRequired: boolean;
  nodeType: NodeType;
  explanation: string | null;
  difficulty: number;
}
