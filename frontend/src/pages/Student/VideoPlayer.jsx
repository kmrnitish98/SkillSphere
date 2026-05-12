import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { getCourseCurriculum, getCourseById, submitAssessment, updateProgress, getUnlockStatus } from '../../services/api';
import toast from 'react-hot-toast';
import { FaPlay, FaChevronRight, FaChevronDown, FaFileAlt, FaCheckCircle, FaTimesCircle, FaTasks, FaDownload, FaArrowLeft, FaStickyNote, FaTimes, FaExternalLinkAlt, FaLock } from 'react-icons/fa';
import Loader from '../../components/Loader/Loader';

// ─── PdfViewer: tries native browser embed, falls back to Google Docs Viewer ───
const PdfViewer = ({ url, title, compact }) => {
  const [mode, setMode] = useState('embed'); // 'embed' | 'google'

  if (!url) {
    return (
      <div className="flex-1 flex items-center justify-center h-full py-16">
        <p className="text-sm text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg">No PDF attached.</p>
      </div>
    );
  }

  const minH = compact ? '100%' : '520px';
  const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden shadow-2xl border border-slate-800 flex flex-col h-full" style={{ minHeight: minH }}>
      {!compact && (
        <div className="flex items-center justify-between px-5 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FaFileAlt className="text-green-400 text-lg" />
            <span className="text-white font-semibold text-sm">{title}</span>
            <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-md uppercase tracking-wider font-bold border border-green-500/20">PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(m => m === 'embed' ? 'google' : 'embed')}
              className="text-[10px] text-slate-400 hover:text-white underline transition-colors"
            >
              {mode === 'embed' ? 'Try Google Viewer' : 'Try Direct Embed'}
            </button>
            <a href={url} download target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all">
              <FaDownload /> Download
            </a>
          </div>
        </div>
      )}
      <div className="flex-1 relative" style={{ minHeight: compact ? '100%' : '460px' }}>
        {mode === 'embed' ? (
          <object
            key={`embed-${url}`}
            data={url}
            type="application/pdf"
            className="w-full h-full absolute inset-0"
            style={{ minHeight: compact ? '100%' : '460px' }}
          >
            {/* Fallback if browser can't embed */}
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <p className="text-slate-400 text-sm">Your browser cannot display this PDF inline.</p>
              <div className="flex gap-3">
                <button onClick={() => setMode('google')}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Try Google Viewer
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                  <FaExternalLinkAlt /> Open PDF
                </a>
              </div>
            </div>
          </object>
        ) : (
          <iframe
            key={`google-${url}`}
            src={googleUrl}
            className="w-full h-full absolute inset-0"
            style={{ minHeight: compact ? '100%' : '460px', border: 'none' }}
            title={title}
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  );
};

// Internal component to handle Quiz/Final Test rendering
const QuizViewer = ({ assessment, courseId, onPassed }) => {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Reset state when assessment changes
    setAnswers({});
    setResult(null);
  }, [assessment]);

  if (!assessment || !assessment.content || !Array.isArray(assessment.content)) {
    return <div className="text-center p-6 text-slate-500">No questions available.</div>;
  }

  const handleSelect = (qIdx, option) => {
    setAnswers({ ...answers, [qIdx]: option });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < assessment.content.length) {
      if (!window.confirm('You have unanswered questions. Submit anyway?')) return;
    }

    setSubmitting(true);
    try {
      const answersArray = assessment.content.map((_, i) => answers[i] || '');
      const res = await submitAssessment(courseId, assessment._id, { answers: answersArray });

      // ── Compute pass/fail from percentage, NOT from res.data.passed ──────
      // The backend `passed` flag may be wrong if server hasn't restarted yet.
      const totalQ = res.data.totalMarks ?? assessment.content.length;
      const pct = (res.data.percentage !== undefined && res.data.percentage !== null)
        ? res.data.percentage
        : (totalQ > 0 ? Math.min(100, Math.round((res.data.score / totalQ) * 100)) : 0);
      const isPassed = pct >= 60;

      // Inject corrected values back so result display is consistent
      setResult({ ...res.data, totalMarks: totalQ, percentage: pct, passed: isPassed });

      if (isPassed) {
        toast.success(`🎉 Passed with ${pct}%!`);
        if (onPassed) onPassed(res.data.score);   // triggers sidebar ✓ tick
      } else {
        toast.error(`❌ You scored ${pct}%. Need 60% to pass.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 text-slate-200">
      <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-lg text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{assessment.title}</h2>
        <p className="text-sm text-slate-400">
          Answer all questions to complete this {assessment.type.replace('_', ' ')}.
        </p>
      </div>

      {assessment.content.map((q, idx) => (
        <div key={idx} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md">
          <p className="font-semibold text-white mb-5 text-lg">
            <span className="text-green-500 mr-3">Q{idx + 1}.</span>
            {q.question}
          </p>
          <div className="space-y-3">
            {q.options.map((option, oi) => {
              const isSelected = answers[idx] === option;
              return (
                <button
                  key={oi}
                  onClick={() => handleSelect(idx, option)}
                  disabled={!!result} // block change after submitted
                  className={`w-full text-left px-5 py-4 rounded-xl text-sm transition-all border-2 ${isSelected
                    ? 'border-green-500 bg-green-500/10 text-green-400 font-medium shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                    : 'border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!result && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full gradient-primary text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(34,197,94,0.2)] hover:shadow-[0_4px_25px_rgba(34,197,94,0.3)] transition-all disabled:opacity-75 disabled:shadow-none text-lg tracking-wide"
        >
          {submitting ? 'Evaluating...' : 'Submit Answers'}
        </button>
      )}

      {result && (() => {
        // ── Percentage: use server value, fall back to client calc ─────────
        const totalQ = result.totalMarks ?? assessment.content.length;
        const pct = (result.percentage !== undefined && result.percentage !== null)
          ? result.percentage
          : (totalQ > 0 ? Math.min(100, Math.round((result.score / totalQ) * 100)) : 0);
        // Always derive pass/fail from the calculated percentage — never trust
        // the raw `result.passed` flag which may come from stale backend logic.
        const isPassed = pct >= 60;

        return (
          <div className={`rounded-2xl p-8 text-center border-2 ${isPassed ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
            <div className="text-5xl mb-4 flex justify-center">
              {isPassed
                ? <FaCheckCircle className="text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                : <FaTimesCircle className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
            </div>

            {/* Score breakdown */}
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="text-center">
                <p className="text-3xl font-black text-white">
                  {result.score}<span className="text-lg text-slate-400">/{totalQ}</span>
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Correct</p>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center">
                <p className={`text-3xl font-black ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
                  {pct}%
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Score</p>
              </div>
            </div>

            {/* Pass bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 relative">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${isPassed ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
              {/* 60% pass marker */}
              <div className="absolute top-0 h-2.5 w-0.5 bg-yellow-400 opacity-80" style={{ left: '60%' }} />
            </div>
            <p className="text-[10px] text-yellow-400 font-bold mb-4">60% required to pass</p>

            <p className="text-md text-slate-300">
              {isPassed ? '🎉 Congratulations! You successfully passed.' : '❌ Keep trying, you can do it!'}
            </p>

            {!isPassed && (
              <button onClick={() => setResult(null)} className="mt-5 text-sm font-medium text-slate-400 underline hover:text-white transition-colors">
                Retry test
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
};

const VideoPlayer = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [finalTest, setFinalTest] = useState(null);

  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);
  const [expandedSection, setExpandedSection] = useState(0);
  const [completedItems, setCompletedItems] = useState(new Set()); // Track completed item IDs locally
  const [notesOpen, setNotesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar drawer
  // notes pdfUrl = either the lesson's own pdfUrl (for pdf lessons) or the notesUrl on a video lesson
  const notesUrl = activeItem?.pdfUrl || activeItem?.notesUrl || null;
  const [unlockData, setUnlockData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    Promise.all([
      getCourseById(courseId),
      getCourseCurriculum(courseId)
    ]).then(async ([courseRes, currRes]) => {
      setCourse(courseRes.data.data);
      const currData = currRes.data.data;
      setSections(currData.sections || []);
      setFinalTest(currData.finalTest || null);

      // Load previously completed items from backend
      try {
        const { getProgress } = await import('../../services/api');
        const progRes = await getProgress(courseId);
        if (progRes.data?.data) {
          const prog = progRes.data.data;
          const doneIds = new Set([
            ...(prog.completedLessons || []).map(id => id.toString()),
            ...(prog.completedQuizzes || []).map(q => (q.quiz || q).toString()),
          ]);
          setCompletedItems(doneIds);
        }
      } catch (e) { /* ignore progress load errors */ }

      if (currData.sections?.length > 0) {
        const firstSec = currData.sections[0];
        if (firstSec.lessons?.length > 0) setActiveItem(firstSec.lessons[0]);
        else if (firstSec.assessments?.length > 0) setActiveItem(firstSec.assessments[0]);
      } else if (currData.finalTest) {
        setActiveItem(currData.finalTest);
      }

      // Fetch unlock status
      try {
        const unlockRes = await getUnlockStatus(courseId);
        setUnlockData(unlockRes.data.data);
      } catch (_) { /* ignore */ }
    }).catch(err => {
      toast.error('Failed to load course curriculum');
    }).finally(() => {
      setLoading(false);
    });
  }, [courseId]);

  if (loading) return <Loader />;
  if (!course) return <div className="text-center pt-20 text-slate-500">Course not found or ID missing.</div>;

  const handleMarkComplete = async (passed = true, score = 0) => {
    try {
      let sectionId = null;
      sections.forEach(sec => {
        const combined = [...(sec.lessons || []), ...(sec.assessments || [])];
        if (combined.some(item => item._id === activeItem._id)) {
          sectionId = sec._id;
        }
      });

      const isAssessment = ['quiz', 'assignment', 'final_test'].includes(activeItem.type);

      await updateProgress({
        courseId,
        lessonId: isAssessment ? undefined : activeItem._id,
        quizId: isAssessment ? activeItem._id : undefined,
        score,
        passed,
        sectionId,
        contentType: activeItem.type
      });

      // Update local completed set so sidebar checkmarks appear instantly
      const newCompleted = new Set([...completedItems, activeItem._id]);
      setCompletedItems(newCompleted);

      if (!isAssessment || activeItem.type === 'assignment') {
        toast.success('✅ Marked as complete!');
      }
      // Final Test lock state is now computed live from completedItems in JSX — no backend call needed here.

    } catch (error) {
      console.error('handleMarkComplete error:', error?.response?.data || error.message);
      toast.error(error?.response?.data?.message || 'Failed to update progress');
    }
  };

  const renderContent = () => {
    if (!activeItem) return <div className="text-center text-slate-400 py-10">Select a lesson to begin.</div>;

    const getYouTubeEmbedUrl = (url) => {
      if (!url) return null;
      if (url.includes('youtu.be/')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1].split('?')[0]}`;
      if (url.includes('youtube.com/watch')) {
        const match = url.match(/[?&]v=([^&]+)/);
        if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
      }
      if (url.includes('youtube.com/embed/')) return url;
      return null;
    };

    const isLesson = activeItem.duration !== undefined || activeItem.type === 'video' || activeItem.type === 'pdf';

    if (isLesson) {
      if (activeItem.type === 'video') {
        const ytEmbed = getYouTubeEmbedUrl(activeItem.videoUrl);
        return (
          <div className="bg-black rounded-lg overflow-hidden shadow-2xl aspect-video flex items-center justify-center border border-white/5 ring-1 ring-white/10 relative">
            {activeItem.videoUrl ? (
              ytEmbed ? (
                <iframe
                  className="w-full h-full"
                  src={ytEmbed}
                  title={activeItem.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video controls className="w-full h-full bg-black object-contain focus:outline-none" src={activeItem.videoUrl} autoPlay poster={course.thumbnailUrl} />
              )
            ) : (
              <div className="text-center text-white/40">
                <FaPlay className="text-5xl mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium tracking-wide">Video playback unavailable</p>
              </div>
            )}
          </div>
        );
      } else if (activeItem.type === 'pdf') {
        return <PdfViewer url={activeItem.pdfUrl} title={activeItem.title} />;
      } else if (activeItem.type === 'text') {
        return (
          <div className="bg-slate-900 rounded-lg overflow-hidden shadow-2xl min-h-[400px] p-8 md:p-12 border border-slate-800">
            <div className="prose prose-invert prose-green max-w-none">
              {activeItem.content || 'No text content provided.'}
            </div>
          </div>
        )
      }
    } else {
      if (activeItem.type === 'quiz' || activeItem.type === 'final_test') {
        return <QuizViewer assessment={activeItem} courseId={courseId} onPassed={(score) => handleMarkComplete(true, score)} />;
      } else if (activeItem.type === 'assignment') {
        return (
          <div className="bg-slate-900 rounded-lg overflow-hidden shadow-2xl min-h-[400px] p-8 md:p-12 border border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
              <FaTasks className="text-4xl text-blue-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Assignment: {activeItem.title}</h3>
            {activeItem.content && <p className="text-slate-300 max-w-2xl mb-8 leading-relaxed text-lg">{activeItem.content}</p>}
            {activeItem.pdfUrl && (
              <a href={activeItem.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-8 py-4 rounded-xl font-semibold mb-6 transition-all shadow-lg hover:shadow-xl">
                <FaDownload className="text-green-400" /> Download Assignment File
              </a>
            )}
            <button onClick={() => handleMarkComplete(true, 100)} className="gradient-primary text-white font-bold py-4 px-10 rounded-xl shadow-[0_4px_20px_rgba(34,197,94,0.2)] hover:shadow-[0_4px_25px_rgba(34,197,94,0.3)] transition-all tracking-wide">
              Mark as Complete
            </button>
          </div>
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-slate-950 text-slate-200 font-sans overflow-hidden">

      {/* ─── MOBILE SIDEBAR BACKDROP ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── LEFT SIDEBAR (COURSE CONTENT) ─── */}
      <div className={`
        flex-shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col z-20
        shadow-[10px_0_30px_rgba(0,0,0,0.5)]
        fixed lg:relative inset-y-0 left-0
        w-[85vw] sm:w-80
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="py-4 px-4 sm:py-5 sm:px-6 border-b border-slate-800 flex items-center bg-slate-900 relative">
          <Link to="/student/courses" className="text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-slate-800 group">
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="flex-1 pl-3 border-l border-slate-800 ml-3">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Course Content</h2>
            <p className="text-xs text-green-400 font-medium">{sections.length} Sections</p>
          </div>
          {/* Close button – mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-2 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Sidebar Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-dark">
          {sections.map((section, si) => {
            const combinedItems = [...(section.lessons || []), ...(section.assessments || [])];
            const isExpanded = expandedSection === si;

            return (
              <div key={section._id || si} className="border-b border-slate-800/50">
                <button
                  onClick={() => setExpandedSection(isExpanded ? -1 : si)}
                  className={`w-full flex items-center justify-between px-6 py-4 text-sm font-semibold transition-colors ${isExpanded ? 'bg-slate-800/50 text-white' : 'text-slate-300 hover:bg-slate-800/30'}`}
                >
                  <span className="text-left leading-tight pr-4">Section {si + 1}: {section.title}</span>
                  {isExpanded ? <FaChevronDown className="text-[10px] text-green-400 flex-shrink-0" /> : <FaChevronRight className="text-[10px] text-slate-500 flex-shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="bg-[#0f172a] pb-2 shadow-inner">
                    {combinedItems.map((item, idx) => {
                      const isLesson = item.duration !== undefined || item.type === 'video' || item.type === 'pdf';
                      let Icon = FaFileAlt;
                      let itemLabel = isLesson ? 'Lesson' : 'Assessment';
                      if (item.type === 'video') Icon = FaPlay;
                      else if (item.type === 'quiz') { Icon = FaCheckCircle; itemLabel = 'Quiz'; }
                      else if (item.type === 'assignment') { Icon = FaTasks; itemLabel = 'Assignment'; }

                      const isActive = activeItem?._id === item._id;
                      const isDone = completedItems.has(item._id);

                      return (
                        <button
                          key={item._id}
                          onClick={() => setActiveItem(item)}
                          className={`w-full flex items-start gap-4 px-6 py-3.5 text-sm transition-all border-l-2 ${isActive ? 'bg-slate-800/80 border-green-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.2)]' : isDone ? 'border-green-600/40 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                        >
                          <div className="mt-1 flex-shrink-0">
                            {isDone
                              ? <FaCheckCircle className="text-[11px] text-green-500" />
                              : <Icon className={`text-[11px] ${isActive ? 'text-green-400' : 'text-slate-500'}`} />
                            }
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`line-clamp-2 leading-snug ${isActive ? 'font-medium' : ''} ${isDone ? 'text-slate-400' : ''}`}>{item.title}</p>
                            <div className="flex items-center gap-2 mt-1.5 opacity-80">
                              <span className={`text-[9px] uppercase tracking-wider font-semibold py-0.5 px-1.5 rounded-sm ${isActive ? 'bg-slate-700 text-slate-300' : isDone ? 'bg-green-900/30 text-green-600' : 'bg-slate-800 text-slate-500'}`}>{isDone ? '✓ Done' : itemLabel}</span>
                              {item.duration ? <span className="text-[10px] text-slate-500">{item.duration} min</span> : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {combinedItems.length === 0 && (
                      <p className="text-xs text-slate-600 py-4 text-center italic">No content in this section.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Final Test */}
          {finalTest && (() => {
            // ── Compute lock/unlock PURELY from local state ──────────────────
            // All lesson-type items across all sections
            const allLessonIds = sections.flatMap(sec => (sec.lessons || []).map(l => l._id));
            const totalLessons = allLessonIds.length;
            const doneLessonCount = allLessonIds.filter(id => completedItems.has(id)).length;
            const isUnlocked = totalLessons === 0 || doneLessonCount >= totalLessons;
            const progressPct = totalLessons > 0 ? Math.round((doneLessonCount / totalLessons) * 100) : 100;

            return (
              <div className="p-4 border-t border-slate-800">
                {/* Progress bar */}
                <div className="mb-3 px-1">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Lessons</span>
                    <span>{doneLessonCount}/{totalLessons}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {isUnlocked ? (
                  <button
                    onClick={() => navigate(`/student/exam?courseId=${courseId}`)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-sm transition-all rounded-xl border-2 bg-gradient-to-r from-green-600/20 to-emerald-600/10 border-green-500/40 text-green-400 font-bold hover:border-green-400 hover:bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                  >
                    <FaCheckCircle className="text-xl text-green-400" />
                    <div className="flex-1 text-left">
                      <p className="text-base tracking-wide">Final Test</p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-green-500/70 mt-1">🔓 Unlocked — Earn Certificate</p>
                    </div>
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-4 px-5 py-4 text-sm rounded-xl border-2 border-slate-700 bg-slate-800/30 text-slate-500 opacity-70 cursor-not-allowed select-none">
                    <FaLock className="text-xl" />
                    <div className="flex-1 text-left">
                      <p className="text-base tracking-wide">Final Test</p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600 mt-1">Complete all lessons to unlock</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ─── RIGHT CONTENT AREA ─── */}
      <div className="flex-1 flex relative overflow-hidden bg-black min-w-0">

        {/* Main player column */}
        <div className={`flex flex-col transition-all duration-300 min-w-0 ${notesOpen ? 'w-full lg:w-[58%]' : 'w-full'}`}>
          {/* Top Header */}
          <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between bg-slate-900/80 border-b border-slate-800 flex-shrink-0 gap-2">
            {/* Hamburger – mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex-shrink-0 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Open course content"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="flex-1 text-sm sm:text-base lg:text-lg font-bold text-white/90 line-clamp-1 drop-shadow-md">{course.title}</h1>
            {/* Notes toggle button */}
            {notesUrl && (
              <button
                onClick={() => setNotesOpen(o => !o)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all border ${notesOpen
                  ? 'bg-green-600 border-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                <FaStickyNote />
                <span className="hidden sm:inline">Notes</span>
              </button>
            )}
          </div>

          {/* Main Player Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar-dark pb-16">
            <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
              {renderContent()}

              {/* Details pane Below */}
              <div className="mt-6 sm:mt-8 border-t border-slate-800/50 pt-6 sm:pt-8 pl-1 sm:pl-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 tracking-tight">{activeItem?.title || 'Overview'}</h2>

                <div className="flex items-center gap-3">
                  {activeItem?.type && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] uppercase tracking-widest font-bold">
                      {activeItem.type.replace('_', ' ')}
                    </span>
                  )}
                  {activeItem?.duration && <p className="text-sm text-slate-400 font-medium">{activeItem.duration} minutes length</p>}
                </div>

                {activeItem?.passingScore !== undefined && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                    <FaCheckCircle className="text-green-500 text-sm" />
                    <p className="text-sm text-green-400 font-medium">Required passing score: <span className="font-bold text-white">{activeItem.passingScore}</span></p>
                  </div>
                )}

                {activeItem && !['quiz', 'final_test', 'assignment'].includes(activeItem.type) && (
                  <div className="mt-6">
                    <button onClick={() => handleMarkComplete(true, 0)} className="inline-flex items-center gap-2 bg-slate-800 hover:bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors border border-slate-700 hover:border-green-500">
                      <FaCheckCircle /> Mark Lesson Complete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT NOTES PANEL ─── */}
        {notesOpen && notesUrl && (
          <div className="
            fixed inset-0 z-30
            lg:relative lg:inset-auto lg:z-auto
            lg:w-[42%] flex-shrink-0 flex flex-col
            border-l border-slate-800 bg-slate-900
            shadow-[-10px_0_30px_rgba(0,0,0,0.5)]
          ">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FaStickyNote className="text-green-400" />
                <span className="text-white font-semibold text-sm">Lesson Notes</span>
                <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-md uppercase tracking-wider font-bold border border-green-500/20">PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={notesUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                >
                  <FaDownload /> Download
                </a>
                <a
                  href={notesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new tab"
                  className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                >
                  <FaExternalLinkAlt />
                </a>
                <button
                  onClick={() => setNotesOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* PDF embed */}
            <div className="flex-1 relative bg-slate-950">
              <PdfViewer url={notesUrl} title="Lesson Notes" compact />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
