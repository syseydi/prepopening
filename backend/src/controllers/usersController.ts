import { Request, Response } from 'express';

export function getMe(req: Request, res: Response): void {
  // TODO: load user + profile from DB using req.userId (set by auth middleware)
  res.status(501).json({ error: 'Not implemented', message: 'GET /users/me' });
}

export function getById(req: Request, res: Response): void {
  const { id } = req.params;
  // TODO: load user by id (public profile only)
  res.status(501).json({ error: 'Not implemented', message: `GET /users/${id}` });
}

export function updateMe(req: Request, res: Response): void {
  // TODO: update profile for req.userId
  res.status(501).json({ error: 'Not implemented', message: 'PATCH /users/me' });
}
