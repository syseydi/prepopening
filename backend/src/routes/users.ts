import { Router } from 'express';
import * as usersController from '../controllers/usersController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, usersController.getMe);
router.get('/:id', requireAuth, usersController.getById);
router.patch('/me', requireAuth, usersController.updateMe);

export default router;
