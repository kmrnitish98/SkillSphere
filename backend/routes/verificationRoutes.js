import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
  submitVerification,
  getVerificationStatus,
  getVerificationRequests,
  handleVerificationDecision,
  getNotifications,
  markNotificationsRead,
} from '../controllers/verificationController.js';

const router = express.Router();

// ── Mentor routes ──
router.post('/submit', protect, authorize('mentor'), submitVerification);
router.get('/status', protect, getVerificationStatus);

// ── Notification routes ──
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);

// ── Admin routes ──
router.get('/requests', protect, authorize('admin'), getVerificationRequests);
router.put('/:userId/decision', protect, authorize('admin'), handleVerificationDecision);

export default router;
