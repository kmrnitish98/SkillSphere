import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, getCourseReviews } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader/Loader';
import StripeCheckoutModal from '../../components/StripeCheckout/StripeCheckoutModal';
import toast from 'react-hot-toast';
import { FaStar, FaUsers, FaPlay, FaCheckCircle, FaShoppingCart, FaLock } from 'react-icons/fa';

const CourseDetail = () => {
  const { id }       = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [course,     setCourse]     = useState(null);
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  // Stripe PaymentIntent data (populated after modal creates intent)
  const [intentData, setIntentData] = useState(null);

  useEffect(() => {
    Promise.all([getCourseById(id), getCourseReviews(id)])
      .then(([courseRes, reviewsRes]) => {
        setCourse(courseRes.data.data);
        setReviews(reviewsRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnrollClick = () => {
    if (!user) return navigate('/login');
    if (user.role !== 'student') {
      toast.error('Only students can purchase courses');
      return;
    }
    setShowModal(true);
  };

  if (loading) return <Loader />;
  if (!course) return <div className="pt-24 text-center text-slate-500">Course not found</div>;

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Banner */}
      <div className="gradient-hero border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <FaCheckCircle /> Published
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">{course.title}</h1>
              <p className="text-slate-600 leading-relaxed">{course.description}</p>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 pt-2">
                <span className="flex items-center gap-1.5"><FaStar className="text-yellow-400" /> {course.averageRating?.toFixed(1) || '0.0'} ({reviews.length} reviews)</span>
                <span className="flex items-center gap-1.5"><FaUsers className="text-green-400" /> {course.studentCount || 0} students</span>
                <span>By <strong className="text-green-700">{course.mentor?.name || 'Expert'}</strong></span>
              </div>
            </div>

            {/* Purchase Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-green-100">
              <div className="relative rounded-xl overflow-hidden mb-5 h-44">
                <img
                  src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <FaPlay className="text-green-600 text-lg ml-1" />
                  </div>
                </div>
              </div>

              <div className="text-3xl font-bold text-slate-900 mb-1">₹{course.price}</div>
              <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                <FaLock className="text-green-400" /> Secure payment via Stripe
              </p>

              {user?.role === 'student' ? (
                <button
                  id="enroll-now-btn"
                  onClick={handleEnrollClick}
                  className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <FaShoppingCart /> Enroll Now
                </button>
              ) : !user ? (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-md"
                >
                  Login to Enroll
                </button>
              ) : null}

              <div className="mt-4 space-y-2 text-sm text-slate-500">
                <p className="flex items-center gap-2"><FaCheckCircle className="text-green-400" /> Lifetime access</p>
                <p className="flex items-center gap-2"><FaCheckCircle className="text-green-400" /> Certificate of completion</p>
                <p className="flex items-center gap-2"><FaCheckCircle className="text-green-400" /> Quizzes &amp; assignments</p>
                <p className="flex items-center gap-2"><FaCheckCircle className="text-green-400" /> Invoice emailed after purchase</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Student Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-slate-500">No reviews yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((r, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-green-50 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                    {r.student?.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{r.student?.name || 'Student'}</p>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <FaStar key={j} className={`text-xs ${j < r.rating ? 'text-yellow-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{r.feedback}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stripe Checkout Modal */}
      {showModal && (
        <StripeCheckoutModal
          courseId={id}
          course={{
            title:      course.title,
            price:      course.price,
            thumbnail:  course.thumbnailUrl,
            mentorName: course.mentor?.name,
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default CourseDetail;
