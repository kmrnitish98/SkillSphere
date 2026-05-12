import Course from '../models/Course.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

// ── Redis Cache Integration ──────────────────────────────
import { getCache, setCache, deleteCache } from '../services/cacheService.js';

// ── Cache Key Constants ──────────────────────────────────
const CACHE_KEYS = {
  MENTOR_DASHBOARD: (id) => `mentor:${id}:dashboard`,
  MENTOR_COURSES: (id) => `mentor:${id}:courses`,
  MENTOR_STUDENTS: (id) => `mentor:${id}:students`,
  MENTOR_EARNINGS: (id) => `mentor:${id}:earnings`,
  MENTOR_ANALYTICS: (id) => `mentor:${id}:analytics`,
};

// @desc    Get mentor courses
// @route   GET /api/v1/mentor/courses
// @access  Private/Mentor
export const getMentorCourses = async (req, res) => {
  try {
    const cacheKey = CACHE_KEYS.MENTOR_COURSES(req.user._id);

    // ── CACHE: Try Redis first ──────────────────────────
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${cacheKey}`);
    const courses = await Course.find({ mentor: req.user._id }).sort({ createdAt: -1 });
    const response = { success: true, count: courses.length, data: courses };

    // Cache mentor courses for 5 minutes
    await setCache(cacheKey, response, 300);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get mentor dashboard stats
// @route   GET /api/v1/mentor/dashboard
// @access  Private/Mentor
export const getDashboardStats = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const cacheKey = CACHE_KEYS.MENTOR_DASHBOARD(mentorId);

    // ── CACHE: Dashboard stats (expensive aggregation) ──
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${cacheKey}`);

    // Total Courses
    const totalCourses = await Course.countDocuments({ mentor: mentorId });

    // Active Courses
    const activeCourses = await Course.countDocuments({ mentor: mentorId, status: 'published' });

    // Get mentor's courses IDs
    const courses = await Course.find({ mentor: mentorId }).select('_id');
    const courseIds = courses.map(c => c._id);

    // Total Students (unique students in Payments)
    const uniqueStudents = await Payment.distinct('student', { course: { $in: courseIds }, status: 'completed' });
    const totalStudents = uniqueStudents.length;

    // Total Earnings
    const payments = await Payment.find({ course: { $in: courseIds }, status: 'completed' });
    const totalEarnings = payments.reduce((acc, p) => acc + (p.mentorEarnings || 0), 0);

    // Recent Activities (Latest 5 payments/enrollments)
    const recentActivities = await Payment.find({ course: { $in: courseIds }, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'name')
      .populate('course', 'title');

    // Earnings Graph Data (Last 7 days)
    const earningsGraphData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0,0,0,0));
      const endOfDay = new Date(d.setHours(23,59,59,999));
      
      const dayPayments = payments.filter(p => p.createdAt >= startOfDay && p.createdAt <= endOfDay);
      const dayEarnings = dayPayments.reduce((acc, p) => acc + (p.mentorEarnings || 0), 0);
      
      earningsGraphData.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        earnings: dayEarnings
      });
    }

    const response = {
      success: true,
      data: {
        totalCourses,
        activeCourses,
        totalStudents,
        totalEarnings,
        recentActivities: recentActivities.map(a => ({
          id: a._id,
          type: 'enrollment',
          message: `${a.student?.name || 'A student'} enrolled in ${a.course?.title || 'a course'}`,
          time: a.createdAt,
          amount: a.mentorEarnings
        })),
        earningsGraphData
      }
    };

    // Cache mentor dashboard for 3 minutes
    await setCache(cacheKey, response, 180);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get mentor students
// @route   GET /api/v1/mentor/students
// @access  Private/Mentor
export const getStudents = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const cacheKey = CACHE_KEYS.MENTOR_STUDENTS(mentorId);

    // ── CACHE ───────────────────────────────────────────
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${cacheKey}`);
    const courses = await Course.find({ mentor: mentorId }).select('_id title');
    const courseIds = courses.map(c => c._id);

    const payments = await Payment.find({ course: { $in: courseIds }, status: 'completed' })
      .populate('student', 'name email')
      .populate('course', 'title');

    // Map to distinct students per course with progress dummy
    const studentsList = payments.map(p => ({
      id: p._id,
      studentId: p.student?._id,
      name: p.student?.name || 'Unknown',
      email: p.student?.email || 'Unknown',
      course: p.course?.title || 'Unknown',
      progress: Math.floor(Math.random() * 100), // Dummy progress for now
      joined: p.createdAt
    }));

    const response = { success: true, data: studentsList };

    // Cache mentor students for 5 minutes
    await setCache(cacheKey, response, 300);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get mentor earnings
// @route   GET /api/v1/mentor/earnings
// @access  Private/Mentor
export const getEarnings = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const cacheKey = CACHE_KEYS.MENTOR_EARNINGS(mentorId);

    // ── CACHE ───────────────────────────────────────────
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${cacheKey}`);
    const courses = await Course.find({ mentor: mentorId }).select('_id');
    const courseIds = courses.map(c => c._id);

    const payments = await Payment.find({ course: { $in: courseIds }, status: 'completed' })
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    const totalEarnings = payments.reduce((acc, p) => acc + (p.mentorEarnings || 0), 0);
    const count = payments.length;

    // Monthly Earnings Data
    const chartDataMap = {};
    payments.forEach(p => {
      const month = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short' });
      if (!chartDataMap[month]) chartDataMap[month] = 0;
      chartDataMap[month] += (p.mentorEarnings || 0);
    });

    const chartData = Object.keys(chartDataMap).map(key => ({
      name: key,
      earnings: chartDataMap[key]
    })).reverse();

    const response = {
      success: true,
      data: {
        totalEarnings,
        count,
        data: payments,
        chartData
      }
    };

    // Cache mentor earnings for 3 minutes
    await setCache(cacheKey, response, 180);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get mentor analytics
// @route   GET /api/v1/mentor/analytics
// @access  Private/Mentor
export const getAnalytics = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const cacheKey = CACHE_KEYS.MENTOR_ANALYTICS(mentorId);

    // ── CACHE ───────────────────────────────────────────
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${cacheKey}`);
    const courses = await Course.find({ mentor: mentorId });
    const courseIds = courses.map(c => c._id);

    const payments = await Payment.find({ course: { $in: courseIds }, status: 'completed' });

    // Course Performance
    const coursePerformance = courses.map(c => {
      const students = payments.filter(p => p.course.toString() === c._id.toString()).length;
      return {
        name: c.title,
        students,
        rating: c.averageRating
      };
    });

    // Revenue Growth (dummy data based on payments)
    const revenueDataMap = {};
    payments.forEach(p => {
      const month = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short' });
      if (!revenueDataMap[month]) revenueDataMap[month] = 0;
      revenueDataMap[month] += (p.mentorEarnings || 0);
    });

    const revenueData = Object.keys(revenueDataMap).map(key => ({
      name: key,
      revenue: revenueDataMap[key]
    })).reverse();

    const response = {
      success: true,
      data: {
        revenueData: revenueData.length ? revenueData : [
          { name: 'Jan', revenue: 0 }, { name: 'Feb', revenue: 0 } // Fallback
        ],
        coursePerformance,
        retentionData: [ // Dummy data since retention is complex
          { name: 'Week 1', retention: 100 },
          { name: 'Week 2', retention: 85 },
          { name: 'Week 3', retention: 70 },
          { name: 'Week 4', retention: 65 }
        ]
      }
    };

    // Cache mentor analytics for 5 minutes
    await setCache(cacheKey, response, 300);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
