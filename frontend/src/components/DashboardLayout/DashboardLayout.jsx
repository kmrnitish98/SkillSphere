import { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="flex min-h-screen bg-slate-50 relative pt-16">

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-16 left-0 right-0 bg-white/80 backdrop-blur border-b border-slate-200 px-4 py-3 z-30 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600 transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold text-slate-800 text-sm capitalize">{user?.role} Dashboard</span>
      </div>

      {/* Sidebar — receives onCollapse to sync margin */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onCollapse={setCollapsed}
      />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Main Content — margin synced with sidebar collapse state */}
      <main
        className={`flex-1 p-4 sm:p-6 lg:p-8 mt-[60px] lg:mt-0 transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
        id="dashboard-main"
      >
        <div className="max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
