import express from 'express';
import { updateProgress, getProgress } from '../controllers/progressController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('student'), updateProgress);
router.get('/:courseId', protect, authorize('student'), getProgress);

export default router;
