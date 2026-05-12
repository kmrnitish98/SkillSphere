import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnailUrl: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  studentCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
export default Course;
