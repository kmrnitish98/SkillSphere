import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  completedQuizzes: [{
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number,
    passed: Boolean
  }],
  completedAssignments: [{
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    submissionUrl: String,
    score: Number,
    graded: { type: Boolean, default: false }
  }],
  lastAccessedContent: {
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    contentId: { type: mongoose.Schema.Types.ObjectId }, // Lesson, Quiz, or Assignment ID
    contentType: { type: String, enum: ['Lesson', 'Quiz', 'Assignment'] }
  },
  progressPercentage: { type: Number, default: 0 }
}, { timestamps: true });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
