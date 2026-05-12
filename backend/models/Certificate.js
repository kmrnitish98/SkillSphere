import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  course:            { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  certificateId:     { type: String, unique: true, required: true }, // e.g. CERT-XXXXXX
  score:             { type: Number, required: true },   // raw score
  totalMarks:        { type: Number, required: true },
  percentage:        { type: Number, required: true },   // 0-100
  issuedAt:          { type: Date,   default: Date.now },
  verificationUrl:   { type: String },                   // /verify/:certificateId
}, { timestamps: true });

// Compound index – one certificate per (user, course)
certificateSchema.index({ user: 1, course: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
