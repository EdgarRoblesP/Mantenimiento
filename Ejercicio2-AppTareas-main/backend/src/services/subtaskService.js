import { AppError } from '../utils/AppError.js';
import * as subtasks from '../repositories/subtaskRepository.js';
import { requireTask, syncCompletionFromSubtasks } from './taskService.js';

const requireSubtask = async (subtaskId, userId) => {
  const subtask = await subtasks.findByIdForUser(subtaskId, userId);
  if (!subtask) {
    throw AppError.notFound('SUBTASK_NOT_FOUND', 'La subtarea no existe o no te pertenece.');
  }
  return subtask;
};

/**
 * Cada operación devuelve la tarea padre completa: el frontend refresca la
 * barra de progreso (NRF-10) y el estado automático (NRF-09) con una sola
 * respuesta, sin volver a pedir la lista.
 */

/** NRF-07: la subtarea solo guarda nombre. */
export const create = async (taskId, userId, title) => {
  await requireTask(taskId, userId);
  await subtasks.createSubtask(taskId, title);
  return syncCompletionFromSubtasks(taskId, userId);
};

export const updateTitle = async (subtaskId, userId, title) => {
  const subtask = await requireSubtask(subtaskId, userId);
  await subtasks.updateTitle(subtaskId, title);
  return syncCompletionFromSubtasks(subtask.taskId, userId);
};

/** NRF-08 sobre subtareas; dispara NRF-09 en la tarea padre. */
export const setCompleted = async (subtaskId, userId, completed) => {
  const subtask = await requireSubtask(subtaskId, userId);
  await subtasks.setCompleted(subtaskId, completed);
  return syncCompletionFromSubtasks(subtask.taskId, userId);
};

export const remove = async (subtaskId, userId) => {
  const subtask = await requireSubtask(subtaskId, userId);
  await subtasks.deleteSubtask(subtaskId);
  return syncCompletionFromSubtasks(subtask.taskId, userId);
};
