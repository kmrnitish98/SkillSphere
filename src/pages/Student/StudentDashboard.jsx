import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBook, FaCertificate, FaHeart, FaPlay, FaChartLine, FaClock,
  FaArrowRight, FaFire, FaTrophy, FaStar, FaMedal, FaCrown
} from 'react-icons/fa';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { getMyPayments, getCourses } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import stuImg from '../../../public/stuimg.png';
// --- MOCK DATA ---
const statsData = [
  { name: 'Mon', hours: 1.2 }, { name: 'Tue', hours: 3.5 }, { name: 'Wed', hours: 2.0 },
  { name: 'Thu', hours: 4.8 }, { name: 'Fri', hours: 3.1 }, { name: 'Sat', hours: 6.5 },
  { name: 'Sun', hours: 5.0 },
];

const completionData = [
  { name: 'Completed', value: 45, color: '#22c55e' },
  { name: 'Remaining', value: 55, color: '#f1f5f9' },
];

const recentActivity = [
  { id: 1, type: 'course_start', title: 'Started "Advanced React Patterns"', time: '2 hours ago', icon: '🚀', color: 'bg-blue-100 text-blue-600' },
  { id: 2, type: 'lesson_complete', title: 'Finished "Hooks Deep Dive"', time: '5 hours ago', icon: '✅', color: 'bg-green-100 text-green-600' },
  { id: 3, type: 'quiz_pass', title: 'Passed UI/UX Quiz with 95%', time: 'Yesterday', icon: '🏆', color: 'bg-yellow-100 text-yellow-600' },
];

