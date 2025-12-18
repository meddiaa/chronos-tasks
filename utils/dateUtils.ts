/**
 * Returns the current date as a YYYY-MM-DD string using local time
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

/**
 * Formats a date string into a human-readable label (e.g., "Today", "Yesterday", "Oct 24, 2023")
 */
export const formatDateLabel = (dateString: string): string => {
  const today = getTodayDateString();
  const date = new Date(dateString);
  const todayDate = new Date(today);
  
  // Calculate difference in days
  const diffTime = todayDate.getTime() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (dateString === today) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  
  // Format as "Mon, Oct 25"
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== todayDate.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Checks if a date string is in the past relative to today
 */
export const isDatePast = (dateString: string): boolean => {
  const today = getTodayDateString();
  return dateString < today;
};
