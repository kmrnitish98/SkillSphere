import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBriefcase, FiLink, FiFileText, FiX } from 'react-icons/fi';

const EXPERTISE_OPTIONS = [
  'Web Development', 'Data Science', 'UI/UX Design', 'Cloud Computing',
  'Mobile Development', 'Machine Learning', 'Cybersecurity', 'DevOps',
  'Blockchain', 'Game Development', 'Digital Marketing', 'Business',
];

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Select experience level' },
  { value: '0-1', label: '0–1 years (Beginner)' },
  { value: '1-3', label: '1–3 years (Junior)' },
  { value: '3-5', label: '3–5 years (Mid-Level)' },
  { value: '5-10', label: '5–10 years (Senior)' },
  { value: '10+', label: '10+ years (Expert)' },
];

const StepProfessionalDetails = ({ formData, setFormData }) => {
  const [tagInput, setTagInput] = useState('');
  const selectedTags = formData.expertise || [];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addTag = (tag) => {
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 5) {
      setFormData({ ...formData, expertise: [...selectedTags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, expertise: selectedTags.filter(t => t !== tag) });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Professional Details</h2>
        <p className="text-slate-500 mt-1 text-sm">Tell us about your professional background</p>
      </div>

      {/* Expertise Multi-select Tags */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <FiBriefcase className="text-primary-500" /> Areas of Expertise
          <span className="text-xs text-slate-400 font-normal ml-auto">({selectedTags.length}/5)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm font-medium border border-primary-200">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:bg-primary-200 rounded-full p-0.5 transition-colors">
                <FiX className="text-xs" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {EXPERTISE_OPTIONS.filter(o => !selectedTags.includes(o)).map(option => (
            <button
              key={option} type="button" onClick={() => addTag(option)}
              disabled={selectedTags.length >= 5}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              + {option}
            </button>
          ))}
        </div>
      </div>

      {/* Experience Dropdown */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <FiBriefcase className="text-primary-500" /> Years of Experience
        </label>
        <select
          name="experience" value={formData.experience || ''} onChange={handleChange}
          className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white transition-all cursor-pointer appearance-none"
        >
          {EXPERIENCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Bio */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <FiFileText className="text-primary-500" /> Professional Bio
        </label>
        <textarea
          name="bio" rows="4" value={formData.bio || ''} onChange={handleChange}
          placeholder="Share your professional journey, key achievements, and what inspires you to teach..."
          className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white transition-all resize-none placeholder:text-slate-400"
        />
        <p className="text-xs text-slate-400 mt-1 ml-1">{(formData.bio || '').length}/500 characters</p>
      </div>

      {/* Portfolio / LinkedIn */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <FiLink className="text-primary-500" /> Portfolio / LinkedIn URL
        </label>
        <input
          type="url" name="linkedin" value={formData.linkedin || ''} onChange={handleChange}
          placeholder="https://linkedin.com/in/yourprofile"
          className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white transition-all placeholder:text-slate-400"
        />
      </div>
    </motion.div>
  );
};

export default StepProfessionalDetails;
