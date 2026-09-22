import { execute, query, queryOne } from '../config/db.js';

/**
 * Forma pública de una tarea. El progreso (NRF-10) se calcula siempre a partir
 * de las subtareas, por eso todas las consultas hacen LEFT JOIN al agregado.
 */
const mapTask = (row) => ({
  id: row.id,
  title: row.title,
  dueDate: row.due_date,
  dueTime: typeof row.due_time === 'string' ? row.due_time.slice(0, 5) : row.due_time,
  completed: row.completed === 1,
  completedAt: row.completed_at,
  createdAt: row.created_at,
  subtaskTotal: Number(row.subtask_total ?? 0),
  subtaskCompleted: Number(row.subtask_completed ?? 0),
  progress: Number(row.progress ?? 0),
  subtasks: []
});

const SELECT_TASK = `
  SELECT t.*,
         COUNT(s.id)                   AS subtask_total,
         COALESCE(SUM(s.completed), 0) AS subtask_completed,
         CASE
           WHEN COUNT(s.id) = 0 THEN IF(t.completed = 1, 100, 0)
           ELSE ROUND(SUM(s.completed) * 100 / COUNT(s.id))
         END                           AS progress
  FROM tasks t
  LEFT JOIN subtasks s ON s.task_id = t.id`;

export const findAllByUser = async (userId) => {
  const rows = await query(
    `${SELECT_TASK}
     WHERE t.user_id = ?
     GROUP BY t.id
     ORDER BY t.completed ASC, t.due_date ASC, t.due_time ASC, t.id DESC`,
    [userId]
  );
  return rows.map(mapTask);
};

/** Devuelve la tarea solo si pertenece al usuario: evita accesos cruzados. */
export const findByIdForUser = async (taskId, userId) => {
  const row = await queryOne(
    `${SELECT_TASK} WHERE t.id = ? AND t.user_id = ? GROUP BY t.id`,
    [taskId, userId]
  );
  return row ? mapTask(row) : null;
};

export const createTask = async (userId, { title, dueDate, dueTime }) => {
  const result = await execute(
    'INSERT INTO tasks (user_id, title, due_date, due_time) VALUES (?, ?, ?, ?)',
    [userId, title, dueDate, dueTime]
  );
  return findByIdForUser(result.insertId, userId);
};

export const updateTask = (taskId, userId, { title, dueDate, dueTime }) =>
  execute(
    'UPDATE tasks SET title = ?, due_date = ?, due_time = ? WHERE id = ? AND user_id = ?',
    [title, dueDate, dueTime, taskId, userId]
  );

export const setCompleted = (taskId, userId, completed) =>
  execute(
    `UPDATE tasks
     SET completed = ?, completed_at = ${completed ? 'NOW()' : 'NULL'}
     WHERE id = ? AND user_id = ?`,
    [completed ? 1 : 0, taskId, userId]
  );

export const deleteTask = (taskId, userId) =>
  execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
