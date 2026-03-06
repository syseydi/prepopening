// Training service — start session, submit answer, complete session
// TODO: integrate with DB and learning system (queue, SM-2, state machine)

export async function startSession(_userId: string, _journeyId: string): Promise<unknown | null> {
  return null;
}

export async function submitAnswer(
  _sessionId: string,
  _userId: string,
  _payload: { drillItemId: string; nodeId: string; playedSan: string; attemptNumber: number; timeMs?: number; hintUsed?: boolean }
): Promise<unknown | null> {
  return null;
}

export async function completeSession(_sessionId: string, _userId: string): Promise<unknown | null> {
  return null;
}
