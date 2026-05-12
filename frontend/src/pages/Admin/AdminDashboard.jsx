import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, BookOpen, TrendingUp, Percent, ArrowUpRight,
  ShieldCheck, Clock, UserPlus, BookMarked, CheckCircle2,
  AlertCircle, ChevronRight, Zap, Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  adminDashboardStats, getUsers, getCourses,
  getPlatformRevenue, getVerificationRequests,
} from '../../services/api';

/* ── helpers ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

/* animated count-up hook */
function useCountUp(target, duration = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    const num = parseFloat(target);
    if (isNaN(num)) { setCount(target); return; }
    let start = 0;
    const step = num / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ── Stat Card ── */
const StatCard = ({ label, value, prefix = '', suffix = '', icon: Icon, gradient, delay }) => {
  const animated = useCountUp(value);
  return (
    <motion.div {...fadeUp(delay)}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 group cursor-default"
    >
      {/* glow blob */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-35 transition-opacity ${gradient}`} />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
          <p className="text-3xl font-black text-slate-800">
            {prefix}{typeof animated === 'number' ? animated.toLocaleString() : animated}{suffix}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${gradient} shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>

      <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-emerald-600">
        <ArrowUpRight size={13} />
        <span>Live data</span>
      </div>
    </motion.div>
  );
};

/* ── Custom Recharts Tooltip ── */
const CustomTooltip = ({ active, payload, label, prefix = '₹' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-slate-100 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold text-slate-600 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {prefix}{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

/* ── Activity Item ── */
const ActivityItem = ({ icon: Icon, color, title, sub, time, delay }) => (
  <motion.div {...fadeUp(delay)} className="flex items-start gap-3">
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
      <Icon size={15} className="text-white" />
    </div>
    <div className="flex-1 min-w-0 pb-4 border-b border-slate-50 last:border-0">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
    <span className="text-[11px] text-slate-400 flex-shrink-0 pt-0.5">{time}</span>
  </motion.div>
);

/* ── Revenue chart mock ── */
const revenueData = [
  { month: 'Nov', revenue: 12400 },
  { month: 'Dec', revenue: 19800 },
  { month: 'Jan', revenue: 15600 },
  { month: 'Feb', revenue: 24100 },
  { month: 'Mar', revenue: 21300 },
  { month: 'Apr', revenue: 31500 },
];

const userGrowthData = [
  { month: 'Nov', students: 84, mentors: 12 },
  { month: 'Dec', students: 132, mentors: 18 },
  { month: 'Jan', students: 98, mentors: 15 },
  { month: 'Feb', students: 174, mentors: 22 },
  { month: 'Mar', students: 156, mentors: 19 },
  { month: 'Apr', students: 213, mentors: 31 },
];

/* ══════════════════════════════════════════ */
const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalStudents: 0, totalMentors: 0, pendingVerifications: 0 });
  const [totalCourses, setTotalCourses] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [requests, setRequests] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    adminDashboardStats()
      .then(r => setStats(r.data.data || {}))
      .catch(() => {});

    getCourses()
      .then(r => setTotalCourses((r.data.data || []).length))
      .catch(() => {});

    getPlatformRevenue()
      .then(r => setRevenue(r.data?.totalRevenue || 0))
      .catch(() => {});

    getVerificationRequests()
      .then(r => setRequests((r.data?.data || []).filter(x => x.verificationStatus === 'pending')))
      .catch(() => {});

    getUsers()
      .then(r => setRecentUsers((r.data?.data || []).slice(-5).reverse()))
      .catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, gradient: 'bg-gradient-to-br from-violet-500 to-purple-600', delay: 0.05 },
    { label: 'Total Courses', value: totalCourses, icon: BookOpen, gradient: 'bg-gradient-to-br from-sky-500 to-blue-600', delay: 0.1 },
    { label: 'Platform Revenue', value: revenue, prefix: '₹', icon: TrendingUp, gradient: 'bg-gradient-to-br from-emerald-500 to-green-600', delay: 0.15 },
    { label: 'Revenue Share', value: 20, suffix: '%', icon: Percent, gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', delay: 0.2 },
  ];

  return (
    <div className="space-y-8 pb-10">

      {/* ── Hero Banner ── */}
      <motion.div {...fadeUp(0)}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #134e35 50%, #052e16 100%)' }}
      >
        {/* mesh blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Activity size={12} /> SkillSphere Admin
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
              Welcome back, {user?.name} 👋
            </h1>
            <p className="mt-2 text-slate-300 text-sm max-w-lg">
              Here's what's happening on your platform today. Everything looks great!
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link to="/admin/users"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all backdrop-blur"
            >
              <Users size={15} /> Users
            </Link>
            <Link to="/admin/mentor-requests"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-green-500/30"
            >
              <ShieldCheck size={15} /> Requests
              {requests.length > 0 && (
                <span className="bg-white text-green-700 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {requests.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Revenue Line Chart (3 cols) */}
        <motion.div {...fadeUp(0.25)} className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100/80 transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Revenue Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Platform earnings (last 6 months)</p>
            </div>
            <span className="text-xs bg-green-50 text-green-700 font-semibold px-3 py-1 rounded-full border border-green-100">
              +24.5%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* User Growth Bar Chart (2 cols) */}
        <motion.div {...fadeUp(0.3)} className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100/80 transition-shadow">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-800">User Growth</h2>
            <p className="text-xs text-slate-400 mt-0.5">Students vs Mentors</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={userGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip prefix="" />} />
              <Bar dataKey="students" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mentors" fill="#a3e635" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Students</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-lime-400 inline-block" />Mentors</span>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Revenue Model Card */}
        <motion.div {...fadeUp(0.35)} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Revenue Model</h2>
              <p className="text-xs text-slate-400">Per transaction split</p>
            </div>
          </div>

          {/* Split Visual */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="text-slate-700">Mentor Earnings</span>
                <span className="text-green-600">80%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: '80%' }}
                  transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="text-slate-700">Platform Fee</span>
                <span className="text-amber-600">20%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: '20%' }}
                  transition={{ duration: 1.2, delay: 0.7, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-2xl font-black text-green-600">80%</p>
              <p className="text-xs text-green-700 font-medium mt-0.5">To Mentors</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border amber-100">
              <p className="text-2xl font-black text-amber-600">20%</p>
              <p className="text-xs text-amber-700 font-medium mt-0.5">Platform Share</p>
            </div>
          </div>
        </motion.div>

        {/* Mentor Requests Preview */}
        <motion.div {...fadeUp(0.4)} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800">Mentor Requests</h2>
              <p className="text-xs text-slate-400 mt-0.5">{requests.length} awaiting review</p>
            </div>
            <Link to="/admin/mentor-requests"
              className="flex items-center gap-1 text-xs text-green-600 font-semibold hover:text-green-700 transition-colors"
            >
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={22} className="text-green-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 3).map((req, i) => (
                <motion.div key={req._id} {...fadeUp(0.45 + i * 0.05)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-green-50 hover:border-green-100 transition-colors group"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(req.verificationData?.fullName || req.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{req.verificationData?.fullName || req.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {Array.isArray(req.verificationData?.expertise)
                        ? req.verificationData.expertise.slice(0, 2).join(', ')
                        : req.verificationData?.expertise || 'No expertise listed'}
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0">Pending</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div {...fadeUp(0.45)} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800">Recent Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest platform events</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          <div className="space-y-1">
            {recentUsers.length > 0 ? recentUsers.slice(0, 4).map((u, i) => (
              <ActivityItem
                key={u._id}
                icon={u.role === 'mentor' ? BookMarked : UserPlus}
                color={u.role === 'mentor' ? 'bg-blue-500' : 'bg-green-500'}
                title={u.role === 'mentor' ? `${u.name} joined as mentor` : `${u.name} registered`}
                sub={u.email}
                time={new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                delay={0.5 + i * 0.05}
              />
            )) : (
              <>
                <ActivityItem icon={UserPlus} color="bg-green-500" title="New student registered" sub="Platform activity" time="Just now" delay={0.5} />
                <ActivityItem icon={BookMarked} color="bg-blue-500" title="Course published" sub="Mentor created content" time="2m ago" delay={0.55} />
                <ActivityItem icon={CheckCircle2} color="bg-emerald-500" title="Mentor verified" sub="Application approved" time="5m ago" delay={0.6} />
                <ActivityItem icon={AlertCircle} color="bg-amber-500" title="Pending review" sub="New verification request" time="12m ago" delay={0.65} />
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Quick Actions Row ── */}
      <motion.div {...fadeUp(0.5)} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-5">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Manage Users', icon: Users, to: '/admin/users', color: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
            { label: 'Manage Courses', icon: BookOpen, to: '/admin/courses', color: 'from-sky-500 to-blue-600', light: 'bg-sky-50 text-sky-700 hover:bg-sky-100' },
            { label: 'Mentor Requests', icon: ShieldCheck, to: '/admin/mentor-requests', color: 'from-emerald-500 to-green-600', light: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
            { label: 'View Revenue', icon: TrendingUp, to: '/admin/revenue', color: 'from-amber-400 to-orange-500', light: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
          ].map(({ label, icon: Icon, to, light }) => (
            <Link key={to} to={to}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group ${light}`}
            >
              <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon size={20} className="text-current" />
              </div>
              <span className="text-xs font-bold text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

    </div>
  );
};

export default AdminDashboard;
