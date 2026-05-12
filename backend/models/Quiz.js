import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' }, // Optional, null if Final Test
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  isFinalTest: { type: Boolean, default: false },
  timeLimit: { type: Number }, // in minutes
  passingPercentage: { type: Number, required: true },
  questions: [{
    questionText: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'true_false'], required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String }
  }],
  order: { type: Number, required: true }
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
