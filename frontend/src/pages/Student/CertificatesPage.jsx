import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaAward, FaDownload, FaExternalLinkAlt, FaCertificate, FaQrcode, FaSpinner } from 'react-icons/fa';
import { HiCheckCircle, HiStar } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getMyCertificates } from '../../services/api';
import { generateCertificatePDF } from '../../services/certificateGenerator';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const CertificatesPage = () => {
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null); // certId being downloaded

  useEffect(() => {
    getMyCertificates()
      .then(res => setCerts(res.data.data || []))
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert) => {
    setDownloading(cert.certificateId);
    try {
      await generateCertificatePDF({
        studentName:   user?.name || 'Student',
        courseName:    cert.course?.title || 'Course',
        certificateId: cert.certificateId,
        percentage:    cert.percentage,
        issuedAt:      cert.issuedAt,
      });
      toast.success('Certificate downloaded!');
    } catch (e) {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-3xl text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Certificates</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {certs.length > 0 ? `${certs.length} certificate${certs.length > 1 ? 's' : ''} earned` : 'Proof of your dedication and hard work'}
          </p>
        </div>
        {certs.length > 0 && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-bold">
            <HiStar className="text-yellow-500" /> {certs.length} Earned
          </div>
        )}
      </div>

      {certs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]"
        >
          <div className="w-28 h-28 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-yellow-100">
            <FaAward className="text-6xl text-yellow-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800">No certificates yet</h3>
          <p className="text-slate-500 mt-2 font-medium max-w-sm">
            Complete a course and pass the final exam (60%+) to earn your first certificate.
          </p>
          <Link to="/student/courses" className="mt-6 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md">
            Browse My Courses
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {certs.map((cert, i) => (
              <motion.div
                key={cert._id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 * i }}
                whileHover={{ y: -6 }}
                className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col"
              >
                {/* Gold gradient header */}
                <div className="h-2 w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400" />

                {/* Body */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 text-white text-2xl">
                      <FaAward />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-green-100">
                        <HiCheckCircle /> Passed
                      </span>
                      <span className="text-[11px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100">
                        {cert.percentage}% Score
                      </span>
                    </div>
                  </div>

                  {/* Text */}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Certificate of Completion</p>
                  <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-1 group-hover:text-yellow-600 transition-colors line-clamp-2">
                    {cert.course?.title || 'Course'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mb-1">
                    {cert.course?.category && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md mr-2">{cert.course.category}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Issued: <span className="font-semibold">{new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>

                  {/* Cert ID */}
                  <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Certificate ID</p>
                      <p className="text-[11px] font-mono font-bold text-slate-700">{cert.certificateId}</p>
                    </div>
                    <FaQrcode className="text-slate-400 text-xl" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleDownload(cert)}
                      disabled={downloading === cert.certificateId}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      {downloading === cert.certificateId
                        ? <FaSpinner className="animate-spin" />
                        : <FaDownload />}
                      Download PDF
                    </button>
                    <Link
                      to={`/verify/${cert.certificateId}`}
                      target="_blank"
                      className="w-10 h-10 bg-slate-50 hover:bg-yellow-50 border border-slate-200 hover:border-yellow-200 text-slate-600 hover:text-yellow-600 rounded-xl flex items-center justify-center transition-colors"
                      title="Verify certificate"
                    >
                      <FaExternalLinkAlt className="text-xs" />
                    </Link>
                  </div>
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
