import mongoose from 'mongoose';

const examResultSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course',     required: true },
  assessment:  { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  score:       { type: Number, required: true },
  totalMarks:  { type: Number, required: true },
  percentage:  { type: Number, required: true },
  passed:      { type: Boolean, required: true },
  answers:     [{ questionIndex: Number, selected: String }],
  attempt:     { type: Number, default: 1 },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const ExamResult = mongoose.model('ExamResult', examResultSchema);
export default ExamResult;
