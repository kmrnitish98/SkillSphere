import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseCurriculum, addSection, addLesson, addAssessment } from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader/Loader';
import { FaPlus, FaVideo, FaFilePdf, FaBook, FaCheckSquare, FaClipboardList, FaClock, FaArrowLeft, FaTrash, FaLink, FaGripLines, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const getInitQ = () => ({ question: '', options: ['', '', '', ''], correctAnswer: '' });

const CourseBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ sections: [], finalTest: null });
  const [loading, setLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState(null);

  // Modals state
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState({ show: false, sectionId: null });
  const [showAssessmentModal, setShowAssessmentModal] = useState({ show: false, sectionId: null });
  const [showFinalTestModal, setShowFinalTestModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState('video'); // for lesson
  const [videoSource, setVideoSource] = useState('upload'); // 'upload' or 'link'
  const [videoUrl, setVideoUrl] = useState(''); // external link
  const [assessmentType, setAssessmentType] = useState('quiz');
  const [assignmentSource, setAssignmentSource] = useState('upload'); // 'upload' or 'text'
  const [file, setFile] = useState(null);
  const [content, setContent] = useState(''); // text content
  const [passingScore, setPassingScore] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  // Quiz / Test Builder states
  const [questions, setQuestions] = useState([getInitQ()]);

  // Drag and Drop state
  const [draggedSectionIndex, setDraggedSectionIndex] = useState(null);

  const handlePublish = async () => {
    try {
      await import('../../services/api').then(m => m.updateCourse(id, { status: 'published' }));
      toast.success('Course published successfully!');
      navigate('/mentor/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error publishing course');
    }
  };

  const fetchCurriculum = () => {
    setLoading(true);
    getCourseCurriculum(id)
      .then(res => {
        const sections = res.data.data.sections;
        setData(res.data.data);
        if (sections.length > 0 && !activeSectionId) {
          setActiveSectionId(sections[0]._id);
        }
      })
      .catch(() => toast.error('Failed to load curriculum'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCurriculum();
  }, [id]);

  const resetForms = () => {
    setTitle('');
    setType('video');
    setVideoSource('upload');
    setVideoUrl('');
    setAssessmentType('quiz');
    setAssignmentSource('upload');
    setFile(null);
    setContent('');
    setPassingScore(50);
    setQuestions([getInitQ()]);
    setShowSectionModal(false);
    setShowLessonModal({ show: false, sectionId: null });
    setShowAssessmentModal({ show: false, sectionId: null });
    setShowFinalTestModal(false);
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addSection(id, { title, order: data.sections.length + 1 });
      toast.success('Section added');
      fetchCurriculum();
      resetForms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding section');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (type === 'video' && videoSource === 'upload' && !file) {
      return toast.error('Please select a video file or choose external link.');
    }
    if (type === 'video' && videoSource === 'link' && !videoUrl) {
      return toast.error('Please provide a valid video URL.');
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', type);
    formData.append('content', content);
    formData.append('order', 99); 
    
    if (type === 'video' && videoSource === 'link') {
      formData.append('videoUrl', videoUrl);
    } else if (file) {
      formData.append('media', file);
    }

    try {
      await addLesson(showLessonModal.sectionId, formData);
      toast.success('Lesson added');
      fetchCurriculum();
      resetForms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAssessment = async (e, isFinal = false) => {
    e.preventDefault();

    const actualType = isFinal ? 'final_test' : assessmentType;
    let finalContent = content;

    if (actualType === 'quiz' || actualType === 'final_test') {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question.trim() || q.options.some(o => !o.trim()) || !q.correctAnswer.trim()) {
          return toast.error(`Please fill out all fields for question #${i + 1}`);
        }
        if (!q.options.includes(q.correctAnswer)) {
          return toast.error(`Question #${i + 1}: The correct answer must exactly match one of the options.`);
        }
      }
      finalContent = JSON.stringify(questions);
    } else if (actualType === 'assignment') {
      if (assignmentSource === 'upload' && !file) return toast.error('Select a PDF file.');
      if (assignmentSource === 'text' && !content.trim()) return toast.error('Type instructions.');
      if (assignmentSource === 'upload') finalContent = ''; 
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', actualType);
    formData.append('passingScore', passingScore);
    formData.append('courseId', id);
    if (finalContent) formData.append('content', finalContent);
    if (actualType === 'assignment' && assignmentSource === 'upload' && file) {
      formData.append('media', file);
    }

    try {
      await addAssessment(isFinal ? null : showAssessmentModal.sectionId, formData);
      toast.success(isFinal ? 'Final Test added' : 'Assessment added');
      fetchCurriculum();
      resetForms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // HTML5 Drag and Drop for sections
  const handleDragStart = (e, index) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === dropIndex) return;

    const newSections = [...data.sections];
    const draggedItem = newSections[draggedSectionIndex];
    
    // Remove dragged item
    newSections.splice(draggedSectionIndex, 1);
    // Insert at new index
    newSections.splice(dropIndex, 0, draggedItem);
    
    setData({ ...data, sections: newSections });
    setDraggedSectionIndex(null);
    
    // In a real app, make an API call to save new orders here.
    toast.success('Section order updated (UI only for now)');
  };

  // Quiz Builder Helpers
  const updateQuestion = (index, field, value) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };
  const updateOption = (qIndex, oIndex, value) => {
    const newQ = [...questions];
    newQ[qIndex].options[oIndex] = value;
    setQuestions(newQ);
  };
  const addQuestion = () => setQuestions([...questions, getInitQ()]);
  const removeQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));

  if (loading) return <Loader />;

  const activeSection = data.sections.find(s => s._id === activeSectionId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <button onClick={() => navigate('/mentor/courses')} className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mb-2 transition-colors">
            <FaArrowLeft /> Back to Courses
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Course Builder</h1>
        </div>
        <button onClick={handlePublish} className="bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md hover:bg-slate-800 transition-colors">
          Publish Course
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* LEFT SIDE: Sections List */}
        <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Curriculum</h2>
            <button onClick={() => setShowSectionModal(true)} className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors" title="Add Section">
              <FaPlus />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {data.sections.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No sections. Click + to add.</p>
            ) : (
              data.sections.map((sec, index) => (
                <div 
                  key={sec._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => setActiveSectionId(sec._id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    activeSectionId === sec._id 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FaGripLines className="text-slate-400 cursor-grab shrink-0" />
                    <span className="font-medium text-sm truncate">Sec {index + 1}: {sec.title}</span>
                  </div>
                  <FaChevronRight className={`shrink-0 text-xs ${activeSectionId === sec._id ? 'text-green-500' : 'text-slate-300'}`} />
                </div>
              ))
            )}

            {/* Final Test Link in Sidebar */}
            <div className="mt-4 pt-4 border-t border-slate-100">
               <div 
                 onClick={() => setActiveSectionId('final')}
                 className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    activeSectionId === 'final' 
                      ? 'bg-purple-50 border-purple-200 text-purple-800' 
                      : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                 }`}
               >
                 <div className="flex items-center gap-3">
                   <FaClock className="text-purple-500" />
                   <span className="font-bold text-sm">Final Exam</span>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Section Content Editor */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {activeSectionId === 'final' ? (
            <div className="p-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
              <div className="border-b border-slate-100 pb-6 mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <FaClock className="text-purple-500" /> Final Course Examination
                </h2>
                <p className="text-slate-500 mt-2">Create a comprehensive test that covers all sections. Students must pass this to complete the course.</p>
              </div>

              {data.finalTest ? (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
                  <h3 className="font-bold text-purple-900 text-lg mb-2">{data.finalTest.title}</h3>
                  <div className="flex gap-4 text-sm text-purple-700">
                    <span className="bg-white px-3 py-1 rounded-full shadow-sm font-semibold">Time Limit: {data.finalTest.timeLimit} mins</span>
                    <span className="bg-white px-3 py-1 rounded-full shadow-sm font-semibold">Passing Score: {data.finalTest.passingScore}%</span>
                  </div>
                  
                  {data.finalTest.content && Array.isArray(data.finalTest.content) && (
                    <div className="mt-6 space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm mb-2">Exam Questions ({data.finalTest.content.length})</h4>
                      {data.finalTest.content.map((q, idx) => (
                         <div key={idx} className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                           <p className="font-medium text-slate-800 text-sm mb-2">
                             <span className="text-purple-500 mr-2">Q{idx + 1}.</span> {q.question}
                           </p>
                           <div className="grid grid-cols-2 gap-2 mt-2">
                             {q.options.map((opt, oIdx) => (
                               <div key={oIdx} className={`text-xs p-2 rounded border ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-700 font-semibold' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                 {opt}
                               </div>
                             ))}
                           </div>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center text-2xl mb-4">
                    <FaCheckSquare />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">No Final Exam Yet</h3>
                  <p className="text-slate-500 mb-6 max-w-sm">A final test is a great way to ensure your students have mastered the course material.</p>
                  <button onClick={() => setShowFinalTestModal(true)} className="gradient-primary text-white font-semibold px-6 py-2.5 rounded-xl shadow-md">
                    Create Final Exam
                  </button>
                </div>
              )}
            </div>
          ) : activeSection ? (
            <div className="p-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
              <div className="border-b border-slate-100 pb-6 mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{activeSection.title}</h2>
                  <p className="text-slate-500 mt-1">Manage content for this section</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowLessonModal({ show: true, sectionId: activeSection._id })} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2">
                    <FaPlus /> Lesson
                  </button>
                  <button onClick={() => setShowAssessmentModal({ show: true, sectionId: activeSection._id })} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2">
                    <FaPlus /> Quiz/Assignment
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {activeSection.lessons.length === 0 && activeSection.assessments.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                    <p className="text-slate-500 font-medium">This section is empty.</p>
                    <p className="text-sm text-slate-400 mt-1">Add lessons, quizzes, or assignments.</p>
                  </div>
                )}

                {/* Content List */}
                {activeSection.lessons.map((lesson, idx) => (
                  <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key={lesson._id} className="group bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-green-300 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      {lesson.type === 'video' && <FaVideo />}
                      {lesson.type === 'pdf' && <FaFilePdf />}
                      {lesson.type === 'text' && <FaBook />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm">{lesson.title}</h4>
                      <p className="text-xs text-slate-500 uppercase mt-0.5">{lesson.type}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-slate-400 hover:text-red-500 p-2"><FaTrash/></button>
                    </div>
                  </motion.div>
                ))}

                {activeSection.assessments.map((assessment) => (
                  <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key={assessment._id} className="group bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      {assessment.type === 'quiz' ? <FaCheckSquare /> : <FaClipboardList />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm">{assessment.title}</h4>
                      <div className="flex gap-3 text-xs text-slate-500 font-medium uppercase mt-0.5">
                        <span>{assessment.type}</span>
                        <span className="text-slate-300">|</span>
                        <span>Pass: {assessment.passingScore}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-slate-400 hover:text-red-500 p-2"><FaTrash/></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Select a section to start editing
            </div>
          )}
        </div>
      </div>

      {/* --- Modals (Reuse existing HTML forms but formatted cleanly) --- */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add New Section</h2>
            <form onSubmit={handleAddSection} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Section Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-green-400" placeholder="e.g. Introduction to Programming" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={resetForms} className="px-4 py-2 font-medium text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl disabled:opacity-50">Create Section</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar">
            <h2 className="text-xl font-bold mb-4">Add Lesson / Note</h2>
            <form onSubmit={handleAddLesson} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Lesson Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-green-400">
                  <option value="video">Video</option>
                  <option value="pdf">PDF Note</option>
                  <option value="text">Text / Article</option>
                </select>
              </div>

              {type === 'video' && (
                <div>
                   <label className="text-sm font-medium text-slate-700 block mb-2">Video Source</label>
                   <div className="flex gap-3 mb-3">
                     <button type="button" onClick={() => setVideoSource('upload')} className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${videoSource === 'upload' ? 'bg-green-50 border-green-400 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        <FaVideo className="inline mr-2" /> Upload from PC
                     </button>
                     <button type="button" onClick={() => setVideoSource('link')} className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${videoSource === 'link' ? 'bg-green-50 border-green-400 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        <FaLink className="inline mr-2" /> Video Link
                     </button>
                   </div>
                </div>
              )}

              {type === 'video' && videoSource === 'link' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Video URL (YouTube, Vimeo, etc)</label>
                  <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." required className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-green-400" />
                </div>
              )}

              {((type === 'video' && videoSource === 'upload') || type === 'pdf') && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Upload File</label>
                  <input type="file" required onChange={e => setFile(e.target.files[0])} accept={type === 'video' ? 'video/*' : 'application/pdf'} className="w-full text-sm mb-1 border border-slate-200 p-2 rounded-xl" />
                  <p className="text-xs text-slate-400 mt-1">Maximum file size: 100MB</p>
                </div>
              )}

              {type === 'text' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Content</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} required rows={4} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-green-400" />
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={resetForms} className="px-4 py-2 font-medium text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl disabled:opacity-50">Upload Lesson</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assessment/Test Modal */}
      {(showAssessmentModal.show || showFinalTestModal) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{showFinalTestModal ? 'Add Final Test' : 'Add Assessment'}</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <form id="assessment-form" onSubmit={e => handleAddAssessment(e, showFinalTestModal)} className="space-y-5 px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className={showFinalTestModal ? "col-span-2" : "col-span-1"}>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder={showFinalTestModal ? "Course Final Exam" : "Module 1 Quiz"} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-green-400" />
                  </div>
                  
                  {!showFinalTestModal && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">Type</label>
                      <select value={assessmentType} onChange={e => setAssessmentType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-green-400">
                        <option value="quiz">Quiz (Multiple Choice)</option>
                        <option value="assignment">Assignment (Theory / PDF)</option>
                      </select>
                    </div>
                  )}

                  <div className={showFinalTestModal ? "col-span-2" : "col-span-2"}>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Passing Score (%)</label>
                    <input type="number" min="1" max="100" value={passingScore} onChange={e => setPassingScore(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-green-400" />
                  </div>
                </div>

                {/* Assignment Builder (Upload or Write Theory) */}
                {assessmentType === 'assignment' && !showFinalTestModal && (
                  <div className="border-t border-slate-200 pt-4">
                     <label className="text-sm font-bold text-slate-800 block mb-3">Assignment Source</label>
                     <div className="flex gap-3 mb-4">
                       <button type="button" onClick={() => setAssignmentSource('upload')} className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${assignmentSource === 'upload' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                          <FaFilePdf className="inline mr-2" /> Upload PDF
                       </button>
                       <button type="button" onClick={() => setAssignmentSource('text')} className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${assignmentSource === 'text' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                          <FaBook className="inline mr-2" /> Write Theory
                       </button>
                     </div>

                     {assignmentSource === 'upload' && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="text-sm font-medium text-slate-700 block mb-1.5">Upload Official Assignment PDF</label>
                          <input type="file" onChange={e => setFile(e.target.files[0])} accept="application/pdf" className="w-full text-sm bg-white border border-slate-200 p-2 rounded-lg" />
                        </div>
                     )}

                     {assignmentSource === 'text' && (
                        <div>
                          <label className="text-sm font-medium text-slate-700 block mb-1.5">Theory Questions & Exercises</label>
                          <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} placeholder="1. Explain..." className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-green-400 text-sm resize-none" />
                        </div>
                     )}
                  </div>
                )}

                {/* Quiz / Test Builder */}
                {(assessmentType === 'quiz' || showFinalTestModal) && (
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-bold text-slate-800">Questions Builder</label>
                      <button type="button" onClick={addQuestion} className="text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <FaPlus /> Add Question
                      </button>
                    </div>

                    {questions.map((q, qIndex) => (
                      <div key={qIndex} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 relative group">
                        <button type="button" onClick={() => removeQuestion(qIndex)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove question">
                          <FaTrash />
                        </button>
                        <div className="mb-3">
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Question {qIndex + 1}</label>
                          <input type="text" value={q.question} onChange={e => updateQuestion(qIndex, 'question', e.target.value)} placeholder="e.g. What is JSX?" required className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex}>
                               <label className="text-xs font-semibold text-slate-500 block mb-1">Option {oIndex + 1}</label>
                               <input type="text" value={opt} onChange={e => updateOption(qIndex, oIndex, e.target.value)} required placeholder={`Option ${oIndex + 1}`} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 text-sm" />
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-green-600 block mb-1">Correct Answer</label>
                          <select value={q.correctAnswer} onChange={e => updateQuestion(qIndex, 'correctAnswer', e.target.value)} required className="w-full bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg outline-none focus:border-green-400 text-sm font-medium">
                            <option value="">-- Select the exact correct option --</option>
                            {q.options.map((opt, i) => opt.trim() && (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-2 bg-white">
              <button type="button" onClick={resetForms} className="px-4 py-2 font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" form="assessment-form" disabled={submitting} className="px-5 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl disabled:opacity-50 transition-colors">
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseBuilder;
