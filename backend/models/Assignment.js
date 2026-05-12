import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  fileUrl: { type: String }, // Optional attachment
  deadlineDays: { type: Number }, // Days from enrollment
  totalMarks: { type: Number, required: true },
  order: { type: Number, required: true }
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
