import { useEffect, useState } from 'react';
import { getMentorCourses } from '../../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Loader from '../../components/Loader/Loader';
import { FaEdit, FaUsers, FaStar, FaPlusCircle, FaSearch, FaFilter, FaThLarge, FaList, FaTrash, FaRupeeSign } from 'react-icons/fa';

const MentorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    getMentorCourses()
      .then(res => setCourses(res.data.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <Loader />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and edit your courses</p>
        </div>
        <Link to="/mentor/create" className="gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2">
          <FaPlusCircle /> Add New
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <FaFilter className="text-slate-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
            >
              <option value="all">All Status</option>
              <option value="published">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FaThLarge />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FaList />
          </button>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-4xl mb-6">
            🎓
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No courses found</h3>
          <p className="text-slate-500 max-w-sm mb-6">You haven't created any courses matching your criteria yet. Start building your first course!</p>
          <Link to="/mentor/create" className="bg-green-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-600 transition-colors shadow-sm">
            Create a Course
          </Link>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredCourses.map((course, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              key={course._id} 
              className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden ${viewMode === 'list' ? 'flex flex-col sm:flex-row p-4 gap-6' : 'flex flex-col'}`}
            >
              <div className={`relative ${viewMode === 'grid' ? 'w-full aspect-video' : 'w-full sm:w-48 h-32 shrink-0'}`}>
                <img 
                  src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500'} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md ${course.status === 'published' ? 'bg-green-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>
                    {course.status === 'published' ? 'Active' : 'Draft'}
                  </span>
                </div>
              </div>
              
              <div className={`flex flex-col flex-1 ${viewMode === 'grid' ? 'p-5' : 'py-2 justify-between'}`}>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">{course.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    <span className="flex items-center gap-1.5"><FaUsers className="text-indigo-400" /> {course.studentCount || 0} Students</span>
                    <span className="flex items-center gap-1.5"><FaRupeeSign className="text-green-500" /> {course.price * (course.studentCount || 0)}</span>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between pt-4 border-t border-slate-100 ${viewMode === 'list' && 'mt-auto'}`}>
                  <div className="font-bold text-slate-900">
                    ₹{course.price}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <FaTrash />
                    </button>
                    <Link to={`/mentor/courses/${course._id}/build`} className="text-sm font-semibold text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                      <FaEdit /> Edit
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MentorCourses;
