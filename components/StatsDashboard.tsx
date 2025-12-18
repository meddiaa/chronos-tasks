import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Todo, DayMetadata } from '../types';
import { getStatusDistribution, getLast7DaysPerformance, getTaskVolumeTrend, getDayEfficiency, getSatisfactionTrends, getPriorityStats } from '../utils/statsUtils';
import { X, Save } from 'lucide-react';

interface StatsDashboardProps {
  todos: Todo[];
  dailyMetadata: Record<string, DayMetadata>;
  onClose: () => void;
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

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ todos, dailyMetadata, onClose }) => {
  const pieData = useMemo(() => getStatusDistribution(todos), [todos]);
  const barData = useMemo(() => getLast7DaysPerformance(todos), [todos]);
  const areaData = useMemo(() => getTaskVolumeTrend(todos), [todos]);
  const radarData = useMemo(() => getDayEfficiency(todos), [todos]);
  const satisfactionData = useMemo(() => getSatisfactionTrends(dailyMetadata), [dailyMetadata]);
  const priorityData = useMemo(() => getPriorityStats(todos), [todos]);

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
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-[#F87060] hover:bg-white hover:text-[#102542] text-[#102542] transition-colors rounded-none"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

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
                    <Bar dataKey="total" name="Total Created" fill="#8884d8" barSize={30} />
                    <Bar dataKey="completed" name="Finished" fill="#22c55e" barSize={30} />
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

          {/* Card 5: Volume Area */}
          <div className="bg-[#102542] p-6 border-l-4 border-yellow-400 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="text-6xl font-bold text-white">05</div>
            </div>
            <h3 className="text-xl text-white font-bold uppercase tracking-wider mb-6">Task Volume Input</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={areaData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a63" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#fbbf24" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
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
      </div>
    </div>
  );
};