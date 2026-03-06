import { Router } from 'express';
import * as trainingController from '../controllers/trainingController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/sessions/start', requireAuth, trainingController.startSession);
router.post('/sessions/:id/answer', requireAuth, trainingController.submitAnswer);
router.post('/sessions/:id/complete', requireAuth, trainingController.completeSession);
router.get('/sessions/:id', requireAuth, trainingController.getSession);

export default router;
