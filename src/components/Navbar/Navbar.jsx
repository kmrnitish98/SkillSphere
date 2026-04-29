import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { HiMenu, HiX, HiSearch } from 'react-icons/hi';
import { FaGraduationCap, FaBell } from 'react-icons/fa';
import { getNotifications, markNotificationsRead } from '../../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () => {
      getNotifications()
        .then(res => {
          setNotifications(res.data?.data || []);
          setUnreadCount(res.data?.unreadCount || 0);
        })
        .catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpenNotifs = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && unreadCount > 0) {
      await markNotificationsRead().catch(() => {});
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/courses?keyword=${searchTerm}`);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'mentor') return '/mentor';
    return '/student';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-green-400/30 transition-shadow">
              <FaGraduationCap className="text-white text-xl" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-gradient">Skill</span>
              <span className="text-slate-700">Sphere</span>
            </span>
          </Link>

          {/* Search (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center bg-white/60 rounded-xl px-4 py-2 w-96 border border-green-100 focus-within:border-green-400 transition-colors">
            <HiSearch className="text-green-500 mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses..."
              className="bg-transparent outline-none flex-1 text-sm text-slate-700 placeholder:text-slate-400"
            />
          </form>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/courses" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
              Explore
            </Link>
            {user ? (
              <>
                <Link to={getDashboardLink()} className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
                  Dashboard
                </Link>

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button onClick={handleOpenNotifs} className="relative p-2 text-slate-500 hover:text-green-600 transition-colors">
                    <FaBell className="text-lg" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800">Notifications</h4>
                        {notifications.length > 0 && (
                          <span className="text-[10px] text-slate-400">{notifications.length} total</span>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center">
                            <FaBell className="text-2xl text-slate-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div key={n._id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-green-50/40' : ''}`}>
                              <div className="flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  n.type === 'verification_approved' ? 'bg-green-500' :
                                  n.type === 'verification_rejected' ? 'bg-red-500' :
                                  'bg-amber-500'
                                }`} />
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={handleLogout} className="text-sm font-medium text-slate-600 hover:text-red-500 transition-colors">
                  Logout
                </button>
                <div className="w-9 h-9 gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name?.charAt(0).toUpperCase()
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="gradient-primary text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            {user && (
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-md overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>
            )}
            <button className="text-slate-600" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/20 px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="flex items-center bg-white/60 rounded-xl px-4 py-2 border border-green-100">
            <HiSearch className="text-green-500 mr-2" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="bg-transparent outline-none flex-1 text-sm" />
          </form>
          <Link to="/courses" className="block text-sm font-medium text-slate-600 py-2" onClick={() => setMobileOpen(false)}>Explore</Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} className="block text-sm font-medium text-slate-600 py-2" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="block text-sm font-medium text-red-500 py-2">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-sm font-medium text-slate-600 py-2" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/register" className="block text-sm font-medium text-green-600 py-2" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
