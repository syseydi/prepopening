import { Router } from 'express';
import * as badgesController from '../controllers/badgesController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/my', requireAuth, badgesController.getMyBadges);

export default router;
