import React, { useState, useEffect, useMemo } from 'react';
import { Plus, LayoutDashboard, Cpu, FileSpreadsheet, BarChart2, Search, Calendar, AlertCircle, AlertTriangle, Minus, ChevronDown, User, LogOut, Users, Cloud, CloudOff } from 'lucide-react';
import { Todo, TodoGroup, TaskStatus, DailyRating, DayMetadata, Priority } from './types';
import { getTodayDateString, formatDateLabel, isDatePast } from './utils/dateUtils';
import { exportToCSV } from './utils/csvUtils';
import { TodoSection } from './components/TodoSection';
import { StatsDashboard } from './components/StatsDashboard';
import { TaskNoteModal } from './components/TaskNoteModal';
import { storage } from './utils/storage';

const App: React.FC = () => {
  // Authentication / User State
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [newUserName, setNewUserName] = useState('');

  // App Data
  const [todos, setTodos] = useState<Todo[]>([]);
  const [dailyMetadata, setDailyMetadata] = useState<Record<string, DayMetadata>>({});
  
  // Input States
  const [inputValue, setInputValue] = useState('');
  const [inputPriority, setInputPriority] = useState<Priority>('LOW');
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isCloud, setIsCloud] = useState(false);

  // Note Modal State
  const [activeNoteTaskId, setActiveNoteTaskId] = useState<string | null>(null);

  // --- Auth & Initial Load ---

  useEffect(() => {
      // 1. Load users list (Keep list local for "Recent Users" UI)
      const storedUsers = localStorage.getItem('chronos_users_list');
      if (storedUsers) {
          setAvailableUsers(JSON.parse(storedUsers));
      }
      
      // 2. Check for active session
      const sessionUser = localStorage.getItem('chronos_active_user');
      if (sessionUser) {
          setCurrentUser(sessionUser);
      }
      
      setIsCloud(storage.isCloudActive());
      setIsLoaded(true);
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
      e.preventDefault();
      const name = newUserName.trim();
      if (!name) return;
      
      if (!availableUsers.includes(name)) {
          const updatedUsers = [...availableUsers, name];
          setAvailableUsers(updatedUsers);
          localStorage.setItem('chronos_users_list', JSON.stringify(updatedUsers));
      }
      loginUser(name);
      setNewUserName('');
  };

  const loginUser = (name: string) => {
      setCurrentUser(name);
      localStorage.setItem('chronos_active_user', name);
      // Data will be loaded by the useEffect below
  };

  const logoutUser = async () => {
      // Save current data to ensure no loss on logout
      if (currentUser) {
          await storage.saveUserData(currentUser, { todos, metadata: dailyMetadata });
      }
      setCurrentUser(null);
      localStorage.removeItem('chronos_active_user');
      setTodos([]);
  };

  // --- Data Loading (Per User) ---
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser || !isLoaded) return;
      
      const data = await storage.loadUserData(currentUser);
      
      // Migration / Safety check for legacy data
      const migratedTodos = data.todos.map((t: any) => ({
           ...t,
           status: t.status || (t.isCompleted ? 'COMPLETED' : 'PENDING'),
           priority: t.priority || 'LOW',
           note: t.note || ''
      }));

      setTodos(migratedTodos);
      setDailyMetadata(data.metadata);
    };

    loadData();
  }, [currentUser, isLoaded]);

  // --- Data Saving (Per User) ---
  useEffect(() => {
    if (currentUser && isLoaded) {
      // Debounce slightly or just save on every render (React batches updates usually)
      storage.saveUserData(currentUser, { todos, metadata: dailyMetadata });
    }
  }, [todos, dailyMetadata, currentUser, isLoaded]);


  // --- Event Handlers ---

  const handleAddTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      status: 'PENDING',
      priority: inputPriority,
      createdAt: Date.now(),
      dateString: selectedDate || getTodayDateString(),
      note: ''
    };

    setTodos(prev => [newTodo, ...prev]);
    setInputValue('');
  };

  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, status: newStatus } : t
    ));
  };

  const handlePriorityChange = (id: string, newPriority: Priority) => {
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, priority: newPriority } : t
    ));
  };
  
  const handleEditTodo = (id: string, newText: string) => {
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, text: newText } : t
    ));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveTaskNote = (id: string, note: string) => {
    setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, note } : t
    ));
  };
  
  const handleRateDay = (date: string, rating: DailyRating) => {
    setDailyMetadata(prev => {
      const current = prev[date] || {};
      const newRating = current.rating === rating ? undefined : rating;
      return { 
          ...prev, 
          [date]: { ...current, rating: newRating } 
      };
    });
  };

  const handleUpdateNote = (date: string, note: string) => {
      setDailyMetadata(prev => {
          const current = prev[date] || {};
          return {
              ...prev,
              [date]: { ...current, note }
          };
      });
  };

  const handleExport = () => {
    exportToCSV(todos);
  };

  const selectPriority = (p: Priority) => {
      setInputPriority(p);
      setShowPriorityMenu(false);
  };

  // Group, Sort, and Filter Todos
  const groupedTodos = useMemo(() => {
    const groups: { [key: string]: Todo[] } = {};
    const today = getTodayDateString();

    todos.forEach(todo => {
      if (searchQuery && !todo.text.toLowerCase().includes(searchQuery.toLowerCase())) {
          return;
      }
      const dateKey = todo.dateString || today;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(todo);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return sortedDates.map(date => {
        const sortedGroupTodos = groups[date].sort((a, b) => {
            const priorityWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
            if (pDiff !== 0) return pDiff;
            return b.createdAt - a.createdAt;
        });

        return {
            dateString: date,
            todos: sortedGroupTodos,
            label: formatDateLabel(date),
            isPast: isDatePast(date),
            isToday: date === today,
            rating: dailyMetadata[date]?.rating,
            note: dailyMetadata[date]?.note
        } as TodoGroup;
    });
  }, [todos, dailyMetadata, searchQuery]);

  const activeNoteTodo = useMemo(() => 
    activeNoteTaskId ? todos.find(t => t.id === activeNoteTaskId) || null : null
  , [todos, activeNoteTaskId]);


  // --- RENDER: LOGIN SCREEN ---
  if (!currentUser) {
      return (
          <div className="min-h-screen bg-[#102542] flex items-center justify-center p-4 font-sans">
              <div className="w-full max-w-md bg-white shadow-2xl overflow-hidden relative border-t-4 border-[#F87060]">
                  <div className="p-8">
                      <div className="flex justify-center mb-6">
                           <LayoutDashboard className="w-12 h-12 text-[#102542]" />
                      </div>
                      <h1 className="text-3xl font-bold text-center text-[#102542] mb-2 font-['Rajdhani'] tracking-widest uppercase">Chronos<span className="text-[#F87060]">_</span>Access</h1>
                      <p className="text-center text-gray-500 text-sm mb-8 uppercase tracking-wider">Identify User Protocol</p>
                      
                      {availableUsers.length > 0 && (
                          <div className="space-y-3 mb-8">
                              <p className="text-xs font-bold text-gray-400 uppercase">Existing Profiles</p>
                              {availableUsers.map(user => (
                                  <button
                                      key={user}
                                      onClick={() => loginUser(user)}
                                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-[#102542] hover:text-white group transition-all border border-gray-200"
                                  >
                                      <div className="flex items-center space-x-3">
                                          <div className="bg-white p-1 rounded-full border border-gray-200 group-hover:border-transparent">
                                              <User className="w-4 h-4 text-[#102542]" />
                                          </div>
                                          <span className="font-bold tracking-wide uppercase">{user}</span>
                                      </div>
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Users className="w-4 h-4" />
                                      </div>
                                  </button>
                              ))}
                          </div>
                      )}

                      <form onSubmit={handleCreateUser} className="relative">
                           <p className="text-xs font-bold text-gray-400 uppercase mb-2">Create New Profile</p>
                           <input 
                              type="text" 
                              value={newUserName}
                              onChange={(e) => setNewUserName(e.target.value)}
                              placeholder="ENTER USERNAME..." 
                              className="w-full p-4 bg-slate-100 border border-gray-300 focus:border-[#F87060] outline-none text-[#102542] font-bold uppercase placeholder-gray-400"
                           />
                           <button 
                              type="submit" 
                              disabled={!newUserName.trim()}
                              className="absolute right-2 top-[29px] p-2 bg-[#F87060] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ff8676]"
                           >
                               <Plus className="w-4 h-4" />
                           </button>
                      </form>
                  </div>
                  <div className="bg-gray-50 p-4 text-center border-t border-gray-200 flex justify-center items-center space-x-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">System Status:</p>
                      {isCloud ? (
                         <div className="flex items-center text-[10px] text-green-600 font-bold uppercase tracking-widest">
                           <Cloud className="w-3 h-3 mr-1" /> Online
                         </div>
                      ) : (
                         <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                           <CloudOff className="w-3 h-3 mr-1" /> Local Only
                         </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: MAIN APP ---
  if (!isLoaded) return null; 

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col font-sans">
      
      {/* Stats Overlay */}
      {showStats && (
        <StatsDashboard todos={todos} dailyMetadata={dailyMetadata} onClose={() => setShowStats(false)} />
      )}

      {/* Task Note Modal */}
      <TaskNoteModal 
        todo={activeNoteTodo}
        isOpen={!!activeNoteTaskId}
        onClose={() => setActiveNoteTaskId(null)}
        onSave={handleSaveTaskNote}
      />

      {/* HUD Header */}
      <header className="bg-[#102542] text-white shadow-xl sticky top-0 z-50 border-b-4 border-[#F87060]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Section */}
          <div className="flex items-center space-x-4 w-full md:w-auto justify-center md:justify-start">
            <div className="relative">
              <div className="absolute inset-0 bg-[#F87060] blur-sm opacity-50"></div>
              <div className="bg-[#102542] border border-[#F87060] p-2 relative">
                <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8 text-[#F87060]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-widest leading-none font-['Rajdhani']">CHRONOS<span className="text-[#F87060]">_</span>TASKS</h1>
              <div className="flex items-center justify-center md:justify-start text-xs text-blue-200/60 uppercase tracking-[0.2em] space-x-2">
                <Cpu className="w-3 h-3" />
                <span>USER: <span className="text-white font-bold">{currentUser}</span></span>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
             
             {/* Stats Toggle */}
             <button 
                onClick={() => setShowStats(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#102542] border border-[#F87060] hover:bg-[#F87060] text-white hover:text-[#102542] text-xs font-bold tracking-widest uppercase transition-all rounded-none"
             >
                <BarChart2 className="w-4 h-4" />
                <span>Analytics</span>
             </button>

             {/* Export Button */}
             <button 
                onClick={handleExport}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#F87060] hover:bg-[#ff8676] text-[#102542] text-xs font-bold tracking-widest uppercase transition-colors rounded-none"
             >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export</span>
             </button>

             {/* Logout Button */}
             <button 
                onClick={() => logoutUser()}
                className="flex items-center justify-center px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white transition-colors rounded-none border border-slate-600 ml-2"
                title="Switch User"
             >
                <LogOut className="w-4 h-4" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        
        {/* Search Bar & Input Interface Wrapper */}
        <div className="mb-8 sm:mb-12 max-w-2xl mx-auto">
          
          {/* Search Bar */}
          <div className="mb-6 relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
             </div>
             <input
                type="text"
                placeholder="SEARCH DATABASE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-300/50 border-b-2 border-slate-400 text-[#102542] placeholder-slate-500 focus:outline-none focus:border-[#F87060] focus:bg-white transition-all font-['Rajdhani'] uppercase tracking-wider"
             />
          </div>

          <div className="flex items-center mb-1 space-x-2">
             <div className="h-1 w-4 bg-[#102542]"></div>
             <span className="text-xs font-bold tracking-widest text-[#102542] uppercase">New Directive Protocol</span>
          </div>
          
          <form onSubmit={handleAddTodo} className="relative group flex flex-col sm:flex-row shadow-lg bg-white border border-gray-200">
            
            {/* Meta Control Panel (Date + Priority) - Compact Width as requested */}
            <div className="flex w-full sm:w-auto bg-white text-[#102542] divide-x divide-gray-200 sm:divide-x-0 relative z-30 flex-shrink-0">
                
                {/* Date Input - Ultra Compact */}
                <div className="relative flex-1 sm:flex-none flex items-center px-2 py-3 sm:py-0 border-r border-gray-200 sm:border-r">
                    <Calendar className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" />
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full sm:w-[110px] bg-transparent text-[#102542] font-bold outline-none transition-all uppercase tracking-wide font-['Rajdhani'] text-sm cursor-pointer"
                    />
                </div>

                {/* Priority Dropdown - Ultra Compact */}
                <div className="relative flex-1 sm:flex-none sm:border-r border-gray-200">
                    <button
                        type="button"
                        onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                        className="w-full sm:w-[90px] h-full flex items-center justify-between px-2 py-3 sm:py-0 hover:bg-slate-50 transition-colors cursor-pointer select-none"
                    >
                        <div className="flex items-center space-x-1">
                            {inputPriority === 'HIGH' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                            {inputPriority === 'MEDIUM' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                            {inputPriority === 'LOW' && <Minus className="w-4 h-4 text-slate-400" />}
                            
                            <span className={`text-sm font-bold tracking-widest truncate ${
                                inputPriority === 'HIGH' ? 'text-rose-600' : 
                                inputPriority === 'MEDIUM' ? 'text-amber-500' : 
                                'text-slate-500'
                            }`}>
                                {inputPriority}
                            </span>
                        </div>
                        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showPriorityMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu - Styled for light theme */}
                    {showPriorityMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowPriorityMenu(false)}></div>
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl z-20 animate-in slide-in-from-top-2 duration-150">
                                <button 
                                    type="button"
                                    onClick={() => selectPriority('HIGH')}
                                    className="w-full flex items-center space-x-2 px-4 py-3 hover:bg-rose-50 transition-colors border-b border-gray-100"
                                >
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                    <span className="text-sm font-bold tracking-widest text-rose-600">HIGH</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => selectPriority('MEDIUM')}
                                    className="w-full flex items-center space-x-2 px-4 py-3 hover:bg-amber-50 transition-colors border-b border-gray-100"
                                >
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm font-bold tracking-widest text-amber-600">MEDIUM</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => selectPriority('LOW')}
                                    className="w-full flex items-center space-x-2 px-4 py-3 hover:bg-slate-50 transition-colors"
                                >
                                    <Minus className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-bold tracking-widest text-slate-500">LOW</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Text Input - Expanded */}
            <div className="relative flex-grow bg-white z-0">
                <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ENTER TASK PROTOCOL..."
                className="w-full h-14 sm:h-16 p-4 sm:p-5 pr-16 sm:pr-20 text-lg font-medium bg-transparent text-[#102542] placeholder-gray-300 border-none outline-none transition-all uppercase tracking-wide font-['Rajdhani']"
                />
            
                <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-0 top-0 bottom-0 w-16 bg-[#102542] hover:bg-[#F87060] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                aria-label="Add task"
                >
                <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
            </div>
            
            {/* Tech Accents - darker for light theme contrast */}
            <div className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#102542] opacity-100 z-20"></div>
            <div className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#102542] opacity-100 z-20"></div>

          </form>
          
          {/* Status Legend */}
          <div className="mt-2 flex flex-wrap justify-center sm:justify-end gap-4 text-[10px] uppercase tracking-wider font-bold text-gray-400">
             <div className="flex items-center"><span className="w-2 h-2 rounded-full border border-[#F87060] mr-1"></span> Pending</div>
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-cyan-400 mr-1"></span> Doing</div>
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Done</div>
          </div>
        </div>

        {/* Task Data Stream */}
        <div className="space-y-2">
          {groupedTodos.length > 0 ? (
            groupedTodos.map(group => (
              <TodoSection 
                key={group.dateString} 
                group={group} 
                onStatusChange={handleStatusChange}
                onEdit={handleEditTodo}
                onDelete={handleDeleteTodo}
                onRate={handleRateDay}
                onPriorityChange={handlePriorityChange}
                onUpdateNote={handleUpdateNote}
                onOpenNote={setActiveNoteTaskId}
              />
            ))
          ) : (
            <div className="text-center py-16 sm:py-24 opacity-40">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-[#102542] mx-auto mb-6 flex items-center justify-center animate-pulse">
                {searchQuery ? <Search className="w-8 h-8 text-[#102542]"/> : <Cpu className="w-8 h-8 sm:w-10 sm:h-10 text-[#102542]" />}
              </div>
              <p className="text-xl sm:text-2xl text-[#102542] font-bold tracking-widest uppercase">
                  {searchQuery ? 'Search Protocol Negative' : 'No Data Found'}
              </p>
              <p className="text-gray-500 font-mono mt-2 text-sm">
                  {searchQuery ? 'Adjust query parameters.' : 'Awaiting input stream...'}
              </p>
            </div>
          )}
        </div>

      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-xs tracking-widest uppercase border-t border-gray-300 bg-gray-100">
        <p>Chronos System v2.3 &copy; {new Date().getFullYear()} // Operational</p>
      </footer>
    </div>
  );
};

export default App;