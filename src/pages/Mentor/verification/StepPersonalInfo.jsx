import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiCamera } from 'react-icons/fi';

const StepPersonalInfo = ({ formData, setFormData, user }) => {
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePhoto: file });
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
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
        <h2 className="text-2xl font-bold text-slate-800">Personal Information</h2>
        <p className="text-slate-500 mt-1 text-sm">Let's start with your basic details</p>
      </div>

      {/* Profile Photo */}
      <div className="flex justify-center mb-6">
        <label className="relative cursor-pointer group">
          <div className="w-28 h-28 rounded-full border-3 border-dashed border-primary-300 flex items-center justify-center bg-primary-50/50 overflow-hidden transition-all group-hover:border-primary-500 group-hover:shadow-lg group-hover:shadow-primary-100">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="text-center">
                <FiCamera className="mx-auto text-2xl text-primary-400" />
                <span className="text-[10px] text-primary-500 font-medium mt-1 block">Upload Photo</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-200 group-hover:scale-110 transition-transform">
            <FiCamera className="text-white text-sm" />
          </div>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>
      </div>

      {/* Full Name */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <FiUser className="text-primary-500" /> Full Name
        </label>
        <input
          type="text" name="fullName" value={formData.fullName} onChange={handleChange}
          placeholder="Enter your full name"
          className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Email */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <FiMail className="text-primary-500" /> Email Address
        </label>
        <input
          type="email" name="email" value={formData.email} readOnly
          className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-500 font-medium cursor-not-allowed"
        />
        <p className="text-xs text-slate-400 mt-1.5 ml-1">Email is pre-filled from your account</p>
      </div>

      {/* Phone */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
          <FiPhone className="text-primary-500" /> Phone Number
        </label>
        <input
          type="tel" name="phone" value={formData.phone || ''} onChange={handleChange}
          placeholder="+1 (555) 000-0000"
          className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white transition-all placeholder:text-slate-400"
        />
      </div>
    </motion.div>
  );
};

export default StepPersonalInfo;
