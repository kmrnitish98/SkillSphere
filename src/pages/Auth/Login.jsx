import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginAPI, adminLogin } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FaGraduationCap, FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let data;
      try {
        const response = await loginAPI({ email, password });
        data = response.data;
      } catch (err) {
        if (err.response?.status === 401) {
          // If public login fails, silently attempt admin login
          const adminResponse = await adminLogin({ email, password });
          data = adminResponse.data;
        } else {
          throw err;
        }
      }

      loginUser(data);
      toast.success('Welcome back!');
      const role = data.role;
      navigate(role === 'admin' ? '/admin' : role === 'mentor' ? '/mentor' : '/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-green-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg icon-3d">
              <FaGraduationCap className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to continue learning</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
            <button type="submit" disabled={loading} className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            Don't have an account? <Link to="/register" className="text-green-600 font-semibold hover:text-green-700">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
