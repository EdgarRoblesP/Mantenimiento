import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';
import * as subtaskController from '../controllers/subtaskController.js';
import { requireAuth } from '../middleware/auth.js';
import {
  idParamSchema,
  taskIdParamSchema,
  titleSchema,
  validateBody,
  validateParams,
  z
} from '../middleware/validate.js';

const router = Router();

// Todo lo que cuelga de /api/tasks exige sesión activa.
router.use(requireAuth);

/** NRF-06: nombre, fecha y hora. */
const taskSchema = z.object({
  title: titleSchema('Escribe un nombre para la tarea.'),
  dueDate: z
    .string({ required_error: 'Elige una fecha.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD.'),
  dueTime: z
    .string({ required_error: 'Elige una hora.' })
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'La hora debe tener el formato HH:MM.')
    // MySQL espera TIME completo.
    .transform((value) => (value.length === 5 ? `${value}:00` : value))
});

const completedSchema = z.object({
  completed: z.boolean({ required_error: 'Indica si está completada.' })
});

/** NRF-07: la subtarea solo lleva nombre. */
const subtaskSchema = z.object({
  title: titleSchema('La subtarea necesita un nombre.')
});

router.get('/', taskController.list);
router.post('/', validateBody(taskSchema), taskController.create);

router.get('/:id', validateParams(idParamSchema), taskController.getOne);
router.patch('/:id', validateParams(idParamSchema), validateBody(taskSchema), taskController.update);
router.patch(
  '/:id/completed',
  validateParams(idParamSchema),
  validateBody(completedSchema),
  taskController.setCompleted
);
router.delete('/:id', validateParams(idParamSchema), taskController.remove);

// Subtareas anidadas bajo su tarea.
router.post(
  '/:taskId/subtasks',
  validateParams(taskIdParamSchema),
  validateBody(subtaskSchema),
  subtaskController.create
);

export { subtaskSchema, completedSchema };
export default router;
