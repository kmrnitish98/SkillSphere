import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiArrowRight, FiArrowLeft, FiAlertTriangle, FiUser, FiBriefcase, FiUploadCloud, FiFileText, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { submitVerification as submitVerificationAPI, getVerificationStatus } from '../../services/api';

import StepPersonalInfo from './verification/StepPersonalInfo';
import StepProfessionalDetails from './verification/StepProfessionalDetails';
import StepDocumentUpload from './verification/StepDocumentUpload';
import StepAgreement from './verification/StepAgreement';

const STEPS = [
  { num: 1, title: 'Personal Info', icon: FiUser },
  { num: 2, title: 'Professional', icon: FiBriefcase },
  { num: 3, title: 'Documents', icon: FiUploadCloud },
  { num: 4, title: 'Agreement', icon: FiFileText },
];

const MentorVerification = () => {
  const { user, loginUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [statusLoading, setStatusLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('none');
  const [currentRejectionReason, setCurrentRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    profilePhoto: null,
    expertise: [],
    experience: '',
    bio: '',
    linkedin: '',
    idProof: null,
    resume: null,
    certificates: null,
  });

  // Fetch current verification status on mount
  useEffect(() => {
    if (!user) return;
    getVerificationStatus()
      .then(res => {
        const data = res.data?.data;
        setCurrentStatus(data?.verificationStatus || 'none');
        setCurrentRejectionReason(data?.rejectionReason || '');
        // Update local user context
        if (data?.verificationStatus && data.verificationStatus !== user.verificationStatus) {
          updateUser({ verificationStatus: data.verificationStatus, isVerifiedMentor: data.isVerifiedMentor });
        }
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  if (!user) { navigate('/login'); return null; }

  const progressPercent = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.fullName.trim()) { toast.error('Please enter your full name'); return false; }
        if (!formData.phone.trim()) { toast.error('Please enter your phone number'); return false; }
        return true;
      case 2:
        if (!formData.expertise.length) { toast.error('Please select at least one expertise'); return false; }
        if (!formData.experience) { toast.error('Please select your experience level'); return false; }
        if (!formData.bio.trim()) { toast.error('Please write a short bio'); return false; }
        return true;
      case 3:
        return true; // Documents are optional
      case 4:
        if (!agreed) { toast.error('Please accept the agreement to continue'); return false; }
        return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) setStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!agreed) { toast.error('Please accept the agreement'); return; }
    setIsSubmitting(true);

    try {
      await submitVerificationAPI({
        fullName: formData.fullName,
        phone: formData.phone,
        expertise: formData.expertise,
        experience: formData.experience,
        bio: formData.bio,
        linkedin: formData.linkedin,
      });

      // Update local user state
      updateUser({ verificationStatus: 'pending' });

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (error) {
      setIsSubmitting(false);
      toast.error(error.response?.data?.message || 'Submission failed. Please try again.');
    }
  };

  // ── Loading while checking status ──
  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Pending State ──
  if ((currentStatus === 'pending' || user?.verificationStatus === 'pending') && !isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50 flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-yellow-100 p-10 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiClock className="text-3xl text-yellow-500" />
          </div>
          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold mb-4">PENDING REVIEW</span>
          <h3 className="text-2xl font-bold text-slate-800">Application Under Review</h3>
          <p className="text-slate-500 mt-3 text-sm leading-relaxed">Our team is currently reviewing your profile. We'll notify you within 24–48 hours once approved.</p>
          <button onClick={() => navigate('/mentor')} className="mt-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-8 py-3 rounded-2xl transition-colors text-sm">
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Rejected State ──
  if (currentStatus === 'rejected' || user?.verificationStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-red-100 p-10 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiAlertTriangle className="text-3xl text-red-500" />
          </div>
          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold mb-4">REJECTED</span>
          <h3 className="text-2xl font-bold text-slate-800">Application Not Approved</h3>
          <p className="text-slate-500 mt-3 text-sm leading-relaxed">Unfortunately your application was not approved. Please review the reason below and reapply.</p>
          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-sm text-red-600 font-medium">{currentRejectionReason || user?.rejectionReason || 'Insufficient documentation provided.'}</p>
          </div>
          <button onClick={() => navigate('/mentor')} className="mt-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-8 py-3 rounded-2xl transition-colors text-sm">
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Success State ──
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="bg-white rounded-3xl shadow-xl border border-primary-100 p-10 text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary-100/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-100/40 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Animated check */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 bg-gradient-to-br from-primary-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-200"
            >
              <FiCheck className="text-white text-4xl" strokeWidth={3} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold mb-4">SUBMITTED</span>
              <h3 className="text-2xl font-bold text-slate-800">Verification Request Submitted!</h3>
              <p className="text-slate-500 mt-3 text-sm leading-relaxed">Your application is under review. Our team will verify your credentials within <strong className="text-slate-700">24–48 hours</strong>.</p>

              <div className="mt-6 bg-primary-50 border border-primary-100 rounded-2xl p-4 space-y-2">
                {['Application received successfully', 'Review typically takes 24–48 hours', "You'll be notified via email"].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FiCheck className="text-primary-500 text-sm flex-shrink-0" />
                    <p className="text-sm text-slate-600">{text}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate('/mentor')} className="mt-8 bg-gradient-to-r from-primary-500 to-emerald-500 hover:from-primary-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 rounded-2xl transition-all text-sm shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 hover:scale-[1.02]">
                Back to Dashboard
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Form ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/40 via-white to-emerald-50/30 pt-20 pb-12 px-4 relative overflow-hidden">
      {/* Background decorative shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-100/10 rounded-full blur-3xl pointer-events-none" />

      {/* Alert Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto mb-6"
      >
        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiAlertTriangle className="text-amber-600 text-sm" />
          </div>
          <p className="text-sm text-amber-800 font-medium">
            <span className="font-bold">Verify your account</span> to unlock unlimited course creation. Unverified mentors can create only 1 course.
          </p>
        </div>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-3xl mx-auto"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 via-emerald-500 to-green-500 p-7 sm:p-9 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Mentor Verification</h1>
              <p className="text-green-50 mt-1.5 text-sm font-medium">Join our community and start teaching thousands of students</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="px-6 sm:px-10 pt-8 pb-2">
            {/* Progress percentage */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</span>
              <span className="text-xs font-bold text-primary-600">{progressPercent}% Complete</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 rounded-full mb-8 overflow-hidden">
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 rounded-full"
              />
            </div>

            {/* Step indicators */}
            <div className="flex justify-between items-center relative mb-6">
              {/* Connecting line */}
              <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-100 z-0" />
              <motion.div
                animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="absolute left-6 top-5 h-0.5 bg-primary-400 z-0"
                style={{ maxWidth: 'calc(100% - 48px)' }}
              />

              {STEPS.map(s => {
                const isCompleted = step > s.num;
                const isActive = step === s.num;
                const Icon = s.icon;
                return (
                  <div key={s.num} className="relative z-10 flex flex-col items-center gap-2 cursor-pointer" onClick={() => { if (s.num < step) setStep(s.num); }}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isCompleted ? 'bg-primary-500 text-white shadow-md shadow-primary-200' :
                      isActive ? 'bg-white text-primary-600 border-2 border-primary-500 shadow-md shadow-primary-100' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {isCompleted ? <FiCheck className="text-lg" strokeWidth={3} /> : <Icon className="text-lg" />}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap hidden sm:block ${
                      isCompleted || isActive ? 'text-primary-600' : 'text-slate-400'
                    }`}>{s.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 sm:px-10 pb-6">
            <AnimatePresence mode="wait">
              {step === 1 && <StepPersonalInfo key="s1" formData={formData} setFormData={setFormData} user={user} />}
              {step === 2 && <StepProfessionalDetails key="s2" formData={formData} setFormData={setFormData} />}
              {step === 3 && <StepDocumentUpload key="s3" formData={formData} setFormData={setFormData} />}
              {step === 4 && <StepAgreement key="s4" agreed={agreed} setAgreed={setAgreed} />}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="px-6 sm:px-10 pb-8">
            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
              {step > 1 ? (
                <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all">
                  <FiArrowLeft /> Back
                </button>
              ) : <div />}

              {step < STEPS.length ? (
                <button onClick={nextStep} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-7 py-3 rounded-2xl transition-all text-sm shadow-md hover:shadow-lg hover:scale-[1.02]">
                  Next Step <FiArrowRight />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!agreed || isSubmitting}
                  className={`flex items-center gap-2 font-semibold px-7 py-3 rounded-2xl transition-all text-sm
                    ${agreed && !isSubmitting
                      ? 'bg-gradient-to-r from-primary-500 to-emerald-500 hover:from-primary-600 hover:to-emerald-600 text-white shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 hover:scale-[1.02]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Submitting...
                    </>
                  ) : (
                    <>Submit for Verification <FiCheck /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Your data is encrypted and securely stored. We respect your privacy.
        </p>
      </motion.div>
    </div>
  );
};

export default MentorVerification;
