import { useEffect, useState } from 'react';
import { getMyPayments } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaSearch, FaBookOpen, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const StudentCoursesSkeleton = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm h-[320px]">
        <div className="w-full h-40 bg-slate-200 rounded-[1.5rem] mb-4"></div>
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
        <div className="h-2 bg-slate-200 rounded w-full mb-2"></div>
      </div>
    ))}
  </div>
);

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All'); // All, Ongoing, Completed
  const navigate = useNavigate();

  useEffect(() => {
    getMyPayments()
      .then(res => {
         const enrolled = res.data?.data?.map(payment => ({
           ...payment.course,
           progress: Math.floor(Math.random() * 100), // Mock progress
         })) || [];
         setCourses(enrolled);
         setFilteredCourses(enrolled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = courses;
    
    if (searchQuery) {
      result = result.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filter === 'Ongoing') {
      result = result.filter(c => c.progress < 100);
    } else if (filter === 'Completed') {
      result = result.filter(c => c.progress === 100);
    }

    setFilteredCourses(result);
  }, [searchQuery, filter, courses]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Courses</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Pick up right where you left off</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-full sm:w-64 shadow-sm"
            />
          </div>

          {/* Filter */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-slate-400 text-xs" />
            </div>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none shadow-sm cursor-pointer"
            >
              <option value="All">All Courses</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <StudentCoursesSkeleton />
      ) : filteredCourses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]"
        >
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <FaBookOpen className="text-4xl text-slate-300" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">No courses found</h3>
          <p className="text-slate-500 mt-2 font-medium max-w-sm">
            {courses.length === 0 
              ? "You haven't enrolled in any courses yet. Start your journey today!" 
              : "We couldn't find any courses matching your search or filter."}
          </p>
          {courses.length === 0 && (
            <button onClick={() => navigate('/courses')} className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95">
              Browse Courses
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCourses.map((course, idx) => (
              <motion.div 
                key={course._id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: 0.05 * idx }}
                whileHover={{ y: -8 }}
                onClick={() => navigate(`/student/player?courseId=${course._id}`)}
                className="group cursor-pointer bg-white rounded-[2rem] p-4 border border-slate-100 shadow-md hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col gap-4"
              >
                <div className="w-full h-44 rounded-[1.5rem] overflow-hidden relative">
                  <img src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400'} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  
                  {/* Floating Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-white shadow-2xl">
                      <FaPlay className="ml-1 text-xl" />
                    </div>
                  </div>
                  
                  {course.progress === 100 && (
                     <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide shadow-md">
                        Completed
                     </div>
                  )}
                </div>
                
                <div className="flex flex-col flex-grow px-2 pb-2">
                  <h3 className="font-extrabold text-lg text-slate-900 leading-tight group-hover:text-green-600 transition-colors line-clamp-2 mb-2">{course.title}</h3>
                  <p className="text-xs font-medium text-slate-500 mb-4">Instructor: {course.mentor?.name || 'Expert'}</p>
                  
                  <div className="mt-auto space-y-3">
                    <div className="flex justify-between items-end">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Progress</p>
                       <span className={`text-sm font-black ${course.progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-[1px]">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${course.progress}%` }} transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
                        className={`h-full rounded-full ${course.progress === 100 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}
                      />
                    </div>
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

export default StudentCourses;
