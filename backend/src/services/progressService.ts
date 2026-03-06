// Progress service — user progress, journey progress, review queue
// TODO: integrate with DB

export async function getMyProgress(_userId: string): Promise<unknown> {
  return { journeys: [], totalXp: 0, streak: 0 };
}

export async function getJourneyProgress(_userId: string, _journeyId: string): Promise<unknown | null> {
  return null;
}

export async function getReviewQueue(_userId: string, _journeyId?: string): Promise<unknown[]> {
  return [];
}
