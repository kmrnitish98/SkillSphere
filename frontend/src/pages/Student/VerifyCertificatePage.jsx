import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaCheckCircle, FaTimesCircle, FaAward, FaSpinner, FaDownload } from 'react-icons/fa';
import { verifyCertificate } from '../../services/api';

const VerifyCertificatePage = () => {
  const { certId } = useParams();
  const [loading, setLoading]   = useState(true);
  const [data,    setData]      = useState(null);
  const [invalid, setInvalid]   = useState(false);

  useEffect(() => {
    if (!certId) { setInvalid(true); setLoading(false); return; }
    verifyCertificate(certId)
      .then(res => setData(res.data.data))
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [certId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <Link to="/" className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center font-black text-white text-lg">S</div>
        <span className="text-white font-black text-xl">SkillSphere</span>
      </Link>

      {loading ? (
        <FaSpinner className="animate-spin text-4xl text-green-500" />
      ) : invalid ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-10 text-center shadow-2xl"
        >
          <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
          <h2 className="text-2xl font-black text-white mb-2">Invalid Certificate</h2>
          <p className="text-slate-400 mb-2">This certificate ID does not exist or may be fake.</p>
          <p className="font-mono text-xs text-slate-600 bg-slate-800 px-3 py-1.5 rounded-lg inline-block mt-1">{certId}</p>
          <div className="mt-6">
            <Link to="/" className="text-green-400 hover:underline text-sm font-medium">← Go to SkillSphere</Link>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg w-full"
        >
          {/* Valid badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 font-bold px-4 py-2 rounded-full text-sm">
              <FaShieldAlt /> Verified & Authentic Certificate
            </span>
          </div>

          {/* Certificate card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-yellow-500/30 rounded-3xl shadow-2xl overflow-hidden">
            {/* Gold top bar */}
            <div className="h-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500" />

            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-yellow-500/30 flex-shrink-0">
                  <FaAward />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Certificate of Completion</p>
                  <h2 className="text-xl font-black text-white leading-tight">
                    {data.courseName}
                  </h2>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent mb-6" />

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Student Name', value: data.studentName },
                  { label: 'Final Score', value: `${data.percentage}%` },
                  { label: 'Issue Date', value: new Date(data.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                  { label: 'Certificate ID', value: data.certificateId },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-bold text-white font-mono break-all">{value}</p>
                  </div>
                ))}
              </div>

              {/* Valid status */}
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3">
                <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-bold text-sm">Verification Successful</p>
                  <p className="text-slate-400 text-xs">This certificate was issued by SkillSphere and is authentic.</p>
                </div>
              </div>
            </div>

            {/* Gold bottom bar */}
            <div className="h-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500" />
          </div>

          <p className="text-center text-slate-600 text-xs mt-4">
            Powered by{' '}
            <Link to="/" className="text-green-500 hover:underline font-bold">SkillSphere LMS</Link>
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default VerifyCertificatePage;
