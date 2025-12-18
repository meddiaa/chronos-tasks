import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Todo, DayMetadata } from '../types';
import { getStatusDistribution, getLast7DaysPerformance, getTaskVolumeTrend, getDayEfficiency, getSatisfactionTrends, getPriorityStats } from '../utils/statsUtils';
import { archiveUtils } from '../utils/archiveUtils';
import { X, Save, Trash2, Sparkles, Loader } from 'lucide-react';

interface StatsDashboardProps {
  todos: Todo[];
  dailyMetadata: Record<string, DayMetadata>;
  onClose: () => void;
  currentUser?: string;
  onArchive?: (archivedCount: number) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#102542] border border-[#F87060] p-3 shadow-xl z-50">
        <p className="text-[#F87060] font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white text-sm" style={{ color: entry.color || entry.payload.fill }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ todos, dailyMetadata, onClose, currentUser, onArchive }) => {
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  
  const pieData = useMemo(() => getStatusDistribution(todos), [todos]);
  const barData = useMemo(() => getLast7DaysPerformance(todos), [todos]);
  const areaData = useMemo(() => getTaskVolumeTrend(todos), [todos]);
  const radarData = useMemo(() => getDayEfficiency(todos), [todos]);
  const satisfactionData = useMemo(() => getSatisfactionTrends(dailyMetadata), [dailyMetadata]);
  const priorityData = useMemo(() => getPriorityStats(todos), [todos]);
  
  const oldTasks = useMemo(() => archiveUtils.getOldTasks(todos, 30), [todos]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const handleArchiveOldTasks = () => {
    if (oldTasks.length > 0 && currentUser) {
      archiveUtils.downloadArchive(oldTasks, currentUser);
      archiveUtils.saveArchiveToStorage(currentUser, oldTasks);
      onArchive?.(oldTasks.length);
    }
    setShowArchiveConfirm(false);
  };

  const generateAiInsight = async () => {
    setLoadingInsight(true);
    try {
      // Get last 7 days data
      const last7 = getLast7DaysPerformance(todos);
      const totalTasks = last7.reduce((sum, day) => sum + day.total, 0);
      const completed = last7.reduce((sum, day) => sum + day.completed, 0);
      const missed = totalTasks - completed;
      const completionRate = totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100);
      
      const prioData = priorityData;
      const dailyPerf = last7.map(day => `${day.date}: ${day.completed}/${day.total}`).join('\n');

      const taskData = {
        totalTasks,
        completed,
        missed,
        completionRate,
        highPriority: prioData[0].total,
        highCompleted: prioData[0].completed,
        highRate: prioData[0].total === 0 ? 0 : Math.round((prioData[0].completed / prioData[0].total) * 100),
        mediumPriority: prioData[1].total,
        mediumCompleted: prioData[1].completed,
        mediumRate: prioData[1].total === 0 ? 0 : Math.round((prioData[1].completed / prioData[1].total) * 100),
        lowPriority: prioData[2].total,
        lowCompleted: prioData[2].completed,
        lowRate: prioData[2].total === 0 ? 0 : Math.round((prioData[2].completed / prioData[2].total) * 100),
        dailyPerformance: dailyPerf,
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insight');
      }

      const result = await response.json();
      setAiInsight(result.insight);
    } catch (error) {
      console.error('Error generating insight:', error);
      setAiInsight('Unable to generate insight at this time. Please try again later.');
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen p-4 sm:p-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-[#F87060] pb-4">
          <div>
             <h2 className="text-3xl sm:text-4xl text-white font-bold tracking-widest font-['Rajdhani'] uppercase">
                Productivity <span className="text-[#F87060]">Analytics</span>
             </h2>
             <div className="flex items-center space-x-2 mt-1">
               <p className="text-blue-200 text-sm tracking-wider uppercase">
                  System Performance Metrics
               </p>
               <span className="text-gray-500">|</span>
               <div className="flex items-center text-xs text-green-400 uppercase tracking-widest">
                  <Save className="w-3 h-3 mr-1" />
                  Auto-Save Enabled
               </div>
               {oldTasks.length > 0 && (
                 <>
                   <span className="text-gray-500">|</span>
                   <button
                     onClick={() => setShowArchiveConfirm(true)}
                     className="text-xs text-amber-400 hover:text-amber-300 uppercase tracking-widest flex items-center"
                   >
                     <Trash2 className="w-3 h-3 mr-1" />
                     Archive ({oldTasks.length} tasks)
                   </button>
                 </>
               )}
               <span className="text-gray-500">|</span>
               <button
                 onClick={generateAiInsight}
                 disabled={loadingInsight}
                 className="text-xs text-violet-400 hover:text-violet-300 uppercase tracking-widest flex items-center disabled:opacity-50"
               >
                 {loadingInsight ? (
                   <>
                     <Loader className="w-3 h-3 mr-1 animate-spin" />
                     Analyzing...
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-3 h-3 mr-1" />
                     Generate Insight
                   </>
                 )}
               </button>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-[#F87060] hover:bg-white hover:text-[#102542] text-[#102542] transition-colors rounded-none"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* AI Insight Display */}
        {aiInsight && (
          <div className="max-w-6xl mx-auto mb-8 p-6 bg-gradient-to-r from-violet-900/30 to-purple-900/30 border-l-4 border-violet-500 rounded-sm">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-6 h-6 text-violet-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-violet-200 font-semibold uppercase tracking-wider text-sm mb-2">The Oracle Speaks</p>
                <p className="text-gray-200 leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          
          {/* Card 1: Task Status Distribution */}
          <div className="bg-[#102542] p-6 border-l-4 border-[#F87060] shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="text-6xl font-bold text-white">01</div>
            </div>
            <h3 className="text-xl text-white font-bold uppercase tracking-wider mb-6">Task Status Overview</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: 7 Day Trend */}
          <div className="bg-[#102542] p-6 border-l-4 border-cyan-400 shadow-lg relative overflow-hidden group lg:col-span-2">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="text-6xl font-bold text-white">02</div>
            </div>
            <h3 className="text-xl text-white font-bold uppercase tracking-wider mb-6">7-Day Performance Protocol</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a63" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip cursor={{fill: '#1e3a63'}} content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#22c55e" barSize={40} />
                  <Bar dataKey="missed" name="Incomplete" stackId="a" fill="#ef4444" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: Priority Breakdown (New) */}
          <div className="bg-[#102542] p-6 border-l-4 border-rose-500 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="text-6xl font-bold text-white">03</div>
            </div>
            <h3 className="text-xl text-white font-bold uppercase tracking-wider mb-6">Priority Distribution</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={priorityData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a63" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip cursor={{fill: '#1e3a63'}} content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="total" name="Total Created" barSize={30}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.6} />
                      ))}
                    </Bar>
                    <Bar dataKey="completed" name="Finished" barSize={30}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          {/* Card 4: Efficiency Radar */}
          <div className="bg-[#102542] p-6 border-l-4 border-purple-500 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="text-6xl font-bold text-white">04</div>
            </div>
            <h3 className="text-xl text-white font-bold uppercase tracking-wider mb-6">Weekly Efficiency Cycle</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#1e3a63" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569"/>
                  <Radar
                    name="Efficiency %"
                    dataKey="efficiency"
                    stroke="#a855f7"
                    strokeWidth={3}
                    fill="#a855f7"
                    fillOpacity={0.4}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 5: Completion Rate by Priority */}
          <div className="bg-[#102542] p-6 border-l-4 border-yellow-400 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="text-6xl font-bold text-white">05</div>
            </div>
            <h3 className="text-xl text-white font-bold uppercase tracking-wider mb-6">Completion Rate by Priority</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={priorityData}
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a63" horizontal={true} />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={35} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completionRate" name="Completion %" fill="#fbbf24">
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 6: Satisfaction Meter */}
          <div className="bg-[#102542] p-6 border-l-4 border-pink-500 shadow-lg relative overflow-hidden group lg:col-span-3">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="text-6xl font-bold text-white">06</div>
            </div>
            <h3 className="text-xl text-white font-bold uppercase tracking-wider mb-6">Daily Satisfaction Index</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={satisfactionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a63" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" barSize={40}>
                    {satisfactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Archive Confirmation Modal */}
        {showArchiveConfirm && oldTasks.length > 0 && (
          <div className="fixed inset-0 z-[101] bg-slate-900/95 flex items-center justify-center p-4">
            <div className="bg-[#102542] p-8 max-w-md w-full border-l-4 border-amber-500 shadow-2xl">
              <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-4">
                Archive Old Tasks?
              </h3>
              <p className="text-gray-300 mb-6">
                {oldTasks.length} tasks older than 30 days will be archived. They'll be downloaded as a JSON file and backed up locally.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleArchiveOldTasks}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-[#102542] font-bold uppercase tracking-widest transition-all"
                >
                  Archive & Download
                </button>
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};