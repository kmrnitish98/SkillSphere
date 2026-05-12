import Assessment from '../models/Assessment.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

// @desc    Submit assessment (quiz/assignment/test)
// @route   POST /api/v1/courses/:courseId/assessments/:assessmentId/submit
// @access  Private/Student
export const submitAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { answers } = req.body; // Array of student answers

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    const questions   = assessment.content || [];
    const totalMarks  = questions.length;
    let correctAnswers = 0;

    // Grade each answer
    questions.forEach((q, idx) => {
      const selected = Array.isArray(answers) ? (answers[idx] || '') : (answers?.[idx] || '');
      if (selected === q.correctAnswer) correctAnswers += 1;
    });

    // ── Correct formula: (correct / total) * 100 ──────────────────────────
    const percentage = totalMarks > 0
      ? Math.min(100, Math.round((correctAnswers / totalMarks) * 100))
      : 0;

    // Pass threshold: 60%
    const passed = percentage >= 60;

    res.json({
      success:    true,
      score:      correctAnswers,   // number of correct answers
      totalMarks,                   // total questions
      percentage,                   // 0-100
      passed,
      message: passed ? `Passed with ${percentage}%! 🎉` : `Failed. You scored ${percentage}%. Need 60% to pass.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete course and get certificate
// @route   POST /api/v1/courses/:courseId/complete
// @access  Private/Student
export const completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = await User.findById(req.user._id);

    // Mock Check if final test passed (in real app, track attempts in a separate progress model)
    const certificateUrl = `https://skillsphere.com/certificates/${user._id}/${courseId}`;

    // Prevent duplicates
    const hasCert = user.certificates.find(c => c.course.toString() === courseId);
    if (!hasCert) {
      user.certificates.push({ course: courseId, url: certificateUrl });
      await user.save();
    }

    res.json({ success: true, certificateUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add review
// @route   POST /api/v1/courses/:courseId/reviews
// @access  Private/Student
export const addReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, feedback } = req.body;

    const review = await Review.create({
      student: req.user._id,
      course: courseId,
      rating,
      feedback
    });

    // Update course average rating
    const reviews = await Review.find({ course: courseId });
    const avg = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    await Course.findByIdAndUpdate(courseId, { averageRating: avg });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews for a course
// @route   GET /api/v1/courses/:courseId/reviews
// @access  Public
export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const reviews = await Review.find({ course: courseId }).populate('student', 'name');
    
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
