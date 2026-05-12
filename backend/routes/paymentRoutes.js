import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  downloadInvoice,
  getMyPayments,
  getMentorEarnings,
  getPlatformRevenue,
  stripeWebhook,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ── Stripe Webhook (raw body required — registered before express.json() in server.js) ──
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// ── Student ──
router.post('/create-payment-intent', protect, authorize('student'), createPaymentIntent);
router.post('/confirm', protect, authorize('student'), confirmPayment);
router.get('/my', protect, authorize('student'), getMyPayments);
router.get('/:paymentId/invoice', protect, downloadInvoice); // student + admin

// ── Mentor ──
router.get('/earnings', protect, authorize('mentor'), getMentorEarnings);

// ── Admin ──
router.get('/revenue', protect, authorize('admin'), getPlatformRevenue);

export default router;
