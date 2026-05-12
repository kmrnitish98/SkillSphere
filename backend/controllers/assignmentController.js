import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import { uploadFromBuffer } from '../utils/cloudinaryUpload.js';

// @desc    Create an assignment
// @route   POST /api/v1/assignments
// @access  Private/Mentor
export const createAssignment = async (req, res) => {
  try {
    const { course, section, title, description, deadlineDays, totalMarks, order } = req.body;
    
    const courseObj = await Course.findById(course);
    if (!courseObj) return res.status(404).json({ success: false, message: 'Course not found' });
    if (courseObj.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let fileUrl = '';
    if (req.file) {
      const result = await uploadFromBuffer(req.file.buffer, 'skillsphere/assignments');
      fileUrl = result.secure_url;
    }

    const assignment = await Assignment.create({
      course, section, title, description, fileUrl, deadlineDays, totalMarks, order
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit an assignment
// @route   POST /api/v1/assignments/:id/submit
// @access  Private/Student
export const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    let submissionUrl = '';
    if (req.file) {
      const result = await uploadFromBuffer(req.file.buffer, 'skillsphere/submissions');
      submissionUrl = result.secure_url;
    } else {
       return res.status(400).json({ success: false, message: 'Please upload a submission file' });
    }

    let progress = await Progress.findOne({ user: req.user._id, course: assignment.course });
    if (!progress) {
       progress = await Progress.create({ user: req.user._id, course: assignment.course });
    }

    // Check if already submitted
    const existingSubmissionIndex = progress.completedAssignments.findIndex(a => a.assignment.toString() === assignment._id.toString());
    
    if (existingSubmissionIndex !== -1) {
       progress.completedAssignments[existingSubmissionIndex].submissionUrl = submissionUrl;
       progress.completedAssignments[existingSubmissionIndex].graded = false;
       progress.completedAssignments[existingSubmissionIndex].score = 0;
    } else {
       progress.completedAssignments.push({
         assignment: assignment._id,
         submissionUrl,
         graded: false
       });
    }

    await progress.save();
    res.json({ success: true, message: 'Assignment submitted successfully', data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
