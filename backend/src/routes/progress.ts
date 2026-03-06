import { Router } from 'express';
import * as progressController from '../controllers/progressController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, progressController.getMyProgress);
router.get('/journey/:journeyId', requireAuth, progressController.getJourneyProgress);
router.get('/review-queue', requireAuth, progressController.getReviewQueue);
router.post('/update', requireAuth, progressController.updateProgress);

export default router;
