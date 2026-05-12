import express from 'express';
import { getDashboardStats, getStudents, getEarnings, getAnalytics, getMentorCourses } from '../controllers/mentorController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('mentor', 'admin'));

router.get('/dashboard', getDashboardStats);
router.get('/courses', getMentorCourses);
router.get('/students', getStudents);
router.get('/earnings', getEarnings);
router.get('/analytics', getAnalytics);

export default router;
