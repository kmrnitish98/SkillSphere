import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  order: { type: Number, required: true }
}, { timestamps: true });

const Section = mongoose.model('Section', sectionSchema);
export default Section;
