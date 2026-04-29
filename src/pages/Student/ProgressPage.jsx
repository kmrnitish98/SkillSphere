import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { FaCheckCircle, FaTrophy, FaFire, FaChartPie, FaChartLine } from 'react-icons/fa';

const ProgressPage = () => {
  // Mock advanced progress data
  const progressData = [
    { id: 1, course: 'React Masterclass', progress: 75, total: 20, completed: 15, lastActive: '2 days ago', color: 'from-blue-400 to-indigo-500' },
    { id: 2, course: 'Node.js Bootcamp', progress: 40, total: 15, completed: 6, lastActive: '5 hours ago', color: 'from-violet-400 to-purple-500' },
    { id: 3, course: 'MongoDB Deep Dive', progress: 100, total: 10, completed: 10, lastActive: '1 week ago', color: 'from-green-400 to-emerald-500' },
  ];

  const weeklyHours = [
    { name: 'Mon', hours: 1.5 }, { name: 'Tue', hours: 3 }, { name: 'Wed', hours: 2.2 },
    { name: 'Thu', hours: 4.5 }, { name: 'Fri', hours: 1 }, { name: 'Sat', hours: 5.5 },
    { name: 'Sun', hours: 4 },
  ];

  const skillData = [
    { name: 'Frontend', level: 85 },
    { name: 'Backend', level: 60 },
    { name: 'Database', level: 90 },
    { name: 'DevOps', level: 30 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Learning Analytics</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Deep dive into your performance and stats</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
          <FaTrophy className="absolute -right-4 -bottom-4 text-8xl text-white/10 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <h3 className="text-indigo-200 font-bold uppercase tracking-wider text-xs mb-1">Top Course</h3>
            <p className="text-xl font-black mb-4 leading-tight">MongoDB Deep Dive</p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold">
              <FaCheckCircle className="text-green-400" /> 100% Completed
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner"><FaFire /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Streak</p>
              <p className="text-3xl font-black text-slate-900">5 Days</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner"><FaChartPie /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Overall Completion</p>
              <p className="text-3xl font-black text-slate-900">62%</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Weekly Hours Area Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Weekly Learning</h2>
              <p className="text-xs text-slate-500 font-medium">Hours spent learning</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl text-slate-400"><FaChartLine /></div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyHours} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHoursProg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorHoursProg)" activeDot={{ r: 6, fill: '#fff', stroke: '#6366f1', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Skill Progress Bar Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm">
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-slate-900">Skill Breakdown</h2>
            <p className="text-xs text-slate-500 font-medium">Your proficiency across domains</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} width={80} />
                <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="level" fill="#14b8a6" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Course Progress List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 mb-6">Course Progress</h2>
        <div className="space-y-6">
          {progressData.map((item, i) => (
            <div key={item.id} className="group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{item.course}</h3>
                  <p className="text-xs text-slate-500 font-medium">Last active {item.lastActive} • {item.completed}/{item.total} lessons</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black ${item.progress === 100 ? 'text-green-600' : 'text-indigo-600'}`}>{item.progress}%</span>
                  {item.progress === 100 && <FaCheckCircle className="text-green-500 text-xl" />}
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 p-[1.5px]">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                ></motion.div>
              </div>
              {i !== progressData.length - 1 && <hr className="mt-6 border-slate-50" />}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProgressPage;
