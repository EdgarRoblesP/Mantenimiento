export type TaskFilterType = 'all' | 'pending' | 'completed';

/** NRF-07: la subtarea solo guarda nombre y estado. */
export interface Subtask {
  id: number;
  taskId: number;
  title: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

/** NRF-06: nombre, fecha y hora. `progress` cubre NRF-10. */
export interface Task {
  id: number;
  title: string;
  dueDate: string;
  dueTime: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  subtaskTotal: number;
  subtaskCompleted: number;
  progress: number;
  subtasks: Subtask[];
}

export interface TaskPayload {
  title: string;
  dueDate: string;
  dueTime: string;
}
