import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCourses, getTopMentors } from '../../services/api';
import CourseCard from '../../components/CourseCard/CourseCard';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaCertificate, FaChalkboardTeacher, FaRocket, FaStar, FaShieldAlt, FaGlobe, FaQuoteLeft, FaArrowRight, FaUsers, FaBookOpen, FaAward, FaLaptopCode, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [topMentors, setTopMentors] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    getCourses().then(res => setFeatured(res.data.data?.slice(0, 8) || [])).catch(() => {});
    getTopMentors().then(res => setTopMentors(res.data.data || [])).catch(() => {});
  }, []);

  const handleStartTeaching = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
    } else if (user.role === 'student') {
      if (user.verificationStatus === 'Pending') {
        toast('Your mentor application is already pending.', { icon: '⏳' });
        navigate('/mentor-verification');
      } else {
        // Show alert modal instead of direct redirect
        setShowApplyModal(true);
      }
    } else if (user.role === 'mentor') {
      navigate('/mentor');
    } else if (user.role === 'admin') {
      navigate('/admin');
    }
  };

  // ── Static Data ──
  const stats = [
    { value: '10K+', label: 'Active Students', icon: <FaUsers /> },
    { value: '500+', label: 'Premium Courses', icon: <FaBookOpen /> },
    { value: '120+', label: 'Expert Mentors', icon: <FaChalkboardTeacher /> },
    { value: '95%', label: 'Success Rate', icon: <FaAward /> },
  ];

  const mentors = [
    { name: 'Sarah Johnson', role: 'Full Stack Developer', courses: 12, students: 2400, rating: 4.9, avatar: 'SJ', gradient: 'from-green-400 to-emerald-500' },
    { name: 'Michael Chen', role: 'Data Scientist', courses: 8, students: 1800, rating: 4.8, avatar: 'MC', gradient: 'from-teal-400 to-cyan-500' },
    { name: 'Priya Sharma', role: 'UI/UX Designer', courses: 10, students: 3200, rating: 4.9, avatar: 'PS', gradient: 'from-emerald-400 to-green-500' },
    { name: 'James Wilson', role: 'Cloud Architect', courses: 6, students: 1500, rating: 4.7, avatar: 'JW', gradient: 'from-lime-400 to-green-500' },
  ];

  const popularCourses = [
    { _id: '1', title: 'Complete React & Next.js Masterclass 2025', price: 499, thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop', mentor: { name: 'Sarah Johnson' }, averageRating: 4.9, studentCount: 2400 },
    { _id: '2', title: 'Python for Data Science & Machine Learning', price: 599, thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop', mentor: { name: 'Michael Chen' }, averageRating: 4.8, studentCount: 1800 },
    { _id: '3', title: 'Modern UI/UX Design with Figma', price: 399, thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop', mentor: { name: 'Priya Sharma' }, averageRating: 4.9, studentCount: 3200 },
    { _id: '4', title: 'AWS Cloud Architecture Bootcamp', price: 699, thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop', mentor: { name: 'James Wilson' }, averageRating: 4.7, studentCount: 1500 },
  ];

  const testimonials = [
    { name: 'Ananya Gupta', role: 'Frontend Developer at Flipkart', text: 'SkillSphere completely transformed my career. The React course was so well-structured that I landed my dream job within 3 months of completing it!', rating: 5, avatar: 'AG' },
    { name: 'Rahul Verma', role: 'Data Analyst at Google', text: 'The Python for Data Science course is incredible. The mentors are responsive, the quizzes reinforce learning, and the certificate helped me stand out.', rating: 5, avatar: 'RV' },
    { name: 'Emily Roberts', role: 'Freelance Designer', text: 'As a self-taught designer, SkillSphere gave me the structured learning I needed. The UI/UX course was world-class and practical.', rating: 5, avatar: 'ER' },
  ];

  const categories = [
    { name: 'Web Development', count: 120, icon: <FaLaptopCode />, color: 'from-green-500 to-emerald-600' },
    { name: 'Data Science', count: 85, icon: <FaBookOpen />, color: 'from-teal-500 to-cyan-600' },
    { name: 'UI/UX Design', count: 64, icon: <FaAward />, color: 'from-emerald-500 to-green-600' },
    { name: 'Cloud & DevOps', count: 52, icon: <FaGlobe />, color: 'from-lime-500 to-green-600' },
    { name: 'Mobile Development', count: 78, icon: <FaRocket />, color: 'from-green-600 to-teal-600' },
    { name: 'Cybersecurity', count: 41, icon: <FaShieldAlt />, color: 'from-emerald-600 to-teal-700' },
  ];

  // Use API courses if available, otherwise show sample data
  const displayCourses = featured.length > 0 ? featured.slice(0, 4) : popularCourses;

  // Use API mentors if available, otherwise show sample data
  const displayMentors = topMentors.length > 0 ? topMentors.map((m, i) => {
    const gradients = [
      'from-green-400 to-emerald-500',
      'from-teal-400 to-cyan-500',
      'from-emerald-400 to-green-500',
      'from-lime-400 to-green-500'
    ];
    return {
      name: m.name,
      role: m.verificationData?.expertise?.[0] || 'Expert Mentor',
      courses: m.coursesCount || 0,
      students: m.studentsCount || 0,
      rating: m.rating || 0,
      avatar: m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover rounded-full" /> : (m.name || 'EM').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      gradient: gradients[i % gradients.length]
    };
  }) : mentors;

  return (
    <div className="pt-16 overflow-hidden relative">
      
      {/* ── Alert Modal ── */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowApplyModal(false)}></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative z-10 text-center"
            >
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaExclamationTriangle className="text-4xl text-yellow-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">Become a Mentor</h3>
              <p className="text-slate-500 mt-3 font-medium">You are currently registered as a student. To become a mentor, you need to complete a quick 5-step verification process. Do you want to proceed?</p>
              
              <div className="flex gap-4 mt-8">
                <button onClick={() => setShowApplyModal(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={() => { setShowApplyModal(false); navigate('/mentor-verification'); }} className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all">
                  Proceed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 gradient-hero"></div>
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-teal-100/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-green-700 text-xs font-bold px-5 py-2.5 rounded-full shadow-sm border border-green-100">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                #1 Learning Platform — Trusted by 10,000+ learners
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Unlock Your
                <br />
                <span className="text-gradient">Full Potential</span>
              </h1>

              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                World-class courses from industry experts. Master in-demand skills, earn recognized certificates, and accelerate your career — all in one place.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/courses" className="group gradient-primary text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-green-400/30 transition-all text-sm flex items-center gap-2">
                  Explore Courses <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button onClick={handleStartTeaching} className="bg-white text-green-700 font-bold px-8 py-4 rounded-2xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all text-sm shadow-sm">
                  Start Teaching →
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-8 pt-4">
                <div className="flex -space-x-3">
                  {['bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-green-600'].map((bg, i) => (
                    <div key={i} className={`w-10 h-10 ${bg} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                      {['A', 'R', 'S', 'M', 'K'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => <FaStar key={i} className="text-yellow-400 text-sm" />)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">4.9/5 from 2,400+ reviews</p>
                </div>
              </div>
            </div>

            {/* Hero Visual Illustration */}
            <div className="relative mt-12 lg:mt-0 flex justify-center lg:justify-end w-full">
               <div className="absolute inset-0 bg-green-500/10 blur-[100px] rounded-full pointer-events-none"></div>
               <img 
                  src="/hero-girl-study.png" 
                  alt="Girl studying online" 
                  className="w-full max-w-xs sm:max-w-md lg:max-w-lg object-contain relative z-10 drop-shadow-2xl animate-float mix-blend-multiply"
                  style={{
                    WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 95%)',
                    maskImage: 'radial-gradient(circle at center, black 65%, transparent 95%)'
                  }}
               />
               
               {/* Floating Badges */}
               <div className="absolute top-10 -left-2 sm:-left-6 lg:-left-12 bg-white rounded-2xl p-3 sm:p-4 shadow-xl border border-green-50 animate-float z-20 flex items-center gap-3 scale-75 sm:scale-100 origin-top-left">
                 <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center"><FaCertificate className="text-yellow-500" /></div>
                 <div>
                   <p className="text-xs font-bold text-slate-800">Certificate Earned!</p>
                   <p className="text-[10px] text-slate-400">Just now</p>
                 </div>
               </div>

               <div className="absolute bottom-10 -right-2 sm:-right-6 lg:-right-10 bg-white rounded-2xl px-4 sm:px-5 py-2 sm:py-3 shadow-xl border border-green-50 animate-float z-20 flex items-center gap-2 scale-75 sm:scale-100 origin-bottom-right" style={{ animationDelay: '1.5s' }}>
                 <div className="flex -space-x-2">
                   {['bg-green-400', 'bg-emerald-400', 'bg-teal-400'].map((bg, i) => (
                     <div key={i} className={`w-7 h-7 ${bg} rounded-full border-2 border-white text-white text-[9px] font-bold flex items-center justify-center`}>{['A', 'R', 'S'][i]}</div>
                   ))}
                 </div>
                 <div>
                   <p className="text-xs font-bold text-slate-800">+240 enrolled</p>
                   <p className="text-[10px] text-slate-400">this week</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS BAR ══════════════════ */}
      <section className="relative -mt-6 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl border border-green-100 p-2">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className={`flex items-center gap-4 px-6 py-5 ${i < stats.length - 1 ? 'lg:border-r border-green-100' : ''}`}>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-green-600 text-lg icon-3d">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ CATEGORIES ══════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-green-600 font-bold text-sm uppercase tracking-widest">Browse Topics</span>
            <h2 className="text-4xl font-black text-slate-900 mt-3">Explore Popular Categories</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Choose from hundreds of courses across the most in-demand skill areas</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, i) => (
              <Link to="/courses" key={i} className="group flex items-center gap-5 bg-gradient-to-r from-white to-green-50/50 p-5 rounded-2xl border border-green-100 hover:border-green-300 hover:shadow-lg transition-all duration-300">
                <div className={`w-14 h-14 bg-gradient-to-br ${cat.color} rounded-2xl flex items-center justify-center text-white text-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all icon-3d`}>
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 group-hover:text-green-700 transition-colors">{cat.name}</h3>
                  <p className="text-xs text-slate-500">{cat.count} courses</p>
                </div>
                <FaArrowRight className="text-slate-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ POPULAR COURSES ══════════════════ */}
      <section className="py-24 bg-gradient-to-b from-green-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-14">
            <div>
              <span className="text-green-600 font-bold text-sm uppercase tracking-widest">Top Rated</span>
              <h2 className="text-4xl font-black text-slate-900 mt-3">Popular Courses</h2>
              <p className="text-slate-500 mt-2">Handpicked by our team — loved by thousands</p>
            </div>
            <Link to="/courses" className="hidden sm:flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 transition-colors bg-green-50 px-5 py-2.5 rounded-xl hover:bg-green-100">
              View All <FaArrowRight className="text-xs" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayCourses.map(course => <CourseCard key={course._id} course={course} />)}
          </div>
          <div className="text-center mt-10 sm:hidden">
            <Link to="/courses" className="gradient-primary text-white font-bold px-8 py-3 rounded-xl shadow-md text-sm">
              View All Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ WHY CHOOSE US ══════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-green-600 font-bold text-sm uppercase tracking-widest">Why SkillSphere</span>
              <h2 className="text-4xl font-black text-slate-900 mt-3 leading-tight">Everything You Need to<br /><span className="text-gradient">Succeed</span></h2>
              <p className="text-slate-500 mt-4 leading-relaxed">We've built the most comprehensive learning platform designed for real-world success. From structured courses to hands-on projects.</p>
              
              <div className="mt-10 space-y-5">
                {[
                  { title: 'HD Video Lessons', desc: 'Stream crystal-clear lessons from any device, anytime.' },
                  { title: 'Industry Certificates', desc: 'Earn recognized certificates upon completing each course.' },
                  { title: 'Quizzes & Assignments', desc: 'Reinforce learning with hands-on assessments and final tests.' },
                  { title: 'Mentor Support', desc: 'Get guidance from industry professionals who care about your growth.' },
                  { title: 'Progress Tracking', desc: 'Monitor your learning journey with detailed analytics.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-green-500 transition-colors">
                      <FaCheck className="text-green-600 text-xs group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Visual */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <FaPlay />, title: 'HD Video', value: '5000+ hours', gradient: 'from-green-400 to-emerald-500' },
                  { icon: <FaCertificate />, title: 'Certificates', value: 'Verified', gradient: 'from-yellow-400 to-orange-400' },
                  { icon: <FaShieldAlt />, title: 'Secure Pay', value: '80/20 Split', gradient: 'from-teal-400 to-cyan-500' },
                  { icon: <FaGlobe />, title: 'Access', value: 'Worldwide', gradient: 'from-emerald-400 to-green-500' },
                ].map((card, i) => (
                  <div key={i} className={`bg-white rounded-2xl p-6 shadow-lg border border-green-50 card-hover ${i === 1 ? 'mt-8' : ''} ${i === 2 ? '-mt-4' : ''}`}>
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center text-white text-lg shadow-md icon-3d mb-4`}>
                      {card.icon}
                    </div>
                    <h4 className="font-bold text-slate-800">{card.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ TOP MENTORS ══════════════════ */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-green-400 font-bold text-sm uppercase tracking-widest">Learn from the Best</span>
            <h2 className="text-4xl font-black text-white mt-3">Meet Our Top Mentors</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">Industry professionals with years of real-world experience, dedicated to helping you succeed</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayMentors.map((m, i) => (
              <div key={i} className="relative group rounded-3xl p-1 overflow-hidden">
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}></div>
                <div className="relative bg-slate-900/90 backdrop-blur-xl h-full rounded-[1.4rem] p-6 border border-white/10 group-hover:border-transparent transition-colors text-center flex flex-col items-center shadow-2xl">
                  
                  {/* Avatar */}
                  <div className="relative mb-5">
                    <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} blur-xl rounded-full opacity-20 group-hover:opacity-60 transition-opacity duration-500`}></div>
                    <div className={`w-24 h-24 bg-gradient-to-br ${m.gradient} p-[2px] rounded-full relative z-10 mx-auto shadow-xl`}>
                      <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-white font-black text-3xl overflow-hidden border-2 border-slate-900">
                         {m.avatar}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <h3 className="font-bold text-xl text-white mt-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">{m.name}</h3>
                  <p className="text-sm text-green-400 mt-1 mb-5 font-medium tracking-wide">{m.role}</p>
                  
                  {/* Divider */}
                  <div className="w-12 h-0.5 bg-white/10 rounded-full mb-5 group-hover:bg-white/30 transition-colors duration-300"></div>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-6 w-full mt-auto">
                    <div className="flex flex-col items-center">
                      <span className="text-white font-black text-lg">{m.courses}</span>
                      <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-1">Courses</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-white font-black text-lg">{m.students.toLocaleString()}</span>
                      <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-1">Students</span>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-xl group-hover:border-white/20 transition-colors">
                    <FaStar className="text-yellow-400 text-xs" />
                    <span className="text-white text-xs font-bold">{m.rating > 0 ? Number(m.rating).toFixed(1) : 'New'}</span>
                  </div>

                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/courses" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-green-500/30 transition-all text-sm">
              Browse All Mentors <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="py-24 bg-gradient-to-b from-green-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-green-600 font-bold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl font-black text-slate-900 mt-3">What Our Students Say</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Real stories from real learners who transformed their careers with SkillSphere</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="relative bg-white rounded-3xl p-8 shadow-lg border border-green-50 card-hover group">
                {/* Quote Decoration */}
                <div className="absolute top-6 right-6 w-12 h-12 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <FaQuoteLeft className="text-green-400 text-lg" />
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-5">
                  {[...Array(t.rating)].map((_, j) => <FaStar key={j} className="text-yellow-400 text-sm" />)}
                </div>

                <p className="text-slate-600 leading-relaxed text-sm mb-6">"{t.text}"</p>

                <div className="flex items-center gap-3 pt-4 border-t border-green-50">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{t.name}</p>
                    <p className="text-xs text-green-600">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ BECOME A MENTOR ══════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-12 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>

            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-green-400 font-bold text-sm uppercase tracking-widest">For Educators</span>
                <h2 className="text-3xl lg:text-4xl font-black text-white mt-4 leading-tight">Share Your Knowledge,<br />Earn <span className="text-green-400">80%</span> Revenue</h2>
                <p className="text-slate-400 mt-5 leading-relaxed">Join our growing community of expert mentors. Create courses, upload videos, build quizzes, and earn 80% of every sale — we handle the rest.</p>
                <div className="flex flex-wrap gap-4 mt-8">
                  <button onClick={handleStartTeaching} className="gradient-primary text-white font-bold px-8 py-4 rounded-2xl shadow-lg text-sm flex items-center gap-2 hover:shadow-green-500/30 transition-all">
                    Start Teaching <FaArrowRight />
                  </button>
                </div>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-4">
                {[
                  { icon: <FaPlay />, title: 'Video Upload', desc: 'Cloudinary CDN' },
                  { icon: <FaBookOpen />, title: 'Course Builder', desc: 'Sections & Lessons' },
                  { icon: <FaAward />, title: 'Assessments', desc: 'Quiz & Assignments' },
                  { icon: <FaChalkboardTeacher />, title: 'Analytics', desc: 'Track Performance' },
                ].map((f, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-3">
                      {f.icon}
                    </div>
                    <h4 className="font-bold text-white text-sm">{f.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FINAL CTA ══════════════════ */}
      <section className="py-24 gradient-hero relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            Ready to Start Your
            <br />
            <span className="text-gradient">Learning Journey?</span>
          </h2>
          <p className="text-slate-600 mt-5 text-lg max-w-lg mx-auto leading-relaxed">
            Join 10,000+ learners already building their future with SkillSphere. Your next skill is just one click away.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link to="/register" className="gradient-primary text-white font-bold px-10 py-4 rounded-2xl shadow-xl hover:shadow-green-400/30 transition-all text-sm flex items-center gap-2">
              Get Started Free <FaArrowRight />
            </Link>
            <Link to="/courses" className="bg-white text-green-700 font-bold px-10 py-4 rounded-2xl border-2 border-green-200 hover:border-green-400 transition-all text-sm shadow-sm">
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
