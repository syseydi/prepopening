export interface JourneyResponse {
  id: string;
  name: string;
  description: string;
  side: 'white' | 'black';
  difficulty: number;
  estimatedDepth: number;
}

export const mockJourneys: JourneyResponse[] = [
  {
    id: '1',
    name: 'Sicilian Defense',
    description: 'Sharp and dynamic defense for Black after 1.e4. Leads to complex positions with counterattacking chances.',
    side: 'black',
    difficulty: 4,
    estimatedDepth: 25,
  },
  {
    id: '2',
    name: 'French Defense',
    description: 'Solid defense with 1...e6. Black aims for a strong pawn structure and piece activity in the middlegame.',
    side: 'black',
    difficulty: 3,
    estimatedDepth: 20,
  },
  {
    id: '3',
    name: 'Caro-Kann',
    description: 'A solid and reliable defense. Black develops naturally and avoids many sharp tactical lines.',
    side: 'black',
    difficulty: 2,
    estimatedDepth: 18,
  },
  {
    id: '4',
    name: 'Ruy Lopez',
    description: 'The Spanish Opening. White develops with 3.Bb5, targeting the knight and controlling the center.',
    side: 'white',
    difficulty: 4,
    estimatedDepth: 30,
  },
  {
    id: '5',
    name: 'Italian Game',
    description: 'Classical 1.e4 e5 2.Nf3 Nc6 3.Bc4. Direct development and rapid castling with rich tactical ideas.',
    side: 'white',
    difficulty: 3,
    estimatedDepth: 22,
  },
  {
    id: '6',
    name: "Queen's Gambit",
    description: '1.d4 d5 2.c4. White offers a pawn to control the center. Leads to strategic and positional play.',
    side: 'white',
    difficulty: 4,
    estimatedDepth: 28,
  },
];
