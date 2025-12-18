import React, { useState, useEffect, useRef } from 'react';
import { Check, Trash2, X, Play, Circle, AlertCircle, AlertTriangle, Minus, FileText } from 'lucide-react';
import { Todo, TaskStatus, Priority } from '../types';

interface TodoItemProps {
  todo: Todo;
  isPast: boolean;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, newPriority: Priority) => void;
  onOpenNote: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, isPast, onStatusChange, onEdit, onDelete, onPriorityChange, onOpenNote }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleCycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    if (isPast) {
      // For past dates: toggle between COMPLETED (done) and any non-completed state
      onStatusChange(todo.id, todo.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED');
    } else {
      // For today/future: cycle through PENDING -> IN_PROGRESS -> COMPLETED -> PENDING
      if (todo.status === 'PENDING') onStatusChange(todo.id, 'IN_PROGRESS');
      else if (todo.status === 'IN_PROGRESS') onStatusChange(todo.id, 'COMPLETED');
      else onStatusChange(todo.id, 'PENDING');
    }
  };

  const handleCyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    let next: Priority = 'LOW';
    if (todo.priority === 'LOW') next = 'MEDIUM';
    else if (todo.priority === 'MEDIUM') next = 'HIGH';
    else next = 'LOW';
    
    onPriorityChange(todo.id, next);
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEdit(todo.id, editText.trim());
    } else {
      setEditText(todo.text); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  // Priority Visuals
  const getPriorityIcon = () => {
    switch (todo.priority) {
      case 'HIGH': return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" />;
      case 'MEDIUM': return <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />;
      case 'LOW': default: return <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />;
    }
  };
  
  const getPriorityLabel = () => {
     switch(todo.priority) {
         case 'HIGH': return 'HIGH';
         case 'MEDIUM': return 'MED';
         case 'LOW': return 'LOW';
         default: return '';
     }
  }

  let containerClasses = "group relative flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white shadow-sm border-l-4 transition-all duration-200 hover:shadow-md mb-2";
  let textClasses = "flex-1 text-base sm:text-lg font-medium truncate px-2 sm:px-4 transition-colors duration-200 cursor-text select-none sm:select-auto";
  let statusButtonClasses = "flex-shrink-0 w-8 h-8 border-2 flex items-center justify-center mr-2 transition-all duration-300 rounded-full cursor-pointer";
  let icon = null;

  // Visual Logic
  if (isPast) {
    if (todo.status === 'COMPLETED') {
      // Past + Done -> Green
      containerClasses += " border-green-500 bg-green-50/30";
      textClasses += " text-gray-500 line-through decoration-green-500/50 decoration-2";
      statusButtonClasses += " border-green-500 bg-green-500 text-white";
      icon = <Check className="w-5 h-5" strokeWidth={3} />;
    } else {
      // Past + Not Done (Pending/InProgress) -> Red (Missed)
      containerClasses += " border-red-500 bg-red-50/30";
      textClasses += " text-red-900"; 
      statusButtonClasses += " border-red-500 bg-transparent text-red-500";
      icon = <X className="w-5 h-5" strokeWidth={3} />;
    }
  } else {
    // Today / Future
    switch (todo.status) {
      case 'COMPLETED': // Green
        containerClasses += " border-green-500 opacity-60";
        textClasses += " text-gray-400 line-through decoration-gray-400 decoration-2";
        statusButtonClasses += " border-green-500 bg-green-500 text-white";
        icon = <Check className="w-5 h-5" strokeWidth={3} />;
        break;
      
      case 'IN_PROGRESS': // Cyan (Doing it right now)
        containerClasses += " border-cyan-400 bg-cyan-50/20";
        textClasses += " text-[#102542]";
        statusButtonClasses += " border-cyan-400 bg-cyan-400 text-white animate-pulse";
        icon = <Play className="w-4 h-4 fill-current" />;
        break;

      case 'PENDING': // Orange (Pending)
      default:
        containerClasses += " border-[#F87060]";
        textClasses += " text-slate-800";
        statusButtonClasses += " border-[#F87060] text-[#F87060] group-hover:bg-[#F87060] group-hover:text-white";
        icon = <Circle className="w-2 h-2 fill-current" />;
        break;
    }
  }

  return (
    <div className={containerClasses}>
      
      {/* Main Content Area */}
      <div className="flex items-center flex-1 min-w-0 w-full">
        {/* Status Toggle Button */}
        <button 
          onClick={handleCycleStatus}
          className={statusButtonClasses}
          title={`Status: ${todo.status}. Click to cycle.`}
        >
          {icon}
        </button>

        {/* Priority Toggle - Small indicator */}
        <button 
           onClick={handleCyclePriority}
           className="flex-shrink-0 flex items-center justify-center p-1 rounded hover:bg-slate-100 mr-1"
           title={`Priority: ${todo.priority}. Click to change.`}
        >
            {getPriorityIcon()}
            <span className="text-[10px] font-bold ml-1 text-gray-400 w-6">{getPriorityLabel()}</span>
        </button>
        
        {/* Editable Text Area */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-b-2 border-[#102542] text-base sm:text-lg font-medium text-[#102542] focus:outline-none px-2 py-1 mx-2"
          />
        ) : (
          <span 
            className={textClasses} 
            title="Click to edit text"
            onClick={() => setIsEditing(true)}
            role="button"
            tabIndex={0}
          >
            {todo.text}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end w-full sm:w-auto mt-2 sm:mt-0 sm:pl-2 sm:border-l sm:border-gray-100 sm:ml-2 border-t border-gray-100 pt-1 sm:pt-0 sm:border-t-0 space-x-1">
        
        {/* Note Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onOpenNote(todo.id); }}
          className={`p-2 transition-colors focus:outline-none w-full sm:w-auto flex justify-center ${todo.note ? 'text-[#102542] bg-blue-50' : 'text-gray-300 hover:text-[#102542]'}`}
          aria-label="Add note"
          title={todo.note ? "Edit note" : "Add note"}
        >
           <FileText className="w-5 h-5" />
        </button>

        <button
          onClick={() => onDelete(todo.id)}
          className="p-2 text-gray-300 hover:text-[#F87060] hover:bg-red-50 transition-colors focus:outline-none w-full sm:w-auto flex justify-center"
          aria-label="Delete task"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Tech decoration lines */}
      <div className="absolute right-0 top-0 h-2 w-[1px] bg-gray-200"></div>
      <div className="absolute right-0 bottom-0 h-2 w-[1px] bg-gray-200"></div>
    </div>
  );
};