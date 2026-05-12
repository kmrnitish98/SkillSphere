import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { revenueAnalytics } from '../../services/api';
import {
  TrendingUp, IndianRupee, CreditCard, Percent,
  ArrowUpRight, ChevronRight, Star,
  Users, Calendar, Search, CheckCircle2,
  BarChart2, Activity, PieChart as PieIcon,
} from 'lucide-react';

/* ── helpers ── */
const fu = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: d, ease: [0.22, 1, 0.36, 1] },
});

function useCountUp(target, dur = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const n = parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (!n) { setV(0); return; }
    let cur = 0;
    const step = n / (dur / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= n) { setV(n); clearInterval(t); }
      else setV(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return v;
}

const medals = ['🥇', '🥈', '🥉'];

/* ── Custom Tooltip ── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-2xl text-sm min-w-[160px]">
      <p className="font-bold text-slate-600 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: ₹{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

/* ── KPI Card ── */
const KpiCard = ({ label, amount, count, icon: Icon, gradient, delay, suffix = '' }) => {
  const animated = useCountUp(amount || 0);
  return (
    <motion.div {...fu(delay)}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 group cursor-default"
    >
      <div className={`absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-br ${gradient} rounded-full blur-2xl opacity-15 group-hover:opacity-30 transition-opacity`} />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
          <p className="text-2xl font-black text-slate-800">{suffix}₹{animated.toLocaleString()}</p>
          {count !== undefined && <p className="text-xs text-slate-400 mt-1">{count} transactions</p>}
        </div>
        <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon size={19} className="text-white" />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-emerald-600">
        <ArrowUpRight size={12} /> Live
      </div>
    </motion.div>
  );
};

/* ── Daily Row ── */
const DayRow = ({ day, grandTotal }) => {
  const [open, setOpen] = useState(false);
  const share = grandTotal > 0 ? ((day.total / grandTotal) * 100).toFixed(1) : 0;
  return (
    <div className="border-b border-slate-50 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group"
      >
        <Calendar size={13} className="text-slate-300 flex-shrink-0" />
        <span className="text-sm text-slate-600 w-24 flex-shrink-0">{day.label}</span>
        <span className="text-sm font-bold text-slate-800 flex-1">₹{day.total.toLocaleString()}</span>
        <span className="text-xs text-slate-400 hidden sm:block">{day.count} sales</span>
        <span className="text-xs font-semibold text-green-600 hidden md:block">{share}%</span>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={14} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && day.transactions?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden bg-slate-50/60"
          >
            {day.transactions.map((t, i) => (
              <div key={i} className="flex items-center gap-4 px-8 py-2.5 border-b border-slate-100 last:border-0">
                <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                  {t.thumbnail && <img src={t.thumbnail} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="text-xs text-slate-700 font-medium flex-1 truncate">{t.course}</span>
                <span className="text-xs text-slate-500 hidden sm:block truncate max-w-[100px]">{t.student}</span>
                <span className="text-xs font-bold text-slate-800">₹{t.amount?.toLocaleString()}</span>
                <span className="text-xs text-sky-600">₹{t.mentor?.toLocaleString()}</span>
                <span className="text-xs text-green-600 font-semibold">₹{t.platform?.toLocaleString()}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                  <CheckCircle2 size={8} /> {t.status}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   CHART PANEL — Area · Bar · Donut with tab switcher
───────────────────────────────────────────────────────── */
const CHART_TABS = [
  { key: 'area',  label: 'Area Trend', icon: Activity },
  { key: 'bar',   label: 'Bar Chart',  icon: BarChart2 },
  { key: 'donut', label: 'Donut',      icon: PieIcon },
];

const DONUT_COLORS = ['#22c55e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

const DonutTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-2xl text-sm">
      <p className="font-bold text-slate-700 mb-1">{p.name}</p>
      <p className="font-black" style={{ color: p.payload.fill }}>₹{Number(p.value).toLocaleString()}</p>
      <p className="text-xs text-slate-400">{p.payload.share}% of total</p>
    </div>
  );
};

const ChartPanel = ({ chartData = [], courseRanking = [], kpis }) => {
  const [tab, setTab] = useState('area');
  const hasData = chartData?.some(d => d.total > 0);

  /* donut data — top 5 courses by revenue */
  const grandTotal = courseRanking.reduce((a, c) => a + c.totalRevenue, 0);
  const donutData = courseRanking.slice(0, 5).map((c, i) => ({
    name: c.title?.length > 22 ? c.title.slice(0, 22) + '…' : c.title,
    value: c.totalRevenue,
    fill: DONUT_COLORS[i % DONUT_COLORS.length],
    share: grandTotal > 0 ? ((c.totalRevenue / grandTotal) * 100).toFixed(1) : 0,
  }));

  return (
    <motion.div {...fu(0.2)} className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow">
      {/* Header + tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-800">Revenue Charts</h2>
          <p className="text-xs text-slate-400 mt-0.5">Switch between chart types</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {CHART_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === key ? 'text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === key && (
                <motion.div
                  layoutId="chartTabBg"
                  className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-md shadow-green-500/25"
                />
              )}
              <span className="relative"><Icon size={13} /></span>
              <span className="relative hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart content */}
      <AnimatePresence mode="wait">
        {!hasData && tab !== 'donut' ? (
          <motion.div key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl"
          >
            <p className="text-slate-400 text-sm">No revenue data for selected range</p>
          </motion.div>
        ) : tab === 'area' ? (
          <motion.div key="area" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMentor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPlatform" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="total"    name="Total Sale"    stroke="#22c55e" strokeWidth={2.5} fill="url(#gTotal)"    dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="mentor"   name="Mentor (80%)"  stroke="#0ea5e9" strokeWidth={2}   fill="url(#gMentor)"   dot={false} />
                <Area type="monotone" dataKey="platform" name="Platform (20%)" stroke="#f59e0b" strokeWidth={2}  fill="url(#gPlatform)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        ) : tab === 'bar' ? (
          <motion.div key="bar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }} barCategoryGap="30%">
                <defs>
                  <linearGradient id="bTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#22c55e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="bMentor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#0ea5e9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="bPlatform" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fcd34d" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="total"    name="Total Sale"    fill="url(#bTotal)"    radius={[6, 6, 0, 0]} />
                <Bar dataKey="mentor"   name="Mentor (80%)"  fill="url(#bMentor)"   radius={[6, 6, 0, 0]} />
                <Bar dataKey="platform" name="Platform (20%)" fill="url(#bPlatform)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          /* DONUT — course revenue share */
          <motion.div key="donut" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35 }}>
            {!donutData.length ? (
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl">
                <p className="text-slate-400 text-sm">No course revenue data yet</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <defs>
                      {donutData.map((d, i) => (
                        <radialGradient key={i} id={`dg${i}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%"   stopColor={d.fill} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={d.fill} stopOpacity={0.6} />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie
                      data={donutData} cx="50%" cy="50%"
                      innerRadius="52%" outerRadius="78%"
                      paddingAngle={3} dataKey="value"
                      animationBegin={0} animationDuration={900}
                    >
                      {donutData.map((d, i) => (
                        <Cell key={i} fill={`url(#dg${i})`} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-col gap-2.5 min-w-[160px]">
                  {donutData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{d.name}</p>
                        <p className="text-[10px] text-slate-400">₹{d.value.toLocaleString()} · {d.share}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ══════════════ MAIN ══════════════ */
const RevenuePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const load = useCallback(() => {
    setLoading(true);
    const params = from && to ? { from, to } : { range };
    revenueAnalytics(params)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range, from, to]);

  useEffect(() => { load(); setPage(1); }, [load]);

  const { kpis, chartData, courseRanking, allTransactions } = data || {};

  /* filtered transactions */
  const filteredTx = useMemo(() => {
    if (!allTransactions) return [];
    if (!search) return allTransactions;
    const q = search.toLowerCase();
    return allTransactions.filter(t =>
      t.course?.toLowerCase().includes(q) || t.student?.toLowerCase().includes(q)
    );
  }, [allTransactions, search]);

  const totalPages = Math.ceil(filteredTx.length / PER_PAGE);
  const pagedTx = filteredTx.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const grandDay = (chartData || []).reduce((a, d) => a + d.total, 0);

  /* Revenue model animated bars */
  const mentorTotal = useCountUp(kpis?.allTime?.mentorEarnings || 0);
  const platTotal   = useCountUp(kpis?.allTime?.platformFee || 0);

  const RANGES = [
    { key: 'today', label: 'Today' },
    { key: '7',     label: '7 Days' },
    { key: '30',    label: '30 Days' },
  ];

  return (
    <div className="space-y-7 pb-12">

      {/* Header */}
      <motion.div {...fu(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Revenue Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time platform earnings & transaction insights</p>
        </div>
        {/* Time Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map(r => (
            <button key={r.key} onClick={() => { setRange(r.key); setFrom(''); setTo(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                range === r.key && !from
                  ? 'bg-green-500 text-white shadow-md shadow-green-500/25'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-600'
              }`}
            >{r.label}</button>
          ))}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setRange(''); }}
              className="text-xs text-slate-600 outline-none bg-transparent" />
            <span className="text-slate-300">—</span>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setRange(''); }}
              className="text-xs text-slate-600 outline-none bg-transparent" />
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse col-span-1" />
        )) : [
          { label: 'All-Time Revenue',  amount: kpis?.allTime?.totalAmount,   count: kpis?.allTime?.count,  icon: IndianRupee, gradient: 'from-emerald-500 to-green-600' },
          { label: "Today's Revenue",   amount: kpis?.today?.totalAmount,     count: kpis?.today?.count,    icon: TrendingUp,  gradient: 'from-sky-500 to-blue-600' },
          { label: 'This Week',         amount: kpis?.week?.totalAmount,      count: kpis?.week?.count,     icon: Calendar,    gradient: 'from-violet-500 to-purple-600' },
          { label: 'Range Revenue',     amount: kpis?.range?.totalAmount,     count: kpis?.range?.count,    icon: CreditCard,  gradient: 'from-pink-500 to-rose-600' },
          { label: 'Platform (20%)',    amount: kpis?.allTime?.platformFee,   icon: Percent,                gradient: 'from-amber-400 to-orange-500' },
          { label: 'Mentor Share (80%)',amount: kpis?.allTime?.mentorEarnings,icon: Users,                  gradient: 'from-teal-500 to-cyan-600' },
        ].map((c, i) => <KpiCard key={c.label} {...c} delay={0.05 + i * 0.05} />)}
      </div>

      {/* ── Multi-Chart Section ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <ChartPanel chartData={chartData} courseRanking={courseRanking} kpis={kpis} />

        {/* Revenue Model */}
        <motion.div {...fu(0.25)} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-800 mb-1">Revenue Split</h2>
          <p className="text-xs text-slate-400 mb-6">All-time 80/20 distribution</p>
          <div className="space-y-5 flex-1">
            {[
              { label: 'Mentor Share', pct: 80, amount: mentorTotal, color: 'from-green-400 to-emerald-500', textColor: 'text-green-600' },
              { label: 'Platform Fee', pct: 20, amount: platTotal,   color: 'from-amber-400 to-orange-500',  textColor: 'text-amber-600' },
            ].map(({ label, pct, amount, color, textColor }) => (
              <div key={label}>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-700">{label}</span>
                  <span className={textColor}>{pct}%</span>
                </div>
                <div className="h-3.5 rounded-full bg-slate-100 overflow-hidden mb-1">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${color} rounded-full`}
                  />
                </div>
                <p className="text-xs text-slate-400">₹{amount.toLocaleString()} earned</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
            <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-1">Auto Split</p>
            <p className="text-sm text-green-700">Every sale: <strong>80%</strong> → Mentor · <strong>20%</strong> → Platform via Stripe.</p>
          </div>
        </motion.div>
      </div>

      {/* Top Earning Courses */}
      {!!courseRanking?.length && (
        <motion.div {...fu(0.3)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Top Earning Courses</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by all-time revenue</p>
          </div>
          <div className="divide-y divide-slate-50">
            {courseRanking.map((c, i) => (
              <motion.div key={c._id} {...fu(0.35 + i * 0.04)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors group"
              >
                <span className="text-2xl flex-shrink-0 w-8">{medals[i] || `#${i + 1}`}</span>
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  {c.thumbnail && <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate text-sm">{c.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Users size={10}/> {c.students}</span>
                    {c.rating > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><Star size={10} className="fill-yellow-400 text-yellow-400"/>{c.rating?.toFixed(1)}</span>}
                    <span className="text-xs text-slate-400">{c.totalSales} sales</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${c.revenueShare}%` }}
                        transition={{ duration: 1, delay: 0.4 + i * 0.05 }}
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{c.revenueShare}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-black text-slate-800">₹{c.totalRevenue?.toLocaleString()}</p>
                  <p className="text-xs text-green-600 font-semibold">+₹{c.platformFee?.toLocaleString()} fee</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Daily Revenue Breakdown */}
      {!!chartData?.filter(d => d.total > 0).length && (
        <motion.div {...fu(0.35)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Daily Revenue Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click a row to expand transactions</p>
          </div>
          <div className="divide-y divide-slate-50">
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-2 bg-slate-50/60">
              <span className="w-4 flex-shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">Date</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-1">Revenue</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Txns</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:block">Share</span>
              <span className="w-4 flex-shrink-0" />
            </div>
            {[...chartData].reverse().filter(d => d.total > 0).map((day, i) => (
              <DayRow key={day.date} day={day} grandTotal={grandDay} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Transactions Table */}
      <motion.div {...fu(0.4)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800">All Transactions</h2>
            <p className="text-xs text-slate-400 mt-0.5">{filteredTx.length} records</p>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search course or student..."
              className="pl-8 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition w-60"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : !pagedTx.length ? (
          <div className="py-16 text-center">
            <CreditCard size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    {['Date','Course','Student','Total','Mentor (80%)','Platform (20%)','Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pagedTx.map((t, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {t.thumbnail && <img src={t.thumbnail} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />}
                          <span className="text-slate-700 font-medium truncate max-w-[140px]">{t.course}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs truncate max-w-[100px]">{t.student}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">₹{t.amount?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-sky-600 font-semibold">₹{t.mentor?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-green-600 font-bold">₹{t.platform?.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-green-100">
                          <CheckCircle2 size={9} /> {t.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition">
                    Prev
                  </button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default RevenuePage;
