import { AppError } from '../utils/AppError.js';
import * as tasks from '../repositories/taskRepository.js';
import * as subtasks from '../repositories/subtaskRepository.js';

const notFound = () =>
  AppError.notFound('TASK_NOT_FOUND', 'La tarea no existe o no te pertenece.');

/** Carga la tarea garantizando que pertenece al usuario. */
const requireTask = async (taskId, userId) => {
  const task = await tasks.findByIdForUser(taskId, userId);
  if (!task) {
    throw notFound();
  }
  return task;
};

/**
 * NRF-09: al completarse todas las subtareas la tarea se marca completada
 * automáticamente; si alguna vuelve a pendiente, la tarea se reabre.
 * Devuelve la tarea ya recargada con su progreso (NRF-10).
 */
export const syncCompletionFromSubtasks = async (taskId, userId) => {
  const { total, completed } = await subtasks.countByTask(taskId);
  if (total > 0) {
    const shouldBeCompleted = completed === total;
    const task = await tasks.findByIdForUser(taskId, userId);
    if (task && task.completed !== shouldBeCompleted) {
      await tasks.setCompleted(taskId, userId, shouldBeCompleted);
    }
  }
  return getById(taskId, userId);
};

/** Une cada tarea con sus subtareas en una sola consulta adicional. */
export const listByUser = async (userId) => {
  const list = await tasks.findAllByUser(userId);
  const children = await subtasks.findByTaskIds(list.map((task) => task.id));

  const byTask = new Map(list.map((task) => [String(task.id), task]));
  for (const subtask of children) {
    byTask.get(String(subtask.taskId))?.subtasks.push(subtask);
  }
  return list;
};

export const getById = async (taskId, userId) => {
  const task = await requireTask(taskId, userId);
  task.subtasks = await subtasks.findByTaskIds([task.id]);
  return task;
};

/** NRF-06: crea la tarea con nombre, fecha y hora. */
export const create = async (userId, payload) => {
  const task = await tasks.createTask(userId, payload);
  return getById(task.id, userId);
};

export const update = async (taskId, userId, payload) => {
  await requireTask(taskId, userId);
  await tasks.updateTask(taskId, userId, payload);
  return getById(taskId, userId);
};

/**
 * NRF-08: marca la tarea como completada o pendiente.
 * El cambio se propaga a las subtareas para que el progreso (NRF-10) y la
 * regla de NRF-09 no queden en un estado contradictorio.
 */
export const setCompleted = async (taskId, userId, completed) => {
  const task = await requireTask(taskId, userId);

  await tasks.setCompleted(taskId, userId, completed);

  const children = await subtasks.findByTaskIds([task.id]);
  await Promise.all(
    children
      .filter((subtask) => subtask.completed !== completed)
      .map((subtask) => subtasks.setCompleted(subtask.id, completed))
  );

  return getById(taskId, userId);
};

export const remove = async (taskId, userId) => {
  await requireTask(taskId, userId);
  // Las subtareas caen por ON DELETE CASCADE.
  await tasks.deleteTask(taskId, userId);
};

export { requireTask };
