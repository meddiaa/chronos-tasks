export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type DailyRating = 'GOOD' | 'NEUTRAL' | 'BAD';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Todo {
  id: string;
  text: string;
  status: TaskStatus;
  priority: Priority;
  // Legacy support for migration (optional)
  isCompleted?: boolean; 
  createdAt: number; // Unix timestamp
  dateString: string; // YYYY-MM-DD format for easy grouping
  note?: string; // Individual task note
}

export interface DayMetadata {
  rating?: DailyRating;
  note?: string;
}

export type TodoGroup = {
  dateString: string;
  todos: Todo[];
  label: string;
  isPast: boolean;
  isToday: boolean;
  rating?: DailyRating;
  note?: string;
};