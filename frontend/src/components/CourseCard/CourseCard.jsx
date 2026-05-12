import { Link, useNavigate } from 'react-router-dom';
import { FaStar, FaUsers, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const CourseCard = ({ course }) => {
  const { user, enrolledCourseIds } = useAuth();
  const navigate = useNavigate();

  const isEnrolled = enrolledCourseIds?.includes(course._id) || false;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md group flex flex-col h-full border border-green-50 hover:shadow-xl transition-all duration-300">
      {/* Thumbnail */}
      <Link to={`/courses/${course._id}`} className="block relative h-44 overflow-hidden">
        <img
          src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          ₹{course.price}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <Link to={`/courses/${course._id}`}>
          <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 leading-snug hover:text-green-600 transition-colors">{course.title}</h3>
        </Link>
        <p className="text-xs text-slate-500 mb-4 flex-1">By {course.mentor?.name || 'Expert Mentor'}</p>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-5">
          <span className="flex items-center gap-1">
            <FaStar className="text-yellow-400" />
            {course.averageRating?.toFixed(1) || '0.0'}
          </span>
          <span className="flex items-center gap-1">
            <FaUsers className="text-green-400" />
            {course.studentCount || 0} students
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-100">
          {(user?.role === 'student' && isEnrolled) ? (
            <Link 
              to={`/student/player?courseId=${course._id}`}
              className="col-span-2 flex items-center justify-center gap-2 gradient-primary text-white text-sm font-semibold py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all group/btn"
            >
              Continue Learning <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link 
                to={`/courses/${course._id}`}
                className="flex items-center justify-center bg-white text-green-600 border border-green-200 hover:border-green-400 hover:bg-green-50 text-sm font-semibold py-2.5 rounded-xl transition-all"
              >
                View Details
              </Link>
              <Link 
                to={`/courses/${course._id}#enroll-now-btn`}
                className="flex items-center justify-center gradient-primary text-white text-sm font-semibold py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
                onClick={(e) => {
                  if (user?.role && user.role !== 'student') {
                     e.preventDefault();
                     navigate(`/courses/${course._id}`);
                  }
                }}
              >
                Buy Now
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
