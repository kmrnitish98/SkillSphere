import Progress from '../models/Progress.js';
import Lesson from '../models/Lesson.js';
import Section from '../models/Section.js';
import Assessment from '../models/Assessment.js';

// @desc    Update progress (mark lesson/quiz complete, update last accessed)
// @route   POST /api/v1/progress
// @access  Private/Student
export const updateProgress = async (req, res) => {
  try {
    const { courseId, lessonId, quizId, score, passed, sectionId, contentType } = req.body;

    if (!courseId) return res.status(400).json({ success: false, message: 'courseId is required' });

    let progress = await Progress.findOne({ user: req.user._id, course: courseId });
    if (!progress) {
      progress = new Progress({ user: req.user._id, course: courseId });
    }

    // Mark Lesson Complete
    if (lessonId) {
      const alreadyDone = progress.completedLessons.some(id => id.toString() === lessonId.toString());
      if (!alreadyDone) progress.completedLessons.push(lessonId);
    }

    // Mark Quiz/Assessment Complete
    if (quizId) {
      const existingIdx = progress.completedQuizzes.findIndex(
        q => q.quiz.toString() === quizId.toString()
      );
      if (existingIdx !== -1) {
        progress.completedQuizzes[existingIdx] = { quiz: quizId, score: score || 0, passed: !!passed };
      } else {
        progress.completedQuizzes.push({ quiz: quizId, score: score || 0, passed: !!passed });
      }
    }

    // Update Last Accessed — map frontend type strings to Progress model enum values
    const contentTypeMap = {
      video: 'Lesson', pdf: 'Lesson', text: 'Lesson',
      quiz: 'Quiz', final_test: 'Quiz',
      assignment: 'Assignment',
    };
    const mappedContentType = contentTypeMap[contentType] || 'Lesson';

    if (sectionId && (lessonId || quizId)) {
      progress.lastAccessedContent = {
        sectionId,
        contentId: lessonId || quizId,
        contentType: mappedContentType,
      };
    }

    // Calculate percentage — total items = all lessons + all assessments in the course
    const sectionIds = await Section.find({ course: courseId }).distinct('_id');
    const totalLessons = await Lesson.countDocuments({ section: { $in: sectionIds } });
    const totalAssessments = await Assessment.countDocuments({ course: courseId });
    const totalItems = totalLessons + totalAssessments;

    const completedItems = progress.completedLessons.length + progress.completedQuizzes.length;
    progress.progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    await progress.save();
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('updateProgress error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user progress for a course
// @route   GET /api/v1/progress/:courseId
// @access  Private/Student
export const getProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({ user: req.user._id, course: req.params.courseId });
    res.json({
      success: true,
      data: progress || { progressPercentage: 0, completedLessons: [], completedQuizzes: [] },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