// --- 3D SCENE ---
const AnimatedSphere = () => {
  const meshRef = useRef();

  useFrame((state) => {
    // Pointer coordinates are normalized between -1 and 1
    const { pointer } = state;

    // Smoothly interpolate rotation and position based on mouse position
    if (meshRef.current) {
      meshRef.current.rotation.x += (pointer.y * 0.8 - meshRef.current.rotation.x) * 0.1;
      meshRef.current.rotation.y += (pointer.x * 0.8 - meshRef.current.rotation.y) * 0.1;

      meshRef.current.position.x += (pointer.x * 0.5 - meshRef.current.position.x) * 0.1;
      meshRef.current.position.y += (pointer.y * 0.5 - meshRef.current.position.y) * 0.1;
    }
  });

  return (
    <Float speed={3} rotationIntensity={1.5} floatIntensity={2.5}>
      <Sphere ref={meshRef} args={[1.2, 100, 200]} scale={1.3}>
        <MeshDistortMaterial
          color="#4ade80"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

const Hero3D = () => (
  <div className="h-48 w-full md:h-56 md:w-72">
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <Suspense fallback={null}>
        <AnimatedSphere />
      </Suspense>
    </Canvas>
  </div>
);

// --- SKELETON LOADER ---
const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto space-y-8 pb-10 px-4 sm:px-6 lg:px-8 animate-pulse mt-8">
    <div className="h-[280px] bg-slate-200 rounded-3xl w-full"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
        </div>
        <div className="h-[350px] bg-slate-200 rounded-3xl"></div>
      </div>
      <div className="space-y-8">
        <div className="h-[200px] bg-slate-200 rounded-3xl"></div>
        <div className="h-[300px] bg-slate-200 rounded-3xl"></div>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const paymentsRes = await getMyPayments();
        const payments = paymentsRes.data.data || [];

        const enrolled = payments
          .filter(p => p.course)
          .map(p => ({
            id: p.course._id,
            title: p.course.title,
            thumbnail: p.course.thumbnailUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=300',
            price: p.course.price,
            progress: Math.floor(Math.random() * 60) + 20,
            lastAccessed: 'Recently'
          }));
        setEnrolledCourses(enrolled);

        const coursesRes = await getCourses();
        const allCourses = coursesRes.data.data || [];
        const enrolledIds = enrolled.map(c => c.id);

        const recommendations = allCourses
          .filter(c => !enrolledIds.includes(c._id) && c.status === 'published')
          .slice(0, 6)
          .map(c => ({
            id: c._id,
            title: c.title,
            level: 'All Levels',
            price: `₹${c.price}`,
            instructor: c.mentor?.name || 'Expert',
            thumbnail: c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=300'
          }));
        setRecommendedCourses(recommendations);
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const mainStats = [
    { label: 'Enrolled Courses', value: enrolledCourses.length.toString(), icon: <FaBook />, bg: 'bg-green-50', color: 'text-green-600' },
    { label: 'Certificates', value: user?.certificates?.length || 0, icon: <FaCertificate />, bg: 'bg-yellow-50', color: 'text-yellow-600' },
    { label: 'Favorites', value: user?.favoriteMentors?.length || 0, icon: <FaHeart />, bg: 'bg-pink-50', color: 'text-pink-600' },
    { label: 'Learning Streak', value: '5 Days', icon: <FaFire />, bg: 'bg-orange-50', color: 'text-orange-600' },
  ];

  // Gamification logic
  const xpPoints = 1450;
  const nextLevelXp = 2000;
  const xpProgress = (xpPoints / nextLevelXp) * 100;

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 pb-12 px-4 sm:px-6 lg:px-8 mt-4">

      {/* 1. HERO SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative overflow-hidden animate-gradient bg-gradient-to-r from-slate-900 via-slate-800 to-green-950 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-14 text-white shadow-2xl flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-0 border border-slate-700/50"
      >
        <div className="z-10 space-y-5 max-w-xl text-center md:text-left w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm font-medium text-green-300"
          >
            <FaCrown className="text-yellow-400" /> Pro Scholar
          </motion.div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold leading-tight tracking-tight break-words">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">{user?.name || 'Student'}</span> 👋
          </h1>
          <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-medium max-w-lg leading-relaxed">
            You're in the top <span className="text-green-400 font-bold">15%</span> of learners this week. Keep up the amazing momentum!
          </p>
          <div className="pt-2">
            <button className="group bg-white text-slate-900 px-8 py-4 sm:py-3.5 rounded-2xl font-bold transition-all transform hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/20 flex items-center gap-3 mx-auto md:mx-0 w-full sm:w-auto justify-center min-h-[44px]">
              Resume Learning
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="relative w-full md:w-auto flex justify-center perspective-1000">
          <div className="absolute inset-0 bg-green-500/30 blur-[100px] rounded-full mix-blend-screen"></div>
          <img src={stuImg} alt="Student" className="relative z-10 w-full max-w-[260px] md:max-w-[320px] object-contain drop-shadow-2xl animate-float" />
        </div>
      </motion.div>

      {/* 2. GRID LAYOUT: STATS, ANALYTICS, GAMIFICATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (Stats + Analytics) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {mainStats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-[2rem] p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col items-center text-center gap-3"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 ${s.bg} rounded-2xl flex items-center justify-center ${s.color} text-xl sm:text-2xl shadow-inner`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Advanced Learning Analytics */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm overflow-hidden flex flex-col sm:flex-row gap-8"
          >
            {/* Area Chart */}
            <div className="flex-grow min-w-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Study Overview</h2>
                  <p className="text-sm text-slate-500 font-medium">Hours spent learning (7 days)</p>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 self-start sm:self-auto">
                  <FaChartLine className="text-green-600" />
                  <span className="text-xs font-bold text-green-700">+18%</span>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                    <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="hours" stroke="#22c55e" strokeWidth={4} fillOpacity={1} fill="url(#colorHours)" activeDot={{ r: 6, fill: '#fff', stroke: '#22c55e', strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart Mini */}
            <div className="w-full sm:w-48 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0 sm:pl-6">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Overall Progress</h3>
              <div className="h-32 w-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={completionData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                      {completionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-black text-slate-900">45%</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium text-center mt-2">Course completion average</p>
            </div>
          </motion.div>
        </div>

        {/* Right Column (Gamification + Timeline) */}
        <div className="space-y-8">

          {/* Gamification Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <FaTrophy className="text-8xl" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Current Level</p>
                  <h3 className="text-2xl font-black flex items-center gap-2">Lv. 12 <FaStar className="text-yellow-400 text-lg flex-shrink-0" /></h3>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-sm font-bold flex items-center gap-2 self-start sm:self-auto">
                  <FaMedal className="text-yellow-400 flex-shrink-0" /> {xpPoints} XP
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-indigo-200">
                  <span>Progress to Lv. 13</span>
                  <span>{xpPoints} / {nextLevelXp} XP</span>
                </div>
                <div className="w-full bg-indigo-950/50 h-3 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-full rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Timeline UI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col h-[350px]"
          >
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">Recent Activity</h2>
            <div className="space-y-6 flex-grow overflow-y-auto no-scrollbar pr-2">
              {recentActivity.map((activity, idx) => (
                <motion.div key={activity.id} whileHover={{ x: 5 }} className="relative flex gap-5 group cursor-default">
                  {idx !== recentActivity.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-[-1.5rem] w-0.5 bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>
                  )}
                  <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl z-10 ${activity.color} shadow-sm group-hover:scale-110 transition-transform`}>
                    {activity.icon}
                  </div>
                  <div className="pt-1.5">
                    <h4 className="text-sm font-bold text-slate-800">{activity.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                      <FaClock className="text-slate-400" /> {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. CONTINUE LEARNING (ENROLLED) */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Continue Learning</h2>
          {enrolledCourses.length > 0 && (
            <button className="text-green-600 font-bold hover:text-green-700 transition-colors text-sm flex items-center gap-1 self-start sm:self-auto">
              View All <FaArrowRight className="text-[10px]" />
            </button>
          )}
        </div>

        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {enrolledCourses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }}
                  whileHover={{ y: -8 }}
                  onClick={() => navigate(`/student/player?courseId=${course.id}`)}
                  className="group cursor-pointer bg-white rounded-[2rem] p-4 border border-slate-100 shadow-md hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex flex-col gap-4"
                >
                  <div className="w-full h-40 sm:h-48 rounded-[1.5rem] overflow-hidden relative">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

                    {/* Floating Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-white shadow-2xl">
                        <FaPlay className="ml-1 text-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow px-2 pb-2">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="font-extrabold text-lg text-slate-900 leading-tight group-hover:text-green-600 transition-colors line-clamp-2">{course.title}</h3>
                    </div>

                    <div className="mt-auto space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Progress</p>
                        <span className="text-sm font-black text-green-600">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-[1px]">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${course.progress}%` }} transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
                          className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner">🎯</div>
            <h3 className="text-xl font-extrabold text-slate-900">Your journey begins here</h3>
            <p className="text-slate-500 text-base mt-2 max-w-md mx-auto font-medium">Explore our premium catalog below and enroll in your first course to unlock the full dashboard.</p>
          </motion.div>
        )}
      </section>

      {/* 4. RECOMMENDED COURSES (SMART UI) */}
      <section className="space-y-6 pt-8 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Top Recommendations</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Curated based on your interests</p>
          </div>
        </div>

        {recommendedCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
            {recommendedCourses.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ y: -8 }}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-md hover:shadow-xl hover:shadow-slate-200/60 overflow-hidden group w-full"
              >
                <div className="h-44 relative">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-lg">
                    {course.level}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-green-600 transition-colors line-clamp-2 leading-tight">{course.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-2">By <span className="text-slate-700">{course.instructor}</span></p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xl font-black text-slate-900">{course.price}</span>
                    <button
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-green-600 transition-all shadow-md hover:shadow-green-500/30 active:scale-95"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm font-medium">No new recommendations at this time.</p>
        )}
      </section>

      {/* Global Styles */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 12s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;

