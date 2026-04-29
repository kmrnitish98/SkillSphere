import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaStar, FaTrash, FaUserTie, FaChevronRight } from 'react-icons/fa';

const FavoritesPage = () => {
  const { user } = useAuth();
  const favorites = user?.favoriteMentors || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Favorite Mentors</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Keep track of your preferred instructors</p>
      </div>

      {favorites.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-50 to-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-pink-100">
            <FaHeart className="text-5xl text-pink-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">No favorites yet</h3>
          <p className="text-slate-500 mt-2 font-medium max-w-sm">Browse the catalog and add mentors to your favorites to easily access their courses.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {favorites.map((mentorId, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * i }}
                whileHover={{ y: -8 }}
                className="group relative bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all overflow-hidden flex flex-col"
              >
                {/* Header Action */}
                <div className="absolute top-4 right-4 z-20">
                   <button className="w-8 h-8 bg-pink-50 hover:bg-pink-100 text-pink-500 rounded-full flex items-center justify-center transition-colors">
                     <FaTrash className="text-xs" />
                   </button>
                </div>

                <div className="flex flex-col items-center text-center relative z-10 pt-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-indigo-500/30 mb-4 ring-4 ring-white relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
                    <FaUserTie className="opacity-50 absolute -bottom-2 -right-2 text-6xl" />
                    <span className="relative z-10">M</span>
                  </div>
                  
                  <h3 className="font-extrabold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">Expert Mentor</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Senior Developer</p>
                  
                  <div className="flex items-center justify-center gap-1.5 mt-3 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                    <FaStar className="text-yellow-500 text-xs" />
                    <span className="text-xs font-bold text-yellow-700">4.9 Instructor Rating</span>
                  </div>
                </div>

                <div className="mt-8 relative z-10">
                  <button className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-md">
                    View Profile <FaChevronRight className="text-[10px]" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
