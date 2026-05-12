import express from 'express';
import { createAssignment, submitAssignment } from '../controllers/assignmentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('mentor'), upload.single('file'), createAssignment);
router.post('/:id/submit', protect, authorize('student'), upload.single('file'), submitAssignment);

export default router;
