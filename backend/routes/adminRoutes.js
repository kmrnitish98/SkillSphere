import express from 'express';
import { adminLogin, getAdminProfile, getDashboardStats, getAdminCourseAnalytics, getRevenueAnalytics } from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ── Public ──────────────────────────────────────────────
router.post('/login', adminLogin);

// ── Private / Admin only ────────────────────────────────
router.get('/profile',          protect, authorize('admin'), getAdminProfile);
router.get('/dashboard',        protect, authorize('admin'), getDashboardStats);
router.get('/courses/analytics',  protect, authorize('admin'), getAdminCourseAnalytics);
router.get('/revenue/analytics',  protect, authorize('admin'), getRevenueAnalytics);

export default router;
