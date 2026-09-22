import { execute, query, queryOne } from '../config/db.js';

const mapSubtask = (row) => ({
  id: row.id,
  taskId: row.task_id,
  title: row.title,
  completed: row.completed === 1,
  completedAt: row.completed_at,
  createdAt: row.created_at
});

export const findByTaskIds = async (taskIds) => {
  if (taskIds.length === 0) {
    return [];
  }
  const placeholders = taskIds.map(() => '?').join(', ');
  const rows = await query(
    `SELECT * FROM subtasks
     WHERE task_id IN (${placeholders})
     ORDER BY completed ASC, id ASC`,
    taskIds
  );
  return rows.map(mapSubtask);
};

/** Comprueba la propiedad recorriendo la tarea padre. */
export const findByIdForUser = async (subtaskId, userId) => {
  const row = await queryOne(
    `SELECT s.* FROM subtasks s
     INNER JOIN tasks t ON t.id = s.task_id
     WHERE s.id = ? AND t.user_id = ?
     LIMIT 1`,
    [subtaskId, userId]
  );
  return row ? mapSubtask(row) : null;
};

export const createSubtask = async (taskId, title) => {
  const result = await execute('INSERT INTO subtasks (task_id, title) VALUES (?, ?)', [
    taskId,
    title
  ]);
  const row = await queryOne('SELECT * FROM subtasks WHERE id = ?', [result.insertId]);
  return mapSubtask(row);
};

export const updateTitle = (subtaskId, title) =>
  execute('UPDATE subtasks SET title = ? WHERE id = ?', [title, subtaskId]);

export const setCompleted = (subtaskId, completed) =>
  execute(
    `UPDATE subtasks
     SET completed = ?, completed_at = ${completed ? 'NOW()' : 'NULL'}
     WHERE id = ?`,
    [completed ? 1 : 0, subtaskId]
  );

export const deleteSubtask = (subtaskId) =>
  execute('DELETE FROM subtasks WHERE id = ?', [subtaskId]);

/** Base de NRF-09: cuántas subtareas hay y cuántas están completadas. */
export const countByTask = async (taskId) => {
  const row = await queryOne(
    `SELECT COUNT(*) AS total, COALESCE(SUM(completed), 0) AS completed
     FROM subtasks WHERE task_id = ?`,
    [taskId]
  );
  return { total: Number(row.total), completed: Number(row.completed) };
};
