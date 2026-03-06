import { Request, Response } from 'express';
import { mockJourneys } from '../data/mockJourneys';
import { getTreeForJourney } from '../data/mockOpeningTree';

export function list(_req: Request, res: Response): void {
  res.json(mockJourneys);
}

export function getById(req: Request, res: Response): void {
  const { id } = req.params;
  const journey = mockJourneys.find((j) => j.id === id);
  if (!journey) {
    res.status(404).json({ error: 'Not found', message: `Journey ${id} not found` });
    return;
  }
  res.json(journey);
}

export function getTree(req: Request, res: Response): void {
  const { id } = req.params;
  const journey = mockJourneys.find((j) => j.id === id);
  if (!journey) {
    res.status(404).json({ error: 'Not found', message: `Journey ${id} not found` });
    return;
  }
  const tree = getTreeForJourney(id);
  res.json(tree);
}

export function getNodes(req: Request, res: Response): void {
  const { id } = req.params;
  // TODO: load tree nodes for journey (optionally with user progress)
  res.status(501).json({ error: 'Not implemented', message: `GET /journeys/${id}/nodes` });
}
