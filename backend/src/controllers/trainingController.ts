import { Request, Response } from 'express';

export function startSession(req: Request, res: Response): void {
  // TODO: create session, build review queue, return first drill
  res.status(501).json({ error: 'Not implemented', message: 'POST /training/sessions/start' });
}

export function submitAnswer(req: Request, res: Response): void {
  const { id } = req.params;
  // TODO: validate answer, update progress, return feedback + next drill
  res.status(501).json({ error: 'Not implemented', message: `POST /training/sessions/${id}/answer` });
}

export function completeSession(req: Request, res: Response): void {
  const { id } = req.params;
  // TODO: mark session complete, update XP/streak
  res.status(501).json({ error: 'Not implemented', message: `POST /training/sessions/${id}/complete` });
}

export function getSession(req: Request, res: Response): void {
  const { id } = req.params;
  // TODO: return session state and current position in queue
  res.status(501).json({ error: 'Not implemented', message: `GET /training/sessions/${id}` });
}
