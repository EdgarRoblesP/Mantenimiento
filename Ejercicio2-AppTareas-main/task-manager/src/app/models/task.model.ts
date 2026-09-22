export type TaskFilterType = 'all' | 'pending' | 'completed';

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}
