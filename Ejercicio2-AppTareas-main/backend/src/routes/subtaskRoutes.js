import { Router } from 'express';
import * as subtaskController from '../controllers/subtaskController.js';
import { requireAuth } from '../middleware/auth.js';
import { idParamSchema, validateBody, validateParams } from '../middleware/validate.js';
import { completedSchema, subtaskSchema } from './taskRoutes.js';

const router = Router();

router.use(requireAuth);

// La creación vive en /api/tasks/:taskId/subtasks; aquí quedan las operaciones
// sobre una subtarea concreta, que ya no necesitan el id de la tarea.
router.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(subtaskSchema),
  subtaskController.update
);
router.patch(
  '/:id/completed',
  validateParams(idParamSchema),
  validateBody(completedSchema),
  subtaskController.setCompleted
);
router.delete('/:id', validateParams(idParamSchema), subtaskController.remove);

export default router;
