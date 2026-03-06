import { Router } from 'express';
import * as journeysController from '../controllers/journeysController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', journeysController.list);
router.get('/:id/tree', journeysController.getTree);
router.get('/:id/nodes', requireAuth, journeysController.getNodes);
router.get('/:id', journeysController.getById);

export default router;
