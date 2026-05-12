import Quiz from '../models/Quiz.js';
import Course from '../models/Course.js';

// @desc    Create a quiz
// @route   POST /api/v1/quizzes
// @access  Private/Mentor
export const createQuiz = async (req, res) => {
  try {
    const { course, section, title, isFinalTest, timeLimit, passingPercentage, questions, order } = req.body;
    
    const courseObj = await Course.findById(course);
    if (!courseObj) return res.status(404).json({ success: false, message: 'Course not found' });
    if (courseObj.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.create({
      course, section, title, isFinalTest, timeLimit, passingPercentage, questions, order
    });

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quizzes by course
// @route   GET /api/v1/quizzes/:courseId
// @access  Private
export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ course: req.params.courseId }).sort({ order: 1 });
    res.json({ success: true, count: quizzes.length, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
