import { Todo, DailyRating, DayMetadata } from '../types';
import { isDatePast } from './dateUtils';

// 1. Pie Chart Data: Status Distribution
export const getStatusDistribution = (todos: Todo[]) => {
  let completed = 0;
  let active = 0; // Pending + In Progress
  let missed = 0;

  todos.forEach(todo => {
    if (todo.status === 'COMPLETED') {
      completed++;
    } else if (isDatePast(todo.dateString)) {
      missed++;
    } else {
      active++;
    }
  });

  return [
    { name: 'Completed', value: completed, fill: '#22c55e' }, // Green
    { name: 'Active', value: active, fill: '#22d3ee' },    // Cyan
    { name: 'Missed', value: missed, fill: '#ef4444' },    // Red
  ];
};

// 2. Bar Chart Data: Last 7 Days Performance
export const getLast7DaysPerformance = (todos: Todo[]) => {
  const data = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayTodos = todos.filter(t => t.dateString === dateStr);
    const completed = dayTodos.filter(t => t.status === 'COMPLETED').length;
    const total = dayTodos.length;
    const notCompleted = total - completed;

    data.push({
      date: dayLabel,
      fullDate: dateStr,
      completed,
      missed: notCompleted, // For stacking
      total
    });
  }
  return data;
};

// 3. Area Chart: Cumulative tasks over time (Volume)
export const getTaskVolumeTrend = (todos: Todo[]) => {
    const counts: Record<string, number> = {};
    todos.forEach(t => {
        counts[t.dateString] = (counts[t.dateString] || 0) + 1;
    });
    
    // Sort dates
    const sortedDates = Object.keys(counts).sort();
    // Take last 14 active days max to keep chart readable
    const slicedDates = sortedDates.slice(-14);

    return slicedDates.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: counts[date]
    }));
};

// 4. Radar/Bar Chart: Day of Week Efficiency
export const getDayEfficiency = (todos: Todo[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const stats = days.map(day => ({ day, total: 0, completed: 0 }));

    todos.forEach(t => {
        const d = new Date(t.dateString);
        // Correct for timezone offset issues if relying on UTC string
        // We act as if dateString YYYY-MM-DD is local
        const localDate = new Date(t.dateString + 'T12:00:00'); 
        const dayIndex = localDate.getDay();
        
        stats[dayIndex].total++;
        if (t.status === 'COMPLETED') {
            stats[dayIndex].completed++;
        }
    });

    return stats.map(s => ({
        subject: s.day,
        efficiency: s.total === 0 ? 0 : Math.round((s.completed / s.total) * 100),
        fullMark: 100
    }));
};

// 5. Bar Chart: Satisfaction Trends
export const getSatisfactionTrends = (metadata: Record<string, DayMetadata>) => {
  let good = 0;
  let neutral = 0;
  let bad = 0;

  Object.values(metadata).forEach(data => {
    if (data.rating === 'GOOD') good++;
    if (data.rating === 'NEUTRAL') neutral++;
    if (data.rating === 'BAD') bad++;
  });

  return [
    { name: 'Productive', count: good, fill: '#22c55e', icon: 'Smile' },
    { name: 'Average', count: neutral, fill: '#eab308', icon: 'Meh' },
    { name: 'Struggle', count: bad, fill: '#ef4444', icon: 'Frown' },
  ];
};

// 6. Bar Chart: Priority Breakdown (Created vs Completed)
export const getPriorityStats = (todos: Todo[]) => {
    const stats = {
        HIGH: { total: 0, completed: 0 },
        MEDIUM: { total: 0, completed: 0 },
        LOW: { total: 0, completed: 0 }
    };

    todos.forEach(t => {
        const p = t.priority || 'LOW';
        if (stats[p]) {
            stats[p].total++;
            if (t.status === 'COMPLETED') {
                stats[p].completed++;
            }
        }
    });

    return [
        { 
            name: 'HIGH', 
            total: stats.HIGH.total, 
            completed: stats.HIGH.completed,
            completionRate: stats.HIGH.total === 0 ? 0 : Math.round((stats.HIGH.completed / stats.HIGH.total) * 100),
            fill: '#f43f5e' 
        },
        { 
            name: 'MED', 
            total: stats.MEDIUM.total, 
            completed: stats.MEDIUM.completed,
            completionRate: stats.MEDIUM.total === 0 ? 0 : Math.round((stats.MEDIUM.completed / stats.MEDIUM.total) * 100),
            fill: '#f59e0b' 
        },
        { 
            name: 'LOW', 
            total: stats.LOW.total, 
            completed: stats.LOW.completed,
            completionRate: stats.LOW.total === 0 ? 0 : Math.round((stats.LOW.completed / stats.LOW.total) * 100),
            fill: '#94a3b8' 
        }
    ];
};

// 7. Calculate Streak
export const calculateStreak = (metadata: Record<string, DayMetadata>) => {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // We consider a day "active" if it has a rating
        if (metadata[dateStr] && metadata[dateStr].rating) {
            streak++;
        } else if (i === 0) {
            // If today is not rated yet, don't break the streak, just don't count it yet
            // (Unless we find a gap yesterday)
        } else {
            // Break chain
            break;
        }
        
        // Go back one day
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
};