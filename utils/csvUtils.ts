import { Todo, TaskStatus } from '../types';
import { isDatePast } from './dateUtils';

export const exportToCSV = (todos: Todo[]) => {
  // Define headers
  const headers = ['Date', 'Task', 'Priority', 'Status', 'State Label'];

  // Sort todos by date descending
  const sortedTodos = [...todos].sort((a, b) => b.dateString.localeCompare(a.dateString));

  // Map data to rows
  const rows = sortedTodos.map(todo => {
    let statusLabel = 'UNKNOWN';
    const isPast = isDatePast(todo.dateString);

    // Determine export label based on logic
    if (todo.status === 'COMPLETED') {
      statusLabel = 'DONE';
    } else if (isPast) {
      statusLabel = 'NOT DONE (MISSED)';
    } else if (todo.status === 'IN_PROGRESS') {
      statusLabel = 'DOING IT RIGHT NOW';
    } else {
      statusLabel = 'PENDING';
    }

    // Escape quotes in text
    const safeText = `"${todo.text.replace(/"/g, '""')}"`;

    return [
      todo.dateString,
      safeText,
      todo.priority || 'LOW',
      todo.status,
      statusLabel
    ].join(',');
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\n');

  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `chronos_tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};