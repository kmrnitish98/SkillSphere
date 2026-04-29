import { motion } from 'framer-motion';
import { FiCheck, FiExternalLink, FiDollarSign } from 'react-icons/fi';

const StepAgreement = ({ agreed, setAgreed }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Agreement & Submit</h2>
        <p className="text-slate-500 mt-1 text-sm">Review the earnings split and accept terms</p>
      </div>

      {/* Earnings Agreement Card */}
      <div className="bg-gradient-to-br from-primary-50 via-emerald-50/50 to-green-50 border border-primary-200/60 rounded-2xl p-6 relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-200/20 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <FiDollarSign className="text-primary-600 text-lg" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Earnings & Platform Agreement</h3>
          </div>

          {/* Revenue Split */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Your Earnings</p>
                <p className="text-xs text-slate-500">Per course revenue</p>
              </div>
              <span className="text-2xl font-black text-primary-600">80%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Platform Fee</p>
                <p className="text-xs text-slate-500">Hosting, marketing & support</p>
              </div>
              <span className="text-2xl font-black text-slate-400">20%</span>
            </div>

            {/* Visual Split Bar */}
            <div className="relative mt-2">
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '80%' }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-primary-500 to-emerald-400 rounded-l-full relative"
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                    80% — You
                  </span>
                </motion.div>
                <div className="flex-1 relative">
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    20%
                  </span>
                </div>
              </div>
            </div>

            {/* Pill badges */}
            <div className="flex gap-2 justify-center mt-3">
              <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-bold border border-primary-200">
                <FiCheck className="text-xs" /> 80% Mentor Share
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-sm font-bold border border-slate-200">
                20% Platform
              </span>
            </div>
          </div>

          {/* Summary points */}
          <div className="bg-white/70 rounded-xl p-4 space-y-2 mb-5 border border-primary-100/50">
            {[
              'You will earn 80% of all course revenue',
              'Platform retains 20% for hosting, marketing & support',
              'Payouts processed monthly via your preferred method',
              'No hidden fees or additional charges',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <FiCheck className="text-primary-500 mt-0.5 flex-shrink-0 text-sm" />
                <p className="text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-2xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all">
        <div className="mt-0.5">
          <input
            type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className="hidden"
          />
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
            ${agreed ? 'bg-primary-500 border-primary-500' : 'border-slate-300 group-hover:border-primary-400'}`}>
            {agreed && <FiCheck className="text-white text-xs" />}
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          I agree to the platform terms and accept the <strong className="text-primary-600">80% mentor share</strong> and <strong className="text-slate-700">20% platform fee</strong> revenue split arrangement.
        </p>
      </label>

      {/* Terms link */}
      <div className="text-center">
        <button className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors">
          <FiExternalLink className="text-xs" /> View Terms & Conditions
        </button>
      </div>
    </motion.div>
  );
};

export default StepAgreement;
