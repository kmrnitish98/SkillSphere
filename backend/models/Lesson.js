import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'pdf', 'text'], required: true },
  videoUrl: { type: String }, // For video lessons
  pdfUrl: { type: String },   // For pdf notes
  content: { type: String },  // For text lessons
  duration: { type: Number, default: 0 }, // in minutes
  order: { type: Number, required: true }
}, { timestamps: true });

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
