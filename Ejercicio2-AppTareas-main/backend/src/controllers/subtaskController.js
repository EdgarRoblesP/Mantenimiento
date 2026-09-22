import * as subtaskService from '../services/subtaskService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Todas las respuestas devuelven la tarea padre completa: el frontend actualiza
 * la barra de progreso (NRF-10) y el completado automático (NRF-09) sin pedir
 * de nuevo la lista.
 */

/** NRF-07 */
export const create = asyncHandler(async (req, res) => {
  const task = await subtaskService.create(req.params.taskId, req.user.id, req.body.title);
  res.status(201).json({ task });
});

export const update = asyncHandler(async (req, res) => {
  const task = await subtaskService.updateTitle(req.params.id, req.user.id, req.body.title);
  res.json({ task });
});

/** NRF-08, dispara NRF-09 */
export const setCompleted = asyncHandler(async (req, res) => {
  const task = await subtaskService.setCompleted(req.params.id, req.user.id, req.body.completed);
  res.json({ task });
});

export const remove = asyncHandler(async (req, res) => {
  const task = await subtaskService.remove(req.params.id, req.user.id);
  res.json({ task });
});
