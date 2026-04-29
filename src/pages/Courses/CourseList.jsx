import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCourses } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiSearch, HiAdjustments, HiOutlineHeart, HiHeart, 
  HiStar, HiUsers, HiClock, HiBookOpen, HiX, HiChevronDown
} from 'react-icons/hi';

// --- Premium Course Card ---
const PremiumCourseCard = ({ course }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();
  
  // Dynamic mock properties to enhance UI
  const rating = (Math.random() * (5 - 4) + 4).toFixed(1);
  const students = Math.floor(Math.random() * 5000) + 100;
  const hours = Math.floor(Math.random() * 40) + 5;
  const lessons = Math.floor(Math.random() * 100) + 20;
  const level = course.level || ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)];
  const isBestSeller = Math.random() > 0.7;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all overflow-hidden flex flex-col relative cursor-pointer"
      onClick={() => navigate(`/courses/${course._id}`)}
    >
      {/* Thumbnail */}
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'} 
          alt={course.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {isBestSeller && (
            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-md">
              Best Seller
            </span>
          )}
        </div>
        
        {/* Favorite */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-rose-500 transition-all shadow-lg border border-white/40 z-20"
        >
          {isFavorite ? <HiHeart className="text-rose-500 text-xl" /> : <HiOutlineHeart className="text-xl" />}
        </button>

        {/* Floating Price */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg z-10">
          <span className="font-black text-slate-900">₹{course.price}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold text-green-700 bg-green-50 px-2 py-1 rounded-md uppercase tracking-widest border border-green-100">{course.category || 'Development'}</span>
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
            <HiStar className="text-yellow-500 text-[10px]" />
            <span className="text-[10px] font-bold text-yellow-700">{rating}</span>
          </div>
        </div>

        <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-1">By {course.mentor?.name || 'Expert Instructor'}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-y-2 mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <HiUsers className="text-slate-400" /> {students.toLocaleString()} students
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <HiClock className="text-slate-400" /> {hours} hours
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <HiBookOpen className="text-slate-400" /> {lessons} lessons
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span className={`w-2 h-2 rounded-full ${level === 'Beginner' ? 'bg-green-400' : level === 'Intermediate' ? 'bg-blue-400' : 'bg-rose-400'}`} />
            {level}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Skeleton ---
const CourseSkeleton = () => (
  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 animate-pulse flex flex-col h-[400px]">
    <div className="w-full h-40 bg-slate-200 rounded-[1.5rem] mb-4"></div>
    <div className="flex justify-between mb-3">
      <div className="w-20 h-5 bg-slate-200 rounded-md"></div>
      <div className="w-12 h-5 bg-slate-200 rounded-md"></div>
    </div>
    <div className="w-3/4 h-6 bg-slate-200 rounded-lg mb-2"></div>
    <div className="w-1/2 h-6 bg-slate-200 rounded-lg mb-4"></div>
    <div className="w-1/3 h-4 bg-slate-200 rounded-md mb-auto"></div>
    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
      <div className="w-full h-4 bg-slate-200 rounded-md"></div>
      <div className="w-full h-4 bg-slate-200 rounded-md"></div>
      <div className="w-full h-4 bg-slate-200 rounded-md"></div>
      <div className="w-full h-4 bg-slate-200 rounded-md"></div>
    </div>
  </div>
);

// --- Main Page ---
const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const [searchInput, setSearchInput] = useState(keyword);
  
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortBy, setSortBy] = useState('Popular');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  const categories = ['All', 'Development', 'Business', 'Design', 'Marketing'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const sortOptions = ['Popular', 'Newest', 'Price: Low to High', 'Price: High to Low'];

  useEffect(() => {
    setLoading(true);
    getCourses(keyword)
      .then(res => setCourses(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [keyword]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(searchInput ? { keyword: searchInput } : {});
  };

  const filteredCourses = useMemo(() => {
    let result = [...courses];
    
    if (selectedCategory !== 'All') {
       result = result.filter(c => (c.category || 'Development') === selectedCategory);
    }
    
    if (sortBy === 'Price: Low to High') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'Price: High to Low') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'Newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return result;
  }, [courses, selectedCategory, sortBy]);

  const trendingCourses = courses.slice(0, 4);

  return (
    <div className="pb-20 min-h-screen bg-green-50/40">
      
      {/* Hero Header with Illustration */}
      <div className="bg-gradient-to-br from-black via-slate-900 to-green-950/80 relative overflow-hidden mb-12 border-b border-white/10 pt-28 pb-12 sm:pt-32 sm:pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          
          <div className="w-full lg:w-1/2 text-center lg:text-left z-20">
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight break-words">
              Master New Skills with <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Premium Courses</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-300 font-medium mt-4 sm:mt-6 max-w-xl mx-auto lg:mx-0 text-sm sm:text-lg">
              Explore thousands of high-quality courses. Search topics, discover new passions, and level up your career today.
            </motion.p>

            {/* Search Bar */}
            <motion.form initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} onSubmit={handleSearch} className="w-full max-w-xl mx-auto lg:mx-0 mt-6 sm:mt-8 relative">
              <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full p-2 pl-4 sm:pl-6 border border-white/20 shadow-2xl focus-within:border-green-400 focus-within:bg-white/15 transition-all w-full">
                <HiSearch className="text-green-400 text-xl sm:text-2xl flex-shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search courses..."
                  className="bg-transparent outline-none flex-1 text-white placeholder:text-slate-400 px-3 sm:px-4 font-medium min-w-0 w-full text-sm sm:text-base"
                />
                <button type="submit" className="bg-green-500 hover:bg-green-400 text-slate-900 font-extrabold px-5 sm:px-8 py-2.5 sm:py-3 rounded-full transition-colors shadow-lg shadow-green-500/30 text-sm sm:text-base flex-shrink-0">
                  Search
                </button>
              </div>
            </motion.form>
          </div>

          {/* Illustration Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full lg:w-1/2 relative z-10 flex justify-center lg:justify-end mt-8 lg:mt-0"
          >
             <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full pointer-events-none"></div>
             <motion.img 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                src="/course-illustration.png" 
                alt="Students watching online courses" 
                className="w-full max-w-md lg:max-w-lg drop-shadow-2xl object-contain relative z-10 mix-blend-screen"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 75%)',
                  maskImage: 'radial-gradient(circle at center, black 40%, transparent 75%)'
                }}
             />
          </motion.div>
          
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trending Horizontal Scroll (Netflix style) */}
        {!loading && trendingCourses.length > 0 && !keyword && selectedCategory === 'All' && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <span className="text-rose-500">🔥</span> Trending Now
              </h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x hide-scrollbar">
              {trendingCourses.map((course, i) => (
                <div key={course._id} className="min-w-[300px] sm:min-w-[340px] snap-start">
                  <PremiumCourseCard course={course} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <span className="font-bold text-slate-700">Filters & Sorting</span>
            <button onClick={() => setShowFiltersMobile(!showFiltersMobile)} className="p-2 bg-green-50 text-green-600 rounded-xl">
              {showFiltersMobile ? <HiX /> : <HiAdjustments />}
            </button>
          </div>

          {/* Sidebar Filters */}
          <motion.div 
            className={`lg:w-1/4 flex-shrink-0 ${showFiltersMobile ? 'block' : 'hidden lg:block'}`}
            initial={false}
            animate={{ height: showFiltersMobile || window.innerWidth >= 1024 ? 'auto' : 0, opacity: showFiltersMobile || window.innerWidth >= 1024 ? 1 : 0 }}
          >
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                  <HiAdjustments className="text-green-500" /> Filters
                </h3>
                {(selectedCategory !== 'All' || selectedLevel !== 'All' || sortBy !== 'Popular') && (
                  <button 
                    onClick={() => { setSelectedCategory('All'); setSelectedLevel('All'); setSortBy('Popular'); }}
                    className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md uppercase tracking-wider hover:bg-rose-100"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Category</h4>
                <div className="flex flex-col gap-2">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedCategory === cat ? 'bg-green-600 border-green-600' : 'border-slate-300 group-hover:border-green-400'}`}>
                        {selectedCategory === cat && <HiHeart className="text-white text-xs" />}
                      </div>
                      <span className={`text-sm font-medium ${selectedCategory === cat ? 'text-green-600 font-bold' : 'text-slate-600'}`}>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="mb-6 border-t border-slate-100 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Skill Level</h4>
                <div className="flex flex-col gap-2">
                  {levels.map(lvl => (
                    <label key={lvl} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" name="level" value={lvl} 
                        checked={selectedLevel === lvl} onChange={() => setSelectedLevel(lvl)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-slate-300" 
                      />
                      <span className={`text-sm font-medium ${selectedLevel === lvl ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>{lvl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Sort By</h4>
                <div className="relative">
                  <select 
                    value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                  >
                    {sortOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900">All Courses</h2>
              <p className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                {filteredCourses.length} Results
              </p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => <CourseSkeleton key={i} />)}
              </div>
            ) : filteredCourses.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm py-20 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                  <HiSearch className="text-5xl text-slate-300" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800">No courses found</h3>
                <p className="text-slate-500 mt-2 font-medium max-w-sm">Try adjusting your filters or search term to find what you're looking for.</p>
                <button onClick={() => { setSearchInput(''); setSearchParams({}); setSelectedCategory('All'); }} className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md">
                  Clear All Filters
                </button>
              </motion.div>
            ) : (
              <>
                <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredCourses.slice(0, visibleCount).map((course) => (
                      <PremiumCourseCard key={course._id} course={course} />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {visibleCount < filteredCourses.length && (
                  <div className="mt-12 text-center">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 6)}
                      className="bg-white border-2 border-green-200 text-green-700 hover:bg-green-50 font-bold px-8 py-3 rounded-full transition-colors shadow-sm"
                    >
                      Load More Courses
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourseList;
