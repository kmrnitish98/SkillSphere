import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import { adminCourseAnalytics, deleteCourse } from '../../services/api';
import toast from 'react-hot-toast';
import {
  BookOpen, Users, TrendingUp, Star, Trash2, Search,
  X, Calendar, IndianRupee, ShoppingBag, ChevronDown,
  Flame, AlertTriangle, CheckCircle2, Clock, BarChart2,
} from 'lucide-react';

/* ── helpers ── */
const fadeUp = (d = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: d, ease: [0.22, 1, 0.36, 1] },
});

function useCountUp(target, dur = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const n = parseFloat(target);
    if (!n) { setV(target); return; }
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

/* status badge */
const StatusBadge = ({ sales }) => {
  if (sales === 0) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> No Sales
    </span>
  );
  if (sales < 5) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Low Sales
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" /> Active
    </span>
  );
};

/* mini sparkline tooltip */
const SparkTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded-lg shadow-xl">
      ₹{payload[0].value}
    </div>
  );
};

/* ── Detail Modal ── */
const DetailModal = ({ course, onClose, onDelete }) => {
  const revenue = useCountUp(course.totalRevenue || 0);
  const sales   = useCountUp(course.totalSales || 0);
  const students = useCountUp(course.studentCount || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Hero */}
        <div className="relative h-48 rounded-t-3xl overflow-hidden">
          <img src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'}
            alt={course.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur hover:bg-white/40 rounded-full flex items-center justify-center text-white transition">
            <X size={16} />
          </button>
          <div className="absolute bottom-4 left-5">
            <h2 className="text-white font-black text-xl leading-tight max-w-lg">{course.title}</h2>
            <p className="text-white/70 text-sm mt-0.5">By {course.mentor?.name || 'Mentor'}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Students', value: students, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Total Revenue', value: `₹${revenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Sales', value: sales, icon: ShoppingBag, color: 'text-sky-600', bg: 'bg-sky-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
                <Icon size={18} className={`${color} mx-auto mb-1`} />
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Sparkline chart */}
          {course.last7DaysRevenue?.some(d => d.revenue > 0) && (
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <BarChart2 size={14} className="text-green-500" /> Last 7 Days Revenue
              </p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={course.last7DaysRevenue} barCategoryGap="25%">
                  <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Tooltip content={<SparkTip />} cursor={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent enrollments */}
          {course.recentEnrollments?.length > 0 && (
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Users size={14} className="text-slate-400" /> Recent Enrollments
              </p>
              <div className="space-y-2">
                {course.recentEnrollments.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {e.student?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{e.student}</p>
                      <p className="text-xs text-slate-400 truncate">{e.email}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <Calendar size={10} />
                      {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              Rating: <span className="font-bold text-slate-700">{course.averageRating?.toFixed(1) || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <IndianRupee size={14} className="text-green-500" />
              Price: <span className="font-bold text-slate-700">₹{course.price?.toLocaleString()}</span>
            </div>
            {course.lastPurchased && (
              <div className="flex items-center gap-2 text-slate-500 col-span-2">
                <Clock size={14} className="text-blue-400" />
                Last sale: <span className="font-bold text-slate-700">
                  {new Date(course.lastPurchased).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition">
              Close
            </button>
            <button
              onClick={() => { onDelete(course._id); onClose(); }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 font-semibold text-sm transition border border-red-100"
            >
              <Trash2 size={14} /> Delete Course
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Course Card ── */
const CourseCard = ({ course, isTop, onSelect, onDelete, index }) => {
  const revenue  = useCountUp(course.totalRevenue || 0);
  const students = useCountUp(course.studentCount || 0);
  const sales    = useCountUp(course.totalSales || 0);

  return (
    <motion.div
      {...fadeUp(index * 0.04)}
      whileHover={{ y: -6, scale: 1.005 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-shadow cursor-pointer group
        ${isTop ? 'border-green-300 ring-1 ring-green-200' : 'border-slate-100'}`}
      onClick={() => onSelect(course)}
    >
      {/* Top badge */}
      {isTop && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Flame size={9} /> Top Selling
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          <StatusBadge sales={course.totalSales || 0} />
        </div>
        <div className="absolute bottom-2 left-2">
          <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
            ₹{course.price?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-slate-800 line-clamp-2 text-sm leading-snug mb-1">{course.title}</h3>
        <p className="text-xs text-slate-400 mb-3">By {course.mentor?.name || 'Mentor'}</p>

        {/* Stat badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-lg border border-violet-100">
            <Users size={10} /> {students}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-lg border border-green-100">
            <IndianRupee size={10} /> ₹{revenue.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-lg border border-sky-100">
            <ShoppingBag size={10} /> {sales} sales
          </span>
          {course.averageRating > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">
              <Star size={9} className="fill-amber-500" /> {course.averageRating?.toFixed(1)}
            </span>
          )}
        </div>

        {/* Sparkline */}
        {course.last7DaysRevenue?.some(d => d.revenue > 0) ? (
          <div className="h-10 mb-3" onClick={e => e.stopPropagation()}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={course.last7DaysRevenue} barCategoryGap="20%">
                <Bar dataKey="revenue" fill="#22c55e" radius={[2, 2, 0, 0]} />
                <Tooltip content={<SparkTip />} cursor={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-10 mb-3 flex items-center justify-center bg-slate-50 rounded-xl">
            <p className="text-[10px] text-slate-400">No sales this week</p>
          </div>
        )}

        {/* Last purchased */}
        {course.lastPurchased && (
          <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-3">
            <Clock size={9} />
            Last sale: {new Date(course.lastPurchased).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        )}

        {/* Delete btn */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(course._id); }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold transition border border-red-100 opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </motion.div>
  );
};

/* ══════════════ MAIN PAGE ══════════════ */
const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState('revenue');
  const [filter, setFilter]     = useState('all');
  const [selected, setSelected] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = () => {
    setLoading(true);
    adminCourseAnalytics()
      .then(r => setCourses(r.data.data || []))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await deleteCourse(id);
      toast.success('Course deleted');
      setConfirmId(null);
      load();
    } catch { toast.error('Delete failed'); }
  };

  /* derived values */
  const topCourse = useMemo(() =>
    [...courses].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))[0],
  [courses]);

  const totalStudents = useMemo(() => courses.reduce((a, c) => a + (c.studentCount || 0), 0), [courses]);
  const totalRevenue  = useMemo(() => courses.reduce((a, c) => a + (c.totalRevenue || 0), 0), [courses]);

  const visible = useMemo(() => {
    let d = [...courses];
    if (search) d = d.filter(c =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.mentor?.name?.toLowerCase().includes(search.toLowerCase())
    );
    if (filter === 'top')    d = d.filter(c => (c.totalSales || 0) >= 5);
    if (filter === 'low')    d = d.filter(c => (c.totalSales || 0) > 0 && (c.totalSales || 0) < 5);
    if (filter === 'nosale') d = d.filter(c => (c.totalSales || 0) === 0);
    if (sort === 'revenue')  d.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
    if (sort === 'students') d.sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));
    if (sort === 'sales')    d.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
    return d;
  }, [courses, search, filter, sort]);

  /* Summary counters */
  const cTotal    = useCountUp(courses.length);
  const cStudents = useCountUp(totalStudents);
  const cRevenue  = useCountUp(totalRevenue);

  return (
    <div className="space-y-7 pb-12">

      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-black text-slate-900">Course Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Performance dashboard for all {courses.length} courses</p>
      </motion.div>

      {/* Summary */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Courses',   value: cTotal,              icon: BookOpen,    bg: 'from-sky-500 to-blue-600' },
          { label: 'Total Students',  value: cStudents,           icon: Users,       bg: 'from-violet-500 to-purple-600' },
          { label: 'Total Revenue',   value: `₹${cRevenue.toLocaleString()}`, icon: TrendingUp,  bg: 'from-emerald-500 to-green-600' },
          { label: 'Top Course',      value: topCourse?.title?.split(' ').slice(0, 3).join(' ') + '…' || '—', icon: Flame, bg: 'from-amber-400 to-orange-500' },
        ].map(({ label, value, icon: Icon, bg }, i) => (
          <motion.div key={label} {...fadeUp(0.05 + i * 0.05)}
            whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg group"
          >
            <div className={`absolute -top-5 -right-5 w-20 h-20 bg-gradient-to-br ${bg} rounded-full blur-2xl opacity-15 group-hover:opacity-30 transition-opacity`} />
            <div className="flex items-start justify-between relative">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-lg font-black text-slate-800 truncate">{value}</p>
              </div>
              <div className={`w-10 h-10 bg-gradient-to-br ${bg} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                <Icon size={17} className="text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or mentor..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition"
          />
        </div>

        <div className="relative">
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="w-full sm:w-36 pr-7 pl-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300 appearance-none transition">
            <option value="all">All Courses</option>
            <option value="top">Top Selling</option>
            <option value="low">Low Sales</option>
            <option value="nosale">No Sales</option>
          </select>
        </div>

        <div className="relative">
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="w-full sm:w-36 pr-7 pl-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300 appearance-none transition">
            <option value="revenue">By Revenue</option>
            <option value="students">By Students</option>
            <option value="sales">By Sales</option>
          </select>
        </div>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-slate-100 rounded-2xl h-72 animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <motion.div {...fadeUp(0.15)} className="bg-white rounded-2xl p-16 text-center border border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={26} className="text-slate-300" />
          </div>
          <p className="font-semibold text-slate-700">No courses found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting search or filters</p>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visible.map((c, i) => (
              <CourseCard
                key={c._id} course={c} index={i}
                isTop={topCourse?._id === c._id && (c.totalSales || 0) > 0}
                onSelect={setSelected}
                onDelete={(id) => setConfirmId(id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            course={selected}
            onClose={() => setSelected(null)}
            onDelete={(id) => { setConfirmId(id); setSelected(null); }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setConfirmId(null)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">Delete Course?</h3>
              <p className="text-sm text-slate-500 text-center mt-2">This will permanently remove the course. This cannot be undone.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={() => handleDelete(confirmId)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-md shadow-red-500/20">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageCourses;
