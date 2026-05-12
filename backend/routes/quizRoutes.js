import express from 'express';
import { createQuiz, getQuizzes } from '../controllers/quizController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('mentor'), createQuiz);
router.get('/:courseId', protect, getQuizzes);

export default router;
