import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import journeysRoutes from './routes/journeys';
import trainingRoutes from './routes/training';
import progressRoutes from './routes/progress';
import badgesRoutes from './routes/badges';

function corsOrigin(origin: string | undefined, cb: (err: Error | null, origin?: string | false) => void): void {
  if (!origin) {
    cb(null, false);
    return;
  }
  const allowed = process.env.FRONTEND_URL;
  if (allowed && origin === allowed) {
    cb(null, origin);
    return;
  }
  if (origin === 'http://localhost:3000' || origin.startsWith('http://localhost:')) {
    cb(null, origin);
    return;
  }
  if (origin.endsWith('.vercel.app')) {
    cb(null, origin);
    return;
  }
  cb(null, false);
}

export function createApp(): Express {
  const app = express();

  app.use(cors({
    origin: corsOrigin,
    credentials: true,
  }));
  app.use(express.json());

  app.get('/', (_req: Request, res: Response) => {
    res.json({ service: 'prepopening-api', health: '/health', api: '/api' });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'prepopening-api' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/journeys', journeysRoutes);
  app.use('/api/training', trainingRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/badges', badgesRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
