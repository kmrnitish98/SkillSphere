import Certificate from '../models/Certificate.js';
import ExamResult  from '../models/ExamResult.js';
import Assessment  from '../models/Assessment.js';
import Section     from '../models/Section.js';
import Lesson      from '../models/Lesson.js';
import Progress    from '../models/Progress.js';
import Course      from '../models/Course.js';
import { nanoid }  from 'nanoid';

// ─── Helper: generate unique cert ID ────────────────────────────────────────
const genCertId = () => `CERT-${nanoid(10).toUpperCase()}`;

// ─── Helper: check if all lessons are done ──────────────────────────────────
const allLessonsDone = async (userId, courseId) => {
  const sectionIds = await Section.find({ course: courseId }).distinct('_id');
  const totalLessons = await Lesson.countDocuments({ section: { $in: sectionIds } });
  if (totalLessons === 0) return true; // no lessons = auto-pass gate
  const progress = await Progress.findOne({ user: userId, course: courseId });
  return progress && progress.completedLessons.length >= totalLessons;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Check final-test unlock status for a course
// @route  GET /api/v1/certificates/unlock-status/:courseId
// @access Private / student
// ─────────────────────────────────────────────────────────────────────────────
export const getUnlockStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const sectionIds   = await Section.find({ course: courseId }).distinct('_id');
    const totalLessons = await Lesson.countDocuments({ section: { $in: sectionIds } });
    const progress     = await Progress.findOne({ user: req.user._id, course: courseId });
    const completedLessons = progress?.completedLessons.length || 0;
    const unlocked = completedLessons >= totalLessons;

    res.json({
      success: true,
      data: { unlocked, completedLessons, totalLessons, progressPercentage: progress?.progressPercentage || 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Submit final exam + auto-generate certificate if passed
// @route  POST /api/v1/certificates/submit-exam
// @access Private / student
// ─────────────────────────────────────────────────────────────────────────────
export const submitFinalExam = async (req, res) => {
  try {
    const { courseId, assessmentId, answers } = req.body;
    if (!courseId || !assessmentId || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'courseId, assessmentId and answers are required' });
    }

    // ── 1. Backend gate: all lessons must be done ──────────────────────────
    const done = await allLessonsDone(req.user._id, courseId);
    if (!done) {
      return res.status(403).json({ success: false, message: 'Complete all lessons before taking the final exam' });
    }

    // ── 2. Load assessment ─────────────────────────────────────────────────
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment || assessment.type !== 'final_test') {
      return res.status(404).json({ success: false, message: 'Final test not found' });
    }

    // ── 3. Grade answers ───────────────────────────────────────────────────
    const questions  = assessment.content || [];
    const totalMarks = questions.length;
    let score = 0;
    const gradedAnswers = questions.map((q, i) => {
      const selected = answers[i] || '';
      const correct  = selected === q.correctAnswer;
      if (correct) score++;
      return { questionIndex: i, selected };
    });
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passed     = percentage >= 60;

    // ── 4. Count attempt number ────────────────────────────────────────────
    const prevAttempts = await ExamResult.countDocuments({ user: req.user._id, course: courseId, assessment: assessmentId });

    // ── 5. Save exam result ────────────────────────────────────────────────
    const examResult = await ExamResult.create({
      user:       req.user._id,
      course:     courseId,
      assessment: assessmentId,
      score,
      totalMarks,
      percentage,
      passed,
      answers:    gradedAnswers,
      attempt:    prevAttempts + 1,
    });

    // ── 6. Generate certificate if passed ──────────────────────────────────
    let certificate = null;
    if (passed) {
      const existing = await Certificate.findOne({ user: req.user._id, course: courseId });
      if (existing) {
        certificate = existing;
      } else {
        const certId = genCertId();
        certificate = await Certificate.create({
          user:            req.user._id,
          course:          courseId,
          certificateId:   certId,
          score,
          totalMarks,
          percentage,
          verificationUrl: `/verify/${certId}`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        score,
        totalMarks,
        percentage,
        passed,
        attempt: prevAttempts + 1,
        examResultId: examResult._id,
        certificate: certificate ? {
          _id:            certificate._id,
          certificateId:  certificate.certificateId,
          issuedAt:       certificate.issuedAt,
          verificationUrl: certificate.verificationUrl,
        } : null,
      },
    });
  } catch (err) {
    console.error('submitFinalExam error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Get all certificates for logged-in student
// @route  GET /api/v1/certificates
// @access Private / student
// ─────────────────────────────────────────────────────────────────────────────
export const getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ user: req.user._id })
      .populate('course', 'title thumbnailUrl category')
      .sort({ issuedAt: -1 });
    res.json({ success: true, data: certs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Get a single certificate (ownership verified)
// @route  GET /api/v1/certificates/:certId
// @access Private / student
// ─────────────────────────────────────────────────────────────────────────────
export const getCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certId })
      .populate('course', 'title category')
      .populate('user', 'name email');

    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    // Ownership check – students can only fetch their own; admin can see all
    if (req.user.role === 'student' && cert.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Public verify endpoint – no auth required
// @route  GET /api/v1/certificates/verify/:certId
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
export const verifyCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certId })
      .populate('course', 'title category')
      .populate('user', 'name');

    if (!cert) return res.status(404).json({ success: false, valid: false, message: 'Invalid or fake certificate' });

    res.json({
      success: true,
      valid: true,
      data: {
        studentName:   cert.user.name,
        courseName:    cert.course.title,
        issuedAt:      cert.issuedAt,
        percentage:    cert.percentage,
        certificateId: cert.certificateId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Get best exam result for a course (for current user)
// @route  GET /api/v1/certificates/exam-result/:courseId
// @access Private / student
// ─────────────────────────────────────────────────────────────────────────────
export const getExamResult = async (req, res) => {
  try {
    const result = await ExamResult.findOne({
      user:   req.user._id,
      course: req.params.courseId,
    }).sort({ percentage: -1 });

    res.json({ success: true, data: result || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
