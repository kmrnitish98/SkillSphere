import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
  getUnlockStatus,
  submitFinalExam,
  getMyCertificates,
  getCertificate,
  verifyCertificate,
  getExamResult,
} from '../controllers/certificateController.js';

const router = express.Router();

// ── Public ──
router.get('/verify/:certId', verifyCertificate);

// ── Student only ──
router.use(protect, authorize('student'));
router.get('/unlock-status/:courseId', getUnlockStatus);
router.post('/submit-exam',            submitFinalExam);
router.get('/exam-result/:courseId',   getExamResult);
router.get('/',                        getMyCertificates);
router.get('/:certId',                 getCertificate);

export default router;
