import { useEffect, useState, useRef } from 'react';
import { getMentorEarnings } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  FaRupeeSign, FaChartLine, FaWallet, FaDownload,
  FaArrowUp, FaArrowDown, FaClock, FaSearch, FaFilter,
  FaCheckCircle, FaRegClock, FaTrophy, FaChartBar,
  FaCalendarAlt, FaCreditCard, FaRocket, FaFireAlt
} from 'react-icons/fa';

/* ─── Animated Counter Hook ─── */
const useCounter = (end, duration = 1500) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!end) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
};

/* ─── Dummy weekly data generator ─── */
const generateWeeklyData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(d => ({
    name: d,
    earnings: Math.floor(Math.random() * 5000) + 1000
  }));
};

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/30 rounded-2xl px-4 py-3 shadow-2xl">
      <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
      <p className="text-emerald-400 text-lg font-bold">₹{payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ title, value, prefix = '₹', icon: Icon, gradient, image, delay = 0, trend }) => {
  const animatedValue = useCounter(typeof value === 'number' ? value : 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`relative overflow-hidden rounded-[20px] p-5 cursor-pointer group ${gradient}`}
      style={{ minHeight: 140 }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Floating orb */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />

      <div className="relative z-10 flex items-start justify-between h-full">
        <div className="flex flex-col justify-between h-full">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white/90 text-lg mb-3">
            <Icon />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              {prefix}{typeof value === 'number' ? animatedValue.toLocaleString() : value}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{title}</p>
              {trend && (
                <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {trend > 0 ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {image && (
          <motion.img
            src={image}
            alt=""
            className="w-24 h-24 object-contain drop-shadow-2xl"
            initial={{ rotate:0 }}
            whileHover={{ rotate:0, scale: 1.5 }}
            transition={{ type: 'spring', stiffness: 200 }}
          />
        )}
      </div>
    </motion.div>
  );
};

/* ─── Main Component ─── */
const EarningsPage = () => {
  const [data, setData] = useState({ totalEarnings: 0, count: 0, data: [], chartData: [] });
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('monthly');
  const [weeklyData] = useState(generateWeeklyData());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    getMentorEarnings()
      .then(res => setData(res.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-slate-700" />
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" />
        <div className="absolute inset-2 w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
      </div>
    </div>
  );

  const transactions = data.data || [];
  const totalEarnings = data.totalEarnings || 0;
  const totalSales = data.count || 0;
  const chartData = chartMode === 'monthly' ? (data.chartData || []) : weeklyData;

  // Next payout
  const payoutDate = new Date();
  payoutDate.setDate(payoutDate.getDate() + 7);

  // Countdown
  const now = new Date();
  const diff = payoutDate - now;
  const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((diff / (1000 * 60 * 60)) % 24);

  // Best course
  const courseMap = {};
  transactions.forEach(t => {
    const name = t.course?.title || 'Unknown';
    courseMap[name] = (courseMap[name] || 0) + (t.mentorEarnings || 0);
  });
  const bestCourse = Object.entries(courseMap).sort((a, b) => b[1] - a[1])[0];

  // Filtered transactions
  const filtered = transactions.filter(t => {
    const matchSearch = !searchTerm || (t.course?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const status = t.status || 'completed';
    const matchFilter = filterStatus === 'all' || status.toLowerCase() === filterStatus;
    return matchSearch && matchFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-8"
    >
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Earnings & Payouts
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track your revenue, manage withdrawals and grow your income.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          disabled={totalEarnings === 0}
          className="bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-40 text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
        >
          <FaDownload /> Withdraw Funds
        </motion.button>
      </motion.div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Available Balance"
          value={totalEarnings}
          icon={FaRupeeSign}
          gradient="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600"
          image="/earnings-character.png"
          delay={0}
          trend={12}
        />
        <StatCard
          title="Total Sales"
          value={totalSales}
          prefix=""
          icon={FaChartLine}
          gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600"
          image="/sales-illustration.png"
          delay={0.1}
          trend={8}
        />
        <StatCard
          title="Revenue Share"
          value="80%"
          prefix=""
          icon={FaWallet}
          gradient="bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500"
          image="/revenue-illustration.png"
          delay={0.2}
        />
      </div>

      {/* ─── Chart + Payout ─── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-[20px] p-5 sm:p-6 border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Earnings Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Revenue trend over time</p>
            </div>
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
              {['monthly', 'weekly'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${chartMode === mode
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dx={-5} width={50} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#earningsGrad)"
                    dot={false}
                    activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <FaChartBar className="text-4xl mb-3 text-slate-300" />
                <p className="text-sm font-medium">No earnings data yet</p>
                <p className="text-xs mt-1">Start selling courses to see your chart</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Next Payout Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative rounded-[20px] p-6 overflow-hidden flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          }}
        >
          {/* Decorative orbs */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <FaRocket className="text-emerald-400 text-sm" />
              </div>
              <h3 className="text-white font-bold text-sm">Next Payout</h3>
            </div>

            <p className="text-4xl font-extrabold text-emerald-400 tracking-tight">
              ₹{totalEarnings.toLocaleString()}
            </p>
            <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1.5">
              <FaCalendarAlt className="text-emerald-500/70" />
              {payoutDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            {/* Countdown */}
            <div className="flex gap-3 mt-5">
              {[
                { val: daysLeft, label: 'Days' },
                { val: hoursLeft, label: 'Hours' },
              ].map((t, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm">
                  <p className="text-xl font-extrabold text-white">{t.val}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{t.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="relative z-10 mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <FaCreditCard className="text-emerald-400 text-sm" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Bank Transfer</p>
                <p className="text-slate-400 text-xs">**** **** **** 4567</p>
              </div>
            </div>
            <button className="text-emerald-400 text-xs font-bold mt-3 hover:text-emerald-300 transition-colors">
              Change Method →
            </button>
          </div>
        </motion.div>
      </div>

      {/* ─── Insights Row ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            icon: FaArrowUp,
            label: 'Growth',
            value: '+12.5%',
            desc: 'vs last month',
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            ring: 'ring-emerald-100'
          },
          {
            icon: FaTrophy,
            label: 'Best Course',
            value: bestCourse ? bestCourse[0].slice(0, 18) : 'N/A',
            desc: bestCourse ? `₹${bestCourse[1].toLocaleString()} earned` : 'No data',
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            ring: 'ring-amber-100'
          },
          {
            icon: FaClock,
            label: 'Next Payout',
            value: `${daysLeft}d ${hoursLeft}h`,
            desc: 'Until withdrawal',
            color: 'text-violet-500',
            bg: 'bg-violet-50',
            ring: 'ring-violet-100'
          },
          {
            icon: FaFireAlt,
            label: 'Avg. Per Sale',
            value: totalSales > 0 ? `₹${Math.round(totalEarnings / totalSales).toLocaleString()}` : '₹0',
            desc: 'Per transaction',
            color: 'text-rose-500',
            bg: 'bg-rose-50',
            ring: 'ring-rose-100'
          }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.08 }}
            className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${item.bg} ring-1 ${item.ring} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                <p className="text-sm font-bold text-slate-800 truncate">{item.value}</p>
                <p className="text-[11px] text-slate-400">{item.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Weekly Mini Bar + Transaction Table ─── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Sales Mini Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm"
        >
          <h3 className="font-bold text-slate-800 text-sm mb-1">Weekly Sales</h3>
          <p className="text-xs text-slate-400 mb-4">This week's breakdown</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="earnings" fill="url(#barGrad)" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-800">Transaction History</h2>
                <p className="text-xs text-slate-400 mt-0.5">{filtered.length} transactions found</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 w-36 sm:w-44 bg-slate-50"
                  />
                </div>
                {/* Filter */}
                <div className="relative">
                  <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                  >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            {filtered.length > 0 ? (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-5 py-3 text-xs">Date</th>
                    <th className="px-5 py-3 text-xs">Course</th>
                    <th className="px-5 py-3 text-xs">Amount</th>
                    <th className="px-5 py-3 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {filtered.map((t, i) => {
                      const status = (t.status || 'completed').toLowerCase();
                      return (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                        >
                          <td className="px-5 py-3.5 text-slate-400 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-500 transition-colors">
                                <FaCalendarAlt className="text-[10px]" />
                              </div>
                              {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-700 text-xs truncate max-w-[180px]">
                              {t.course?.title || 'Unknown Course'}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-emerald-600 text-xs">
                            +₹{(t.mentorEarnings || 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status === 'completed'
                                ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                                : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
                              }`}>
                              {status === 'completed' ? <FaCheckCircle /> : <FaRegClock />}
                              {status}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <FaChartLine className="text-2xl text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium text-sm">No transactions yet</p>
                <p className="text-slate-400 text-xs mt-1">Publish a course to start earning!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EarningsPage;
