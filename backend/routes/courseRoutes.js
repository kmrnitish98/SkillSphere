import express from 'express';
import { createCourse, getCourses, getCourseById, updateCourse, deleteCourse, addSection, updateSection, deleteSection, addLesson, updateLesson, addAssessment, getCourseCurriculum } from '../controllers/courseController.js';
import { submitAssessment, completeCourse, addReview, getCourseReviews } from '../controllers/studentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getCourses)
  .post(protect, authorize('mentor'), upload.single('thumbnail'), createCourse);

router.route('/:id')
  .get(getCourseById)
  .put(protect, authorize('mentor'), updateCourse)
  .delete(protect, authorize('mentor', 'admin'), deleteCourse);

router.get('/:id/curriculum', getCourseCurriculum);
router.post('/:courseId/sections', protect, authorize('mentor'), addSection);
router.route('/sections/:id')
  .put(protect, authorize('mentor'), updateSection)
  .delete(protect, authorize('mentor'), deleteSection);

router.post('/sections/:sectionId/lessons', protect, authorize('mentor'), upload.single('media'), addLesson);
router.put('/lessons/:id', protect, authorize('mentor'), upload.single('media'), updateLesson);

router.post('/sections/:sectionId/assessments', protect, authorize('mentor'), upload.single('media'), addAssessment);

// Student actions
router.post('/:courseId/assessments/:assessmentId/submit', protect, authorize('student'), submitAssessment);
router.post('/:courseId/complete', protect, authorize('student'), completeCourse);
router.route('/:courseId/reviews')
  .post(protect, authorize('student'), addReview)
  .get(getCourseReviews);

export default router;
