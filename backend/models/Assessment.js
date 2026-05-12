import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' }, // Optional, null if it's the Final Test
  title: { type: String, required: true },
  type: { type: String, enum: ['quiz', 'assignment', 'final_test'], required: true },
  content: [{
    question: String,
    options: [String],
    correctAnswer: String
  }],
  passingScore: { type: Number, required: true },
  timeLimit: { type: Number }, // in minutes
  pdfUrl: { type: String } // For assignments
}, { timestamps: true });

const Assessment = mongoose.model('Assessment', assessmentSchema);
export default Assessment;
