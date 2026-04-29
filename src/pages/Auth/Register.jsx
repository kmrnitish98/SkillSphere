import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FaGraduationCap, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerAPI({ name, email, password, role });
      loginUser(data);
      toast.success('Account created!');
      navigate(role === 'mentor' ? '/mentor' : '/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-green-100">
          <div className="text-center mb-8">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg icon-3d">
              <FaGraduationCap className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="text-sm text-slate-500 mt-1">Start your learning journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
              <div className="flex items-center bg-green-50/50 rounded-xl px-4 py-3 border border-green-100 focus-within:border-green-400 transition-colors">
                <FaUser className="text-green-400 mr-3 text-sm" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="bg-transparent outline-none flex-1 text-sm text-slate-700 placeholder:text-slate-400" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</label>
              <div className="flex items-center bg-green-50/50 rounded-xl px-4 py-3 border border-green-100 focus-within:border-green-400 transition-colors">
                <FaEnvelope className="text-green-400 mr-3 text-sm" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="bg-transparent outline-none flex-1 text-sm text-slate-700 placeholder:text-slate-400" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Password</label>
              <div className="flex items-center bg-green-50/50 rounded-xl px-4 py-3 border border-green-100 focus-within:border-green-400 transition-colors">
                <FaLock className="text-green-400 mr-3 text-sm" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-transparent outline-none flex-1 text-sm text-slate-700 placeholder:text-slate-400" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRole('student')} className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${role === 'student' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-green-200'}`}>
                  📚 Learn
                </button>
                <button type="button" onClick={() => setRole('mentor')} className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${role === 'mentor' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-green-200'}`}>
                  🎓 Teach
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            Already have an account? <Link to="/login" className="text-green-600 font-semibold hover:text-green-700">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
