import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaAward, FaDownload, FaExternalLinkAlt, FaCertificate } from 'react-icons/fa';

const CertificatesPage = () => {
  const { user } = useAuth();
  const certificates = user?.certificates || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Certificates</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Proof of your dedication and hard work</p>
      </div>

      {certificates.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-yellow-100">
            <FaAward className="text-5xl text-yellow-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">No certificates yet</h3>
          <p className="text-slate-500 mt-2 font-medium max-w-sm">Complete your first course with 100% progress to earn your first prestigious certificate.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {certificates.map((cert, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * i }}
                whileHover={{ y: -8 }}
                className="group relative bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col"
              >
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-100 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
                <FaCertificate className="absolute -top-4 -right-4 text-8xl text-yellow-50 opacity-50 group-hover:rotate-12 transition-transform duration-700 pointer-events-none" />

                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 mb-6 relative z-10 text-white text-3xl">
                  <FaAward />
                </div>
                
                <div className="flex-grow relative z-10 mb-6">
                  <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1">Certificate of Completion</p>
                  <h3 className="font-extrabold text-xl text-slate-900 leading-tight mb-2 group-hover:text-yellow-600 transition-colors">Course Name Placeholder</h3>
                  <p className="text-xs text-slate-500 font-medium">Issued on {new Date(cert.issueDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="flex items-center gap-3 relative z-10 mt-auto">
                  <button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md">
                    <FaDownload /> Download PDF
                  </button>
                  {cert.url && (
                    <a href={cert.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors">
                      <FaExternalLinkAlt className="text-xs" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
