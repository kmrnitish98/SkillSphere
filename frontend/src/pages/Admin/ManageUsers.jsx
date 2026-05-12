import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUsers, deleteUser, banUser } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users, ShieldCheck, GraduationCap, BookOpen,
  Ban, Trash2, Search, Filter, ChevronDown,
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

const RoleBadge = ({ role }) => {
  const cfg = {
    admin:   { bg: 'bg-violet-50 text-violet-700 border-violet-100', icon: <ShieldCheck size={11} />, label: 'Admin' },
    mentor:  { bg: 'bg-sky-50 text-sky-700 border-sky-100',           icon: <BookOpen size={11} />,    label: 'Mentor' },
    student: { bg: 'bg-green-50 text-green-700 border-green-100',     icon: <GraduationCap size={11} />, label: 'Student' },
  };
  const c = cfg[role] || cfg.student;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg}`}>
      {c.icon} {c.label}
    </span>
  );
};

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'ban'|'delete', user }

  const fetchUsers = () => {
    setLoading(true);
    getUsers()
      .then(res => { const d = res.data.data || []; setUsers(d); setFiltered(d); })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let d = [...users];
    if (roleFilter !== 'all') d = d.filter(u => u.role === roleFilter);
    if (search) d = d.filter(u =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(d);
  }, [search, roleFilter, users]);

  const handleAction = async () => {
    if (!confirmModal) return;
    const { type, user: u } = confirmModal;
    try {
      if (type === 'delete') {
        await deleteUser(u._id);
        toast.success('User deleted');
      } else {
        await banUser(u._id);
        toast.success('User banned');
      }
      fetchUsers();
    } catch { toast.error('Action failed'); }
    setConfirmModal(null);
  };

  const counts = {
    all: users.length,
    student: users.filter(u => u.role === 'student').length,
    mentor: users.filter(u => u.role === 'mentor').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="space-y-7 pb-10">

      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-black text-slate-900">Manage Users</h1>
        <p className="text-sm text-slate-400 mt-1">{users.length} registered users on the platform</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.all, icon: Users, bg: 'from-violet-500 to-purple-600' },
          { label: 'Students', value: counts.student, icon: GraduationCap, bg: 'from-green-500 to-emerald-600' },
          { label: 'Mentors', value: counts.mentor, icon: BookOpen, bg: 'from-sky-500 to-blue-600' },
          { label: 'Admins', value: counts.admin, icon: ShieldCheck, bg: 'from-amber-400 to-orange-500' },
        ].map(({ label, value, icon: Icon, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 bg-gradient-to-br ${bg} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">{value}</p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition"
          />
        </div>
        <div className="relative">
          <Filter size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="w-full sm:w-44 pl-8 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 appearance-none transition"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="mentor">Mentors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(0.15)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={26} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700">No users found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filtered.map((u, i) => (
                    <motion.tr
                      key={u._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 hidden sm:table-cell">{u.email}</td>
                      <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                      <td className="px-6 py-4 text-slate-400 text-xs hidden md:table-cell">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {u.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setConfirmModal({ type: 'ban', user: u })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl text-xs font-semibold transition-colors border border-amber-100"
                              title="Ban User"
                            >
                              <Ban size={12} /> Ban
                            </button>
                            <button
                              onClick={() => setConfirmModal({ type: 'delete', user: u })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-xs font-semibold transition-colors border border-red-100"
                              title="Delete User"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${confirmModal.type === 'delete' ? 'bg-red-50' : 'bg-amber-50'}`}>
                {confirmModal.type === 'delete' ? <Trash2 size={22} className="text-red-500" /> : <Ban size={22} className="text-amber-500" />}
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">
                {confirmModal.type === 'delete' ? 'Delete User' : 'Ban User'}
              </h3>
              <p className="text-sm text-slate-500 text-center mt-2">
                Are you sure you want to {confirmModal.type} <strong>{confirmModal.user.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition ${confirmModal.type === 'delete' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'}`}
                >
                  Confirm {confirmModal.type === 'delete' ? 'Delete' : 'Ban'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageUsers;
