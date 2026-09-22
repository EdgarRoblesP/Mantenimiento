import * as taskService from '../services/taskService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const list = asyncHandler(async (req, res) => {
  const tasks = await taskService.listByUser(req.user.id);
  res.json({ tasks });
});

export const getOne = asyncHandler(async (req, res) => {
  const task = await taskService.getById(req.params.id, req.user.id);
  res.json({ task });
});

/** NRF-06 */
export const create = asyncHandler(async (req, res) => {
  const task = await taskService.create(req.user.id, req.body);
  res.status(201).json({ task });
});

export const update = asyncHandler(async (req, res) => {
  const task = await taskService.update(req.params.id, req.user.id, req.body);
  res.json({ task });
});

/** NRF-08 */
export const setCompleted = asyncHandler(async (req, res) => {
  const task = await taskService.setCompleted(req.params.id, req.user.id, req.body.completed);
  res.json({ task });
});

export const remove = asyncHandler(async (req, res) => {
  await taskService.remove(req.params.id, req.user.id);
  res.status(204).send();
});
