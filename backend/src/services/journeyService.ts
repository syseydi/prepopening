// Journey service — list journeys, get journey, get nodes
// TODO: integrate with DB (pg client or ORM)

export async function listJourneys(_filters?: { color?: string; family?: string }): Promise<unknown[]> {
  return [];
}

export async function getJourneyById(_id: string): Promise<unknown | null> {
  return null;
}

export async function getNodesByJourneyId(_journeyId: string, _userId?: string): Promise<unknown[]> {
  return [];
}
