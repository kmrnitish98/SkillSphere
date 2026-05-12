import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'mentor', 'admin'], 
    default: 'student' 
  },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  socialLinks: {
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    github: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  timezone: { type: String, default: 'Asia/Kolkata' },
  language: { type: String, default: 'en' },
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    courseUpdates: { type: Boolean, default: true },
    promotionalEmails: { type: Boolean, default: false },
    mentorMessages: { type: Boolean, default: true },
  },
  isVerifiedMentor: { type: Boolean, default: false },
  verificationStatus: { 
    type: String, 
    enum: ['none', 'pending', 'approved', 'rejected'], 
    default: 'none' 
  },
  verificationData: {
    fullName: String,
    phone: String,
    expertise: [String],
    experience: String,
    bio: String,
    linkedin: String,
    submittedAt: Date,
  },
  rejectionReason: { type: String, default: '' },
  favoriteMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  certificates: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    url: String,
    issueDate: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
