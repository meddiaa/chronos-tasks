import React, { useState } from 'react';
import { TodoGroup, TaskStatus, DailyRating, Priority, Todo } from '../types';
import { TodoItem } from './TodoItem';
import { Calendar, ChevronDown, ChevronRight, BarChart3, Smile, Meh, Frown, StickyNote } from 'lucide-react';

interface TodoSectionProps {
  group: TodoGroup;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  onRate: (date: string, rating: DailyRating) => void;
  onPriorityChange: (id: string, newPriority: Priority) => void;
  onUpdateNote: (date: string, note: string) => void;
  onOpenNote: (id: string) => void;
  onFocus?: (todo: Todo) => void;
}

export const TodoSection: React.FC<TodoSectionProps> = ({ 
    group, onStatusChange, onEdit, onDelete, onRate, onPriorityChange, onUpdateNote, onOpenNote, onFocus 
}) => {
  const [isExpanded, setIsExpanded] = useState(group.isToday);
  const [localNote, setLocalNote] = useState(group.note || '');

  if (group.todos.length === 0) return null;

  const completedCount = group.todos.filter(t => t.status === 'COMPLETED').length;
  const totalCount = group.todos.length;
  const progress = (completedCount / totalCount) * 100;
  
  // Determine card border color based on completion status for past items
  const isAllDone = completedCount === totalCount;
  
  // Logic for past colors: Green if all done, Red if any missed
  const borderColor = group.isPast 
    ? (isAllDone ? 'border-green-500' : 'border-red-500')
    : 'border-[#102542]';

  const handleRatingClick = (e: React.MouseEvent, rating: DailyRating) => {
    e.stopPropagation();
    onRate(group.dateString, rating);
  };
  
  const handleNoteBlur = () => {
    if (localNote !== group.note) {
      onUpdateNote(group.dateString, localNote);
    }
  };

  return (
    <div className="mb-6 w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header / Card Summary */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white cursor-pointer shadow-sm
          border-l-[6px] transition-all duration-300 group
          ${borderColor}
          ${isExpanded ? 'mb-4 shadow-md' : 'hover:translate-x-1'}
        `}
      >
        <div className="flex items-center mb-3 sm:mb-0">
          {/* Icon Container: Used solid brand colors for better visibility */}
          <div className={`p-2 mr-4 shadow-sm ${group.isToday ? 'bg-[#F87060] text-[#102542]' : 'bg-[#102542] text-white'}`}>
            {group.isToday ? <Calendar className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight uppercase leading-none">
              {group.label}
            </h2>
            <div className="flex items-center mt-1 space-x-2">
              <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                {group.dateString}
              </span>
              <span className="text-xs text-gray-300">|</span>
              <span className={`text-xs font-bold tracking-wider ${isAllDone ? 'text-green-600' : 'text-[#F87060]'}`}>
                {Math.round(progress)}% SYNCED
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
            
            {/* Satisfaction Rating Controls */}
            <div className="flex items-center space-x-1 mr-4 border-r border-gray-200 pr-4">
              <button 
                onClick={(e) => handleRatingClick(e, 'GOOD')}
                className={`p-1.5 rounded-md transition-all ${group.rating === 'GOOD' ? 'bg-green-100 text-green-600 ring-2 ring-green-500' : 'text-gray-300 hover:text-green-500 hover:bg-green-50'}`}
                title="Productive Day"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => handleRatingClick(e, 'NEUTRAL')}
                className={`p-1.5 rounded-md transition-all ${group.rating === 'NEUTRAL' ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-500' : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'}`}
                title="Average Day"
              >
                <Meh className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => handleRatingClick(e, 'BAD')}
                className={`p-1.5 rounded-md transition-all ${group.rating === 'BAD' ? 'bg-red-100 text-red-600 ring-2 ring-red-500' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                title="Unproductive Day"
              >
                <Frown className="w-5 h-5" />
              </button>
            </div>

            {/* Mini Progress Bar Visual */}
            <div className="flex flex-col items-end mr-2 w-full sm:w-auto">
                <div className="text-sm font-bold text-gray-600 mb-1">
                    {completedCount} <span className="text-gray-400">/</span> {totalCount}
                </div>
                <div className="w-full sm:w-24 h-1.5 bg-gray-200">
                    <div 
                        className={`h-full transition-all duration-500 ${group.isPast && isAllDone ? 'bg-green-500' : 'bg-[#102542]'}`} 
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            
            <div className="text-gray-400 group-hover:text-[#102542] transition-colors ml-4">
                {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
            </div>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gray-200"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gray-200"></div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-2 pl-0 sm:pl-2 sm:border-l-2 sm:border-dotted sm:border-gray-300 sm:ml-[23px]">
          
          {/* Daily Note Input - Only visible if a rating has been selected */}
          {group.rating && (
            <div className="bg-slate-50 p-3 mb-4 rounded border border-gray-200 flex items-start space-x-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <StickyNote className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <textarea
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                onBlur={handleNoteBlur}
                placeholder="Log your daily data here..."
                className="w-full bg-transparent text-sm text-[#102542] placeholder-gray-400 focus:outline-none resize-none h-16 sm:h-auto font-['Rajdhani']"
                rows={2}
                />
            </div>
          )}

          {group.todos.map(todo => (
            <TodoItem 
              key={todo.id} 
              todo={todo} 
              isPast={group.isPast} 
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onPriorityChange={onPriorityChange}
              onOpenNote={onOpenNote}
              onFocus={onFocus}
            />
          ))}
        </div>
      )}
    </div>
  );
};