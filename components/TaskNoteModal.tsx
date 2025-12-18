import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { Todo } from '../types';

interface TaskNoteModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, note: string) => void;
}

export const TaskNoteModal: React.FC<TaskNoteModalProps> = ({ todo, isOpen, onClose, onSave }) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (todo) {
      setNote(todo.note || '');
    }
  }, [todo]);

  if (!isOpen || !todo) return null;

  const handleSave = () => {
    onSave(todo.id, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-[#102542]">
        
        {/* Header */}
        <div className="bg-slate-100 p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-[#102542]">
            <FileText className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Protocol Details</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-[#F87060] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Task Title Reference */}
        <div className="px-6 pt-6 pb-2">
            <h4 className="text-lg font-bold text-[#102542] leading-tight">{todo.text}</h4>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                {todo.dateString} &bull; {todo.priority} Priority
            </div>
        </div>

        {/* Note Editor */}
        <div className="p-6">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
             Additional Notes / Sub-tasks
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-48 p-4 bg-slate-50 border border-gray-300 focus:border-[#102542] focus:bg-white outline-none resize-none transition-all text-sm font-medium text-slate-700 font-sans"
            placeholder="Enter detailed notes..."
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-[#102542] uppercase tracking-wider"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2 bg-[#102542] hover:bg-[#F87060] text-white transition-colors text-sm font-bold uppercase tracking-wider"
          >
            <Save className="w-4 h-4" />
            <span>Save Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};