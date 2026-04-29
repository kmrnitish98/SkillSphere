import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getCourseCurriculum, getCourseById, submitAssessment } from '../../services/api';
import toast from 'react-hot-toast';
import { FaPlay, FaChevronRight, FaChevronDown, FaFileAlt, FaCheckCircle, FaTimesCircle, FaTasks, FaDownload, FaArrowLeft } from 'react-icons/fa';
import Loader from '../../components/Loader/Loader';

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
      if(!window.confirm('You have unanswered questions. Submit anyway?')) return;
    }

    setSubmitting(true);
    try {
      const answersArray = assessment.content.map((_, i) => answers[i] || '');
      const res = await submitAssessment(courseId, assessment._id, { answers: answersArray });
      setResult(res.data);
      if (res.data.passed) {
        toast.success(res.data.message || '🎉 Passed!');
        if (onPassed) onPassed();
      } else {
        toast.error(res.data.message || '❌ Failed. Try again.');
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
                  className={`w-full text-left px-5 py-4 rounded-xl text-sm transition-all border-2 ${
                    isSelected
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

      {result && (
        <div className={`rounded-2xl p-8 text-center border-2 ${result.passed ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
          <div className="text-5xl mb-4 flex justify-center">{result.passed ? <FaCheckCircle className="text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> : <FaTimesCircle className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}</div>
          <h3 className="text-2xl font-bold text-white">Score: {result.score}</h3>
          <p className="text-md text-slate-300 mt-2">{result.passed ? 'Congratulations! You successfully passed.' : 'Keep trying, you can do it!'}</p>
          {!result.passed && (
            <button onClick={() => setResult(null)} className="mt-5 text-sm font-medium text-slate-400 underline hover:text-white transition-colors">
              Retry test
            </button>
          )}
        </div>
      )}
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

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    Promise.all([
      getCourseById(courseId),
      getCourseCurriculum(courseId)
    ]).then(([courseRes, currRes]) => {
      setCourse(courseRes.data.data);
      const currData = currRes.data.data;
      setSections(currData.sections || []);
      setFinalTest(currData.finalTest || null);

      if (currData.sections?.length > 0) {
        const firstSec = currData.sections[0];
        if (firstSec.lessons?.length > 0) setActiveItem(firstSec.lessons[0]);
        else if (firstSec.assessments?.length > 0) setActiveItem(firstSec.assessments[0]);
      } else if (currData.finalTest) {
        setActiveItem(currData.finalTest);
      }
    }).catch(err => {
      toast.error('Failed to load course curriculum');
    }).finally(() => {
      setLoading(false);
    });
  }, [courseId]);

  if (loading) return <Loader />;
  if (!course) return <div className="text-center pt-20 text-slate-500">Course not found or ID missing.</div>;

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
        return (
          <div className="bg-slate-900 rounded-lg overflow-hidden shadow-2xl aspect-video flex flex-col items-center justify-center border border-slate-800">
             <div className="text-center">
               <FaFileAlt className="text-6xl mx-auto mb-5 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
               <h3 className="text-2xl font-bold text-white mb-2">Lesson Notes (PDF)</h3>
               <p className="text-slate-400 mb-6 text-sm">Download or view the attached document</p>
               {activeItem.pdfUrl ? (
                 <a href={activeItem.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 gradient-primary text-white px-8 py-3 rounded-xl font-semibold shadow-[0_4px_20px_rgba(34,197,94,0.2)] hover:shadow-[0_4px_25px_rgba(34,197,94,0.3)] transition-all">
                   <FaDownload /> View Full PDF
                 </a>
               ) : (
                 <p className="text-sm text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg">No file attached by mentor.</p>
               )}
             </div>
          </div>
        );
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
        return <QuizViewer assessment={activeItem} courseId={courseId} />;
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
               <button onClick={() => toast.success('Assignment marked as complete.')} className="gradient-primary text-white font-bold py-4 px-10 rounded-xl shadow-[0_4px_20px_rgba(34,197,94,0.2)] hover:shadow-[0_4px_25px_rgba(34,197,94,0.3)] transition-all tracking-wide">
                 Mark as Complete
               </button>
           </div>
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* ─── LEFT SIDEBAR (COURSE CONTENT) ─── */}
      <div className="w-80 flex-shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-20">
        {/* Sidebar Header */}
        <div className="py-5 px-6 border-b border-slate-800 flex items-center bg-slate-900 relative">
          <Link to="/student/courses" className="text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-slate-800 group">
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="flex-1 pl-3 border-l border-slate-800 ml-3">
             <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Course Content</h2>
             <p className="text-xs text-green-400 font-medium">{sections.length} Sections</p>
          </div>
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

                        return (
                          <button
                            key={item._id}
                            onClick={() => setActiveItem(item)}
                            className={`w-full flex items-start gap-4 px-6 py-3.5 text-sm transition-all border-l-2 ${isActive ? 'bg-slate-800/80 border-green-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.2)]' : 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                          >
                            <div className="mt-1 flex-shrink-0">
                               <Icon className={`text-[11px] ${isActive ? 'text-green-400' : 'text-slate-500'}`} />
                            </div>
                            <div className="flex-1 text-left">
                              <p className={`line-clamp-2 leading-snug ${isActive ? 'font-medium' : ''}`}>{item.title}</p>
                              <div className="flex items-center gap-2 mt-1.5 opacity-80">
                                <span className={`text-[9px] uppercase tracking-wider font-semibold py-0.5 px-1.5 rounded-sm ${isActive ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-500'}`}>{itemLabel}</span>
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
            {finalTest && (
               <div className="p-5">
                 <button
                   onClick={() => setActiveItem(finalTest)}
                   className={`w-full flex items-center gap-4 px-5 py-4 text-sm transition-all rounded-xl border-2 ${activeItem?._id === finalTest._id ? 'bg-green-500/10 border-green-500/30 text-green-400 font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'}`}
                 >
                   <FaCheckCircle className={`text-xl ${activeItem?._id === finalTest._id ? 'text-green-400' : 'text-slate-500'}`} />
                   <div className="flex-1 text-left">
                     <p className="text-base tracking-wide">Final Test</p>
                     <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mt-1">Required for Certificate</p>
                   </div>
                 </button>
               </div>
            )}
        </div>
      </div>

      {/* ─── RIGHT CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col bg-black relative">
         {/* Top Header Placeholder (to push content down slightly, or overlay) */}
         <div className="h-20 px-8 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 w-full pointer-events-none">
            <h1 className="text-lg md:text-xl font-bold text-white/90 line-clamp-1 max-w-3xl pointer-events-auto drop-shadow-md">{course.title}</h1>
         </div>

         {/* Main Player Area */}
         <div className="flex-1 pt-20 overflow-y-auto custom-scrollbar-dark pb-16">
            <div className="max-w-6xl mx-auto px-6 xl:px-10">
                {renderContent()}

                {/* Details pane Below */}
                <div className="mt-8 border-t border-slate-800/50 pt-8 pl-2">
                  <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">{activeItem?.title || 'Overview'}</h2>
                  
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
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
