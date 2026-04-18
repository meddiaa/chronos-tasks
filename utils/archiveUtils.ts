import { Todo } from '../types';

const toLocalDateString = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

/**
 * Archive System: Manage old tasks to improve performance
 */

export const archiveUtils = {
  /**
   * Get tasks older than specified days
   */
  getOldTasks: (todos: Todo[], daysOld: number = 30): Todo[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffString = toLocalDateString(cutoffDate);

    return todos.filter(todo => todo.dateString < cutoffString);
  },

  /**
   * Remove old tasks from main list
   */
  removeOldTasks: (todos: Todo[], daysOld: number = 30): Todo[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffString = toLocalDateString(cutoffDate);

    return todos.filter(todo => todo.dateString >= cutoffString);
  },

  /**
   * Download archived tasks as JSON file
   */
  downloadArchive: (archivedTasks: Todo[], username: string) => {
    const dataStr = JSON.stringify(archivedTasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `chronos-archive-${username}-${toLocalDateString(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Save archived tasks to localStorage for backup
   */
  saveArchiveToStorage: (username: string, archivedTasks: Todo[]) => {
    const key = `chronos_${username.toLowerCase().trim()}_archive`;
    localStorage.setItem(key, JSON.stringify(archivedTasks));
  },

  /**
   * Load archived tasks from localStorage
   */
  loadArchiveFromStorage: (username: string): Todo[] => {
    const key = `chronos_${username.toLowerCase().trim()}_archive`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  /**
   * Get archive statistics
   */
  getArchiveStats: (archivedTasks: Todo[]): { total: number; completed: number; percentage: number } => {
    const total = archivedTasks.length;
    const completed = archivedTasks.filter(t => t.status === 'COMPLETED').length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, percentage };
  }
};
