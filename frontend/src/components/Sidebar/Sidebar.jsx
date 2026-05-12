import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, TrendingUp,
  PlusCircle, BarChart2, MessageSquare, Settings, FileText,
  Heart, Award, LogOut, ChevronLeft, Zap,
  ShieldCheck, CreditCard, ClipboardCheck
} from 'lucide-react';
import { HiX } from 'react-icons/hi';

const Sidebar = ({ isOpen, setIsOpen, onCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const studentLinks = [
    { to: '/student',              label: 'Dashboard',    icon: LayoutDashboard, end: true },
    { to: '/student/courses',      label: 'My Courses',   icon: BookOpen },
    { to: '/student/progress',     label: 'Progress',     icon: ClipboardCheck },
    { to: '/student/certificates', label: 'Certificates', icon: Award },
    { to: '/student/favorites',    label: 'Favorites',    icon: Heart },
    { to: '/student/invoices',     label: 'Invoices',     icon: FileText },
    { to: '/student/messages',     label: 'Messages',     icon: MessageSquare },
  ];

  const mentorLinks = [
    { to: '/mentor',              label: 'Dashboard',     icon: LayoutDashboard, end: true },
    { to: '/mentor/courses',      label: 'My Courses',    icon: BookOpen },
    { to: '/mentor/create',       label: 'Create Course', icon: PlusCircle },
    { to: '/mentor/students',     label: 'Students',      icon: Users },
    { to: '/mentor/earnings',     label: 'Earnings',      icon: CreditCard },
    { to: '/mentor/analytics',    label: 'Analytics',     icon: BarChart2 },
    { to: '/mentor/messages',     label: 'Messages',      icon: MessageSquare },
    { to: '/mentor/settings',     label: 'Settings',      icon: Settings },
  ];

  const adminLinks = [
    { to: '/admin',               label: 'Dashboard',      icon: LayoutDashboard, end: true },
    { to: '/admin/users',         label: 'Manage Users',   icon: Users },
    { to: '/admin/courses',       label: 'Manage Courses', icon: BookOpen },
    { to: '/admin/mentor-requests', label: 'Mentor Requests', icon: ShieldCheck },
    { to: '/admin/revenue',       label: 'Revenue',        icon: TrendingUp },
    { to: '/admin/settings',      label: 'Settings',       icon: Settings },
  ];

  const links = user?.role === 'admin' ? adminLinks
              : user?.role === 'mentor' ? mentorLinks
              : studentLinks;

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    setIsOpen && setIsOpen(false);
    navigate('/login');
  };

  const sidebarWidth = collapsed ? 'lg:w-20' : 'lg:w-64';

  return (
    <>
      <aside
        className={`
          fixed h-[calc(100vh-64px)] top-16 left-0 bg-white border-r border-slate-100 z-50
          flex flex-col overflow-hidden transition-all duration-300 ease-in-out shadow-xl lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          w-64 ${sidebarWidth}
        `}
      >
        {/* Mobile close */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between lg:hidden">
          <div className="font-bold text-slate-800">Menu</div>
          <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:text-red-500 hover:bg-red-50">
            <HiX size={20} />
          </button>
        </div>

        {/* Brand / User Info */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`rounded-full flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base'} ${isAdmin ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-green-400 to-emerald-500'} overflow-hidden`}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            {isAdmin && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                <Zap size={8} className="text-white" />
              </div>
            )}
          </div>

          {/* Name */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="font-bold text-sm text-slate-900 truncate">{user?.name}</p>
                <p className={`text-xs font-semibold capitalize mt-0.5 ${isAdmin ? 'text-violet-500' : 'text-green-500'}`}>
                  {user?.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setIsOpen && setIsOpen(false)}
              className={({ isActive }) => `
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${collapsed ? 'justify-center px-0' : ''}
                ${isActive
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/20'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }
              `}
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  {/* Active glow bar */}
                  {isActive && !collapsed && (
                    <motion.div layoutId="activeBar" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/50 rounded-r-full" />
                  )}
                  <Icon size={18} className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                        className="truncate overflow-hidden"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-xl pointer-events-none">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Toggle (desktop only) */}
        <div className="hidden lg:flex justify-end p-3 border-t border-slate-100">
          <button
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              onCollapse && onCollapse(next);
            }}
            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronLeft size={16} />
            </motion.div>
          </button>
        </div>

        {/* Logout */}
        <div className={`p-3 border-t border-slate-100 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all w-full rounded-xl p-2.5 group ${collapsed ? 'justify-center w-auto' : ''}`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={17} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>

    </>
  );
};

export default Sidebar;
