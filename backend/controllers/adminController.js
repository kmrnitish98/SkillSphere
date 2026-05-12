import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// ── Redis Cache & Session Integration ────────────────────
import { getCache, setCache, deleteCache } from '../services/cacheService.js';
import { storeSession } from '../services/sessionService.js';

// ── Cache Key Constants ──────────────────────────────────
const CACHE_KEYS = {
  DASHBOARD_STATS: 'admin:dashboard',
  COURSE_ANALYTICS: 'admin:courses:analytics',
  REVENUE_ANALYTICS: (range) => `admin:revenue:${range}`,
};

// ─────────────────────────────────────────────────────────
//  @desc    Admin login (separate from public login route)
//  @route   POST /api/admin/login
//  @access  Public (but only admins can authenticate)
// ─────────────────────────────────────────────────────────
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user with this email AND role === 'admin'
    const admin = await User.findOne({ email, role: 'admin' });

    if (!admin) {
      // Intentionally vague — don't reveal whether the email exists
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(admin._id);

    // ── REDIS: Store admin session ──────────────────────
    await storeSession(admin._id.toString(), token);

    res.json({
      success: true,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
//  @desc    Get admin profile
//  @route   GET /api/admin/profile
//  @access  Private/Admin
// ─────────────────────────────────────────────────────────
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select('-password');

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
//  @desc    Get dashboard stats (admin only)
//  @route   GET /api/admin/dashboard
//  @access  Private/Admin
// ─────────────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    // ── CACHE: Dashboard stats with short TTL ───────────
    // Admin stats update frequently but are expensive to compute
    const cached = await getCache(CACHE_KEYS.DASHBOARD_STATS);
    if (cached) {
      console.log(`⚡ Cache HIT: ${CACHE_KEYS.DASHBOARD_STATS}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${CACHE_KEYS.DASHBOARD_STATS}`);
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const pendingVerifications = await User.countDocuments({ verificationStatus: 'pending' });

    const response = {
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalMentors,
        pendingVerifications,
      },
    };

    // Cache dashboard stats for 2 minutes (frequent changes)
    await setCache(CACHE_KEYS.DASHBOARD_STATS, response, 120);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  @desc    Get per-course analytics (Admin)
//  @route   GET /api/admin/courses/analytics
//  @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminCourseAnalytics = async (req, res) => {
  try {
    // ── CACHE: Course analytics (expensive aggregation) ──
    const cached = await getCache(CACHE_KEYS.COURSE_ANALYTICS);
    if (cached) {
      console.log(`⚡ Cache HIT: ${CACHE_KEYS.COURSE_ANALYTICS}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${CACHE_KEYS.COURSE_ANALYTICS}`);

    // Import models lazily to avoid circular deps
    const { default: Course }  = await import('../models/Course.js');
    const { default: Payment } = await import('../models/Payment.js');

    // Fetch all courses (all statuses for admin view)
    const courses = await Course.find({}).populate('mentor', 'name email avatar').lean();

    // Fetch all completed payments
    const payments = await Payment.find({ status: 'completed' })
      .populate('student', 'name email avatar createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Build payment map keyed by courseId
    const paymentMap = {};
    payments.forEach(p => {
      const id = p.course?.toString();
      if (!id) return;
      if (!paymentMap[id]) paymentMap[id] = [];
      paymentMap[id].push(p);
    });

    // Enrich each course with analytics
    const enriched = courses.map(course => {
      const cid = course._id.toString();
      const cPayments = paymentMap[cid] || [];

      const totalSales   = cPayments.length;
      const totalRevenue = cPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
      const platformFee  = cPayments.reduce((acc, p) => acc + (p.platformFee || 0), 0);

      const lastPurchased = cPayments.length > 0
        ? cPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
        : null;

      // Last 7 days daily revenue for sparkline
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const revenue = cPayments
          .filter(p => {
            const pd = new Date(p.createdAt);
            return pd.getDate() === d.getDate() &&
                   pd.getMonth() === d.getMonth() &&
                   pd.getFullYear() === d.getFullYear();
          })
          .reduce((acc, p) => acc + (p.amountPaid || 0), 0);
        return { day, revenue };
      });

      // Recent 5 enrollments
      const recentEnrollments = cPayments.slice(0, 5).map(p => ({
        student: p.student?.name || 'Unknown',
        email:   p.student?.email || '',
        date:    p.createdAt,
      }));

      return {
        ...course,
        totalSales,
        totalRevenue,
        platformFee,
        lastPurchased,
        last7DaysRevenue: last7,
        recentEnrollments,
      };
    });

    const response = { success: true, data: enriched };

    // Cache course analytics for 5 minutes
    await setCache(CACHE_KEYS.COURSE_ANALYTICS, response, 300);

    res.json(response);
  } catch (error) {
    console.error('getAdminCourseAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  @desc    Get full revenue analytics (Admin)
//  @route   GET /api/v1/admin/revenue/analytics?range=7|30|today|all&from=&to=
//  @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { default: Payment } = await import('../models/Payment.js');
    const { default: Course }  = await import('../models/Course.js');

    const { range = '30', from, to } = req.query;

    // ── CACHE: Revenue analytics with range-based key ───
    const cacheKey = from && to
      ? `admin:revenue:custom:${from}:${to}`
      : CACHE_KEYS.REVENUE_ANALYTICS(range);

    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${cacheKey}`);

    // ── Date helpers ──
    const now   = new Date();
    const sod   = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const eod   = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

    const todayStart = sod(now);
    const todayEnd   = eod(now);

    const weekStart  = sod(new Date(now)); weekStart.setDate(now.getDate() - 6);
    const monthStart = sod(new Date(now)); monthStart.setDate(now.getDate() - 29);

    // Build filter date range for chart
    let filterStart, filterEnd;
    if (from && to) {
      filterStart = sod(new Date(from));
      filterEnd   = eod(new Date(to));
    } else if (range === 'today') {
      filterStart = todayStart; filterEnd = todayEnd;
    } else if (range === '7') {
      filterStart = weekStart; filterEnd = todayEnd;
    } else {
      filterStart = monthStart; filterEnd = todayEnd;
    }

    // ── Fetch all completed payments ──
    const all = await Payment.find({ status: 'completed' })
      .populate('course', 'title thumbnailUrl studentCount averageRating price')
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // ── KPIs ──
    const inRange = (p, s, e) => new Date(p.createdAt) >= s && new Date(p.createdAt) <= e;

    const kpi = (payments) => ({
      totalAmount:   payments.reduce((a, p) => a + (p.amountPaid || 0), 0),
      platformFee:   payments.reduce((a, p) => a + (p.platformFee || 0), 0),
      mentorEarnings:payments.reduce((a, p) => a + (p.mentorEarnings || 0), 0),
      count:         payments.length,
    });

    const todayPayments = all.filter(p => inRange(p, todayStart, todayEnd));
    const weekPayments  = all.filter(p => inRange(p, weekStart,  todayEnd));
    const rangePayments = all.filter(p => inRange(p, filterStart, filterEnd));

    const kpis = {
      allTime: kpi(all),
      today:   kpi(todayPayments),
      week:    kpi(weekPayments),
      range:   kpi(rangePayments),
    };

    // ── Daily chart data for selected range ──
    const dayMap = {};
    rangePayments.forEach(p => {
      const key = new Date(p.createdAt).toISOString().slice(0, 10);
      if (!dayMap[key]) dayMap[key] = { date: key, total: 0, platform: 0, mentor: 0, count: 0, transactions: [] };
      dayMap[key].total    += p.amountPaid || 0;
      dayMap[key].platform += p.platformFee || 0;
      dayMap[key].mentor   += p.mentorEarnings || 0;
      dayMap[key].count    += 1;
      dayMap[key].transactions.push({
        _id:        p._id,
        course:     p.course?.title || 'Unknown',
        thumbnail:  p.course?.thumbnailUrl || '',
        student:    p.student?.name || 'Unknown',
        email:      p.student?.email || '',
        amount:     p.amountPaid,
        platform:   p.platformFee,
        mentor:     p.mentorEarnings,
        status:     p.status,
        createdAt:  p.createdAt,
      });
    });

    // Fill every day in range (even zero revenue days)
    const chartData = [];
    const cur = new Date(filterStart);
    while (cur <= filterEnd) {
      const key   = cur.toISOString().slice(0, 10);
      const label = cur.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      chartData.push(dayMap[key]
        ? { ...dayMap[key], label }
        : { date: key, label, total: 0, platform: 0, mentor: 0, count: 0, transactions: [] }
      );
      cur.setDate(cur.getDate() + 1);
    }

    // ── Course-wise ranking ──
    const courseMap = {};
    all.forEach(p => {
      const id = p.course?._id?.toString();
      if (!id) return;
      if (!courseMap[id]) courseMap[id] = {
        _id: id,
        title:       p.course?.title || 'Unknown',
        thumbnail:   p.course?.thumbnailUrl || '',
        price:       p.course?.price || 0,
        students:    p.course?.studentCount || 0,
        rating:      p.course?.averageRating || 0,
        totalRevenue: 0, totalSales: 0, platformFee: 0,
      };
      courseMap[id].totalRevenue += p.amountPaid || 0;
      courseMap[id].totalSales   += 1;
      courseMap[id].platformFee  += p.platformFee || 0;
    });

    const courseRanking = Object.values(courseMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const grandTotal = courseRanking.reduce((a, c) => a + c.totalRevenue, 0);
    courseRanking.forEach(c => { c.revenueShare = grandTotal > 0 ? ((c.totalRevenue / grandTotal) * 100).toFixed(1) : 0; });

    const response = {
      success: true,
      data: { kpis, chartData, courseRanking, allTransactions: chartData.flatMap(d => d.transactions) },
    };

    // Cache revenue analytics for 3 minutes (financial data changes frequently)
    await setCache(cacheKey, response, 180);

    res.json(response);
  } catch (err) {
    console.error('getRevenueAnalytics:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
