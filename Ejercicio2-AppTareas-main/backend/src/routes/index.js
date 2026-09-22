import { Router } from 'express';
import authRoutes from './authRoutes.js';
import taskRoutes from './taskRoutes.js';
import subtaskRoutes from './subtaskRoutes.js';
import { checkConnection } from '../config/db.js';
import { mailerStatus } from '../services/mailer.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/** Sonda para Railway y para diagnosticar la conexión a MySQL. */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await checkConnection();
    res.json({ status: 'ok', database: 'up', mail: mailerStatus() });
  })
);

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/subtasks', subtaskRoutes);

export default router;
