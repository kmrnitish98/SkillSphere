import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBook, FaRupeeSign, FaUsers, FaPlusCircle, FaCheckCircle, FaChartPie, FaExclamationTriangle, FaTimes, FaArrowUp, FaChartLine, FaRocket, FaBolt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getMentorDashboard, getVerificationStatus } from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const CATEGORIES = [
  { name: 'Development', value: 400 },
  { name: 'Design', value: 300 },
  { name: 'Marketing', value: 300 },
  { name: 'Business', value: 200 },
];

/* ── Animated Counter ── */
const useCounter = (end, dur = 1200) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!end) return;
    let s = 0; const step = end / (dur / 16);
    const t = setInterval(() => { s += step; if (s >= end) { setVal(end); clearInterval(t); } else setVal(Math.floor(s)); }, 16);
    return () => clearInterval(t);
  }, [end, dur]);
  return val;
};

/* ── Chart Tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl px-4 py-3 shadow-2xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-emerald-400 text-lg font-bold">₹{payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

/* ── Stat Card ── */
const StatCard = ({ label, value, icon: Icon, gradient, iconBg, delay = 0, trend }) => {
  const num = typeof value === 'number' ? value : null;
  const animated = useCounter(num || 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer overflow-hidden"
    >
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity" style={{ background: gradient }} />
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg mb-4 group-hover:scale-110 transition-transform ${iconBg}`}>
        <Icon />
      </div>
      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
        {num !== null ? (label.includes('Earning') ? `₹${animated.toLocaleString()}` : animated.toLocaleString()) : value}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {trend && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
            <FaArrowUp className="text-[8px]" /> {trend}%
          </span>
        )}
      </div>
    </motion.div>
  );
};

/* ── Greeting ── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/* ══════════════════════════ MAIN ══════════════════════════ */
const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('weekly');

  const [verifyStatus, setVerifyStatus] = useState('none'); // 'none' | 'pending' | 'approved' | 'rejected'

  useEffect(() => {
    // Fetch verification status
    getVerificationStatus()
      .then(r => {
        const status = r.data?.data?.verificationStatus || 'none';
        setVerifyStatus(status);
        if (status === 'none' || status === 'rejected') setShowPopup(true);
      })
      .catch(() => {
        if (user && !user.isVerifiedMentor) setShowPopup(true);
      });

    getMentorDashboard()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user]);

  /* ── Loading Skeleton ── */
  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-52 bg-slate-200 rounded-3xl" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl" />
        <div className="h-72 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );

  const { totalCourses = 0, totalStudents = 0, totalEarnings = 0, activeCourses = 0, recentActivities = [], earningsGraphData = [] } = data || {};
  const chartData = [...(earningsGraphData || [])].reverse();
  const totalCatValue = CATEGORIES.reduce((a, c) => a + c.value, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-7 pb-8">

      {/* ── Verification Alert ── */}
      <AnimatePresence>
        {/* Show PENDING alert if application is submitted */}
        {verifyStatus === 'pending' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm relative flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-lg shrink-0"><FaExclamationTriangle /></div>
              <div>
                <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                  Verification Pending
                  <span className="text-[10px] font-bold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full uppercase">Under Review</span>
                </h3>
                <p className="text-sm text-amber-700 mt-0.5">Your application is being reviewed. We'll notify you within 24–48 hours.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Show VERIFY NOW alert if not submitted or rejected */}
        {showPopup && (verifyStatus === 'none' || verifyStatus === 'rejected') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm relative flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <button className="absolute top-3 right-3 text-amber-400 hover:text-amber-600" onClick={() => setShowPopup(false)}><FaTimes /></button>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-lg shrink-0"><FaExclamationTriangle /></div>
              <div>
                <h3 className="text-base font-bold text-amber-900">
                  {verifyStatus === 'rejected' ? 'Verification Rejected' : 'Verify your account'}
                </h3>
                <p className="text-sm text-amber-700 mt-0.5">
                  {verifyStatus === 'rejected'
                    ? 'Your previous application was not approved. Please resubmit.'
                    : 'Complete mentor verification before creating courses.'}
                </p>
              </div>
            </div>
            <button onClick={() => { setShowPopup(false); navigate('/mentor/verification'); }}
              className="bg-amber-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-amber-600 transition-colors whitespace-nowrap text-sm">
              {verifyStatus === 'rejected' ? 'Resubmit' : 'Verify Now'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ HERO SECTION ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-[24px] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2742 40%, #0f172a 100%)' }}
      >
        {/* Animated bg orbs */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-[60px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-7 md:p-10">
          {/* Left */}
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2"
            >
              {getGreeting()},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">{user?.name}</span> 👋
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="text-slate-400 text-sm max-w-md mb-6">
              Here's what's happening with your courses today. Keep up the great work!
            </motion.p>

            {/* Stats pills */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="flex flex-wrap gap-3">
              <div className="bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <FaRupeeSign className="text-emerald-400 text-sm" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Today's Earnings</p>
                  <p className="text-lg font-bold text-emerald-400">₹{earningsGraphData?.[0]?.earnings || 0}</p>
                </div>
              </div>
              <div className="bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <FaUsers className="text-indigo-400 text-sm" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Total Students</p>
                  <p className="text-lg font-bold text-indigo-400">{totalStudents}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 3D Character */}
          <motion.div
            className="hidden md:block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
          >
            <motion.img
              src="/mentor-3d.png"
              alt="3D Mentor"
              className="w-100 h-64 object-contain drop-shadow-[0_0_40px_rgba(16,185,129,0.2)]"
              animate={{ y: [0, -10, 0] }}

            />
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════ STATS GRID ══════════ */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Courses" value={totalCourses} icon={FaBook} gradient="#6366F1" iconBg="bg-indigo-100 text-indigo-600" delay={0.1} trend={5} />
        <StatCard label="Total Students" value={totalStudents} icon={FaUsers} gradient="#3B82F6" iconBg="bg-blue-100 text-blue-600" delay={0.15} trend={12} />
        <StatCard label="Total Earnings" value={totalEarnings} icon={FaRupeeSign} gradient="#10B981" iconBg="bg-emerald-100 text-emerald-600" delay={0.2} trend={20} />
        <StatCard label="Active Courses" value={activeCourses} icon={FaCheckCircle} gradient="#F59E0B" iconBg="bg-amber-100 text-amber-600" delay={0.25} />
      </div>

      {/* ══════════ CHARTS ROW ══════════ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-[20px] p-5 md:p-6 border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800">Revenue Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days performance</p>
            </div>
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              {['weekly', 'monthly'].map(m => (
                <button key={m} onClick={() => setChartMode(m)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${chartMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 md:h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dx={-5} width={45} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="earnings" stroke="#10B981" strokeWidth={3} fill="url(#dashGrad)" dot={false} activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <FaChartLine className="text-3xl mb-2 text-slate-300" />
                <p className="text-sm">No data yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Donut Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-[20px] p-5 md:p-6 border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-800 mb-1">Course Categories</h2>
          <p className="text-xs text-slate-400 mb-4">Distribution by type</p>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CATEGORIES} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={4} dataKey="value" stroke="none">
                  {CATEGORIES.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-extrabold text-slate-900">{totalCatValue}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {CATEGORIES.map((c, i) => (
              <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs font-medium text-slate-600 truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ══════════ BOTTOM ROW ══════════ */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Activity Feed - Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-[20px] p-5 md:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800">Recent Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest enrollments & events</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Live</span>
          </div>

          {recentActivities?.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center"><FaUsers className="text-xl text-slate-300" /></div>
              <p className="text-slate-500 text-sm font-medium">No recent activity</p>
              <p className="text-slate-400 text-xs mt-1">New enrollments will appear here</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-100" />
              <div className="space-y-1">
                {recentActivities?.map((a, i) => (
                  <motion.div
                    key={a.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.07 }}
                    className="relative flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    {/* Dot */}
                    <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-500 text-sm shrink-0 group-hover:scale-110 transition-transform ring-4 ring-white">
                      <FaUsers />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 leading-snug">{a.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[11px] text-slate-400">{new Date(a.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {a.amount > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+₹{a.amount}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-white rounded-[20px] p-5 md:p-6 border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-1">Quick Actions</h2>
          <p className="text-xs text-slate-400 mb-5">Jump to common tasks</p>
          <div className="space-y-3">
            {[
              { to: '/mentor/create', icon: FaPlusCircle, label: 'Create Course', desc: 'Draft a new program', gradient: 'from-emerald-500 to-green-600', iconBg: 'bg-emerald-100 text-emerald-600', hoverBorder: 'hover:border-emerald-200' },
              { to: '/mentor/earnings', icon: FaRupeeSign, label: 'View Earnings', desc: 'Check revenue reports', gradient: 'from-indigo-500 to-violet-600', iconBg: 'bg-indigo-100 text-indigo-600', hoverBorder: 'hover:border-indigo-200' },
              { to: '/mentor/analytics', icon: FaChartPie, label: 'Analytics', desc: 'Detailed performance', gradient: 'from-amber-500 to-orange-600', iconBg: 'bg-amber-100 text-amber-600', hoverBorder: 'hover:border-amber-200' },
            ].map((item, i) => (
              <motion.div key={i} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                <Link to={item.to}
                  className={`flex items-center gap-4 p-4 rounded-2xl border border-slate-100 ${item.hoverBorder} hover:bg-slate-50 transition-all group`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg} group-hover:scale-110 transition-transform`}>
                    <item.icon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <FaArrowUp className="text-slate-300 rotate-45 text-xs group-hover:text-slate-500 transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Insight card */}
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <FaBolt className="text-amber-400 text-xs" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Insight</p>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {totalEarnings > 0
                  ? `Earnings up by 20% this week! You have ${activeCourses} active course${activeCourses !== 1 ? 's' : ''} performing well.`
                  : 'Create your first course to start earning. Students are waiting!'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MentorDashboard;
