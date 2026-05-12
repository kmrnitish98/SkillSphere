import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FaLock, FaCheckCircle, FaTimesCircle, FaClock,
  FaArrowLeft, FaAward, FaDownload, FaSpinner, FaShieldAlt
} from 'react-icons/fa';
import { HiLightningBolt } from 'react-icons/hi';
import {
  getCourseCurriculum, getCourseById,
  getUnlockStatus, submitFinalExam, getExamResult,
} from '../../services/api';
import { generateCertificatePDF } from '../../services/certificateGenerator';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader/Loader';

// ─── Timer ───────────────────────────────────────────────────────────────────
const ExamTimer = ({ durationSeconds, onTimeout }) => {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (remaining <= 0) { onTimeout(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onTimeout]);

  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  const pct = (remaining / durationSeconds) * 100;
  const urgent = remaining < 60;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border font-bold text-sm ${urgent ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-200'}`}>
      <FaClock className={urgent ? 'text-red-400' : 'text-green-400'} />
      <span>{m}:{s}</span>
      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${urgent ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Result Screen ────────────────────────────────────────────────────────────
const ResultScreen = ({ result, user, courseName, onRetry }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!result.certificate) return;
    setDownloading(true);
    try {
      await generateCertificatePDF({
        studentName:   user?.name || 'Student',
        courseName,
        certificateId: result.certificate.certificateId,
        percentage:    result.percentage,
        issuedAt:      result.certificate.issuedAt,
      });
      toast.success('Certificate downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto mt-10 text-center"
    >
      {/* Result card */}
      <div className={`rounded-3xl p-10 border-2 shadow-2xl ${result.passed
        ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30'
        : 'bg-gradient-to-br from-red-500/10 to-rose-500/5 border-red-500/30'}`}>

        <div className="text-7xl mb-6 flex justify-center">
          {result.passed
            ? <FaCheckCircle className="text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
            : <FaTimesCircle className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />}
        </div>

        <h2 className="text-3xl font-black text-white mb-2">
          {result.passed ? '🎉 Congratulations!' : 'Better Luck Next Time'}
        </h2>
        <p className="text-slate-400 mb-6">
          {result.passed
            ? 'You passed the final exam and earned your certificate!'
            : 'You need 60% or more to earn the certificate.'}
        </p>

        {/* Score display */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-4xl font-black text-white">{result.score}<span className="text-xl text-slate-400">/{result.totalMarks}</span></p>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Score</p>
          </div>
          <div className="w-px h-12 bg-slate-700" />
          <div className="text-center">
            <p className={`text-4xl font-black ${result.passed ? 'text-green-400' : 'text-red-400'}`}>{result.percentage}%</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Percentage</p>
          </div>
          <div className="w-px h-12 bg-slate-700" />
          <div className="text-center">
            <p className="text-sm text-slate-400">Attempt</p>
            <p className="text-2xl font-bold text-white">#{result.attempt}</p>
          </div>
        </div>

        {/* Pass progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-3 mb-6 relative">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${result.passed ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`}
            style={{ width: `${Math.min(result.percentage, 100)}%` }}
          />
          {/* 60% pass marker */}
          <div className="absolute top-0 h-3 w-0.5 bg-yellow-400" style={{ left: '60%' }} />
          <span className="absolute -top-5 text-[9px] text-yellow-400 font-bold" style={{ left: '60%', transform: 'translateX(-50%)' }}>60% pass</span>
        </div>

        {result.passed && result.certificate && (
          <div className="bg-slate-800/60 border border-yellow-500/30 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <FaAward className="text-yellow-400 text-2xl" />
              <div>
                <p className="text-white font-bold">Certificate Earned!</p>
                <p className="text-xs text-slate-400">ID: {result.certificate.certificateId}</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-black py-3 rounded-xl transition-all shadow-lg shadow-yellow-500/30 disabled:opacity-70"
            >
              {downloading ? <FaSpinner className="animate-spin" /> : <FaDownload />}
              Download Certificate PDF
            </button>
            <Link
              to={`/verify/${result.certificate.certificateId}`}
              target="_blank"
              className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              <FaShieldAlt /> Verify Certificate
            </Link>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {!result.passed && (
            <button onClick={onRetry} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors">
              Retry Exam
            </button>
          )}
          <Link to="/student/certificates" className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-colors">
            <FaAward /> My Certificates
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main FinalExamPage ───────────────────────────────────────────────────────
const FinalExamPage = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [loading,      setLoading]      = useState(true);
  const [course,       setCourse]       = useState(null);
  const [finalTest,    setFinalTest]    = useState(null);
  const [unlockData,   setUnlockData]   = useState(null);
  const [examStarted,  setExamStarted]  = useState(false);
  const [answers,      setAnswers]      = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [result,       setResult]       = useState(null);
  const [prevResult,   setPrevResult]   = useState(null); // best past attempt

  // Prevent page-refresh cheating during exam
  useEffect(() => {
    if (!examStarted) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [examStarted]);

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }

    Promise.all([
      getCourseById(courseId),
      getCourseCurriculum(courseId),
      getUnlockStatus(courseId),
      getExamResult(courseId).catch(() => ({ data: { data: null } })),
    ]).then(([cRes, currRes, unlockRes, examRes]) => {
      setCourse(cRes.data.data);
      setFinalTest(currRes.data.data?.finalTest || null);
      setUnlockData(unlockRes.data.data);
      setPrevResult(examRes.data.data);
    }).catch(() => toast.error('Failed to load exam data'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleTimeout = useCallback(() => {
    toast.error('⏰ Time is up! Auto-submitting…');
    handleSubmit(true);
  }, [answers, finalTest]);

  const handleSubmit = async (auto = false) => {
    if (!auto && Object.keys(answers).length < (finalTest?.content?.length || 0)) {
      if (!window.confirm('You have unanswered questions. Submit anyway?')) return;
    }
    setSubmitting(true);
    try {
      const answersArray = (finalTest?.content || []).map((_, i) => answers[i] || '');
      const res = await submitFinalExam({
        courseId,
        assessmentId: finalTest._id,
        answers: answersArray,
      });
      setResult(res.data.data);
      setExamStarted(false);
      if (res.data.data.passed) {
        toast.success('🎉 Passed! Certificate generated!');
      } else {
        toast.error(`You scored ${res.data.data.percentage}%. Need 60% to pass.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  if (!courseId || !course) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Course not found</p>
          <Link to="/student/courses" className="text-green-400 hover:underline">← Back to courses</Link>
        </div>
      </div>
    );
  }

  // ── Locked state ──────────────────────────────────────────────────────────
  if (!unlockData?.unlocked) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <Link to={`/student/player?courseId=${courseId}`} className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <FaArrowLeft /> Back to Course
        </Link>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-lg">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
            <FaLock className="text-4xl text-slate-500" />
          </div>
          <h2 className="text-3xl font-black mb-3">Final Exam Locked</h2>
          <p className="text-slate-400 mb-6">Complete all lessons to unlock the final exam.</p>

          {/* Progress bar */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Lessons Completed</span>
              <span className="font-bold text-white">{unlockData?.completedLessons || 0} / {unlockData?.totalLessons || 0}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${unlockData?.progressPercentage || 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
              />
            </div>
            <p className="text-right text-xs text-green-400 font-bold mt-1">{unlockData?.progressPercentage || 0}% complete</p>
          </div>

          <Link
            to={`/student/player?courseId=${courseId}`}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Continue Learning →
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="fixed inset-0 bg-slate-950 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Link to={`/student/player?courseId=${courseId}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4">
            <FaArrowLeft /> Back to Course
          </Link>
          <ResultScreen
            result={result}
            user={user}
            courseName={course.title}
            onRetry={() => { setResult(null); setAnswers({}); setExamStarted(false); }}
          />
        </div>
      </div>
    );
  }

  // ── Pre-exam / previous result lobby ─────────────────────────────────────
  if (!examStarted) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-white p-6 overflow-y-auto">
        <Link to={`/student/player?courseId=${courseId}`} className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <FaArrowLeft /> Back to Course
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full text-center">
          {/* Course title */}
          <p className="text-green-400 font-bold text-sm uppercase tracking-widest mb-2">{course.title}</p>
          <h1 className="text-4xl font-black text-white mb-2">Final Exam</h1>
          <p className="text-slate-400 mb-8">Test your knowledge. Score 60% or more to earn your certificate.</p>

          {/* Exam info cards */}
          {finalTest && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Questions', value: finalTest.content?.length || 0 },
                { label: 'Pass Score', value: '60%' },
                { label: 'Timer', value: '30 min' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Previous best result */}
          {prevResult && (
            <div className={`rounded-2xl p-4 border mb-6 ${prevResult.passed ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Previous Best Attempt</p>
              <p className="font-bold text-white">
                Score: {prevResult.score}/{prevResult.totalMarks}
                <span className={`ml-3 ${prevResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {prevResult.percentage}% {prevResult.passed ? '✅ Passed' : '❌ Failed'}
                </span>
              </p>
            </div>
          )}

          {/* Rules */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-8 text-left space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Exam Rules</p>
            {[
              'Do NOT refresh the page during the exam.',
              'All questions must be answered before submitting.',
              'Exam auto-submits when time expires.',
              'Certificate is generated instantly if you pass.',
            ].map((r, i) => (
              <p key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <HiLightningBolt className="text-green-400 flex-shrink-0 mt-0.5" /> {r}
              </p>
            ))}
          </div>

          <button
            onClick={() => { setAnswers({}); setExamStarted(true); }}
            disabled={!finalTest}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black py-4 rounded-2xl text-lg transition-all shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_4px_30px_rgba(34,197,94,0.4)] disabled:opacity-50"
          >
            {prevResult?.passed ? '🏆 Retake Exam' : '🚀 Start Exam'}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Active Exam ───────────────────────────────────────────────────────────
  const questions = finalTest?.content || [];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col text-slate-200 overflow-hidden">
      {/* Sticky exam header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shadow-lg">
        <div>
          <p className="text-xs text-slate-400 font-medium">{course.title}</p>
          <h2 className="text-white font-bold text-sm">{finalTest?.title || 'Final Exam'}</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">{answeredCount}/{questions.length} answered</span>
          <ExamTimer durationSeconds={30 * 60} onTimeout={handleTimeout} />
        </div>
      </div>

      {/* Questions scroll area */}
      <div className="flex-1 overflow-y-auto pb-28 px-4 pt-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {questions.map((q, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md"
            >
              <p className="font-semibold text-white mb-4 text-base">
                <span className="text-green-500 mr-2">Q{idx + 1}.</span> {q.question}
              </p>
              <div className="space-y-3">
                {q.options.map((opt, oi) => {
                  const selected = answers[idx] === opt;
                  return (
                    <button
                      key={oi}
                      onClick={() => setAnswers(prev => ({ ...prev, [idx]: opt }))}
                      className={`w-full text-left px-5 py-3.5 rounded-xl text-sm transition-all border-2 ${
                        selected
                          ? 'border-green-500 bg-green-500/10 text-green-300 font-semibold shadow-[0_0_10px_rgba(34,197,94,0.15)]'
                          : 'border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold mr-3 text-slate-500">{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answers[idx] && (
                <p className="text-[10px] text-green-500 font-medium mt-2 ml-1">✓ Answered</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sticky submit bar */}
      <div className="flex-shrink-0 px-6 py-4 bg-slate-900/95 border-t border-slate-800 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Progress</span>
              <span className="text-green-400 font-bold">{answeredCount}/{questions.length}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black px-8 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(34,197,94,0.3)] disabled:opacity-70"
          >
            {submitting ? <FaSpinner className="animate-spin" /> : null}
            {submitting ? 'Submitting…' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalExamPage;
