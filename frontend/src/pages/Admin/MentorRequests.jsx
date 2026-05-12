import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  getVerificationRequests, handleVerificationDecision
} from '../../services/api';
import {
  ShieldCheck, ShieldX, Eye, Search, GraduationCap,
  Mail, Phone, Briefcase, Clock, CheckCircle2,
  XCircle, AlertTriangle, ExternalLink, User,
  FileText, Star, X, ChevronDown,
} from 'lucide-react';

/* ── helpers ── */
const fu = (d = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay: d, ease: [0.22, 1, 0.36, 1] },
});

const isNew = (date) => {
  if (!date) return false;
  return (Date.now() - new Date(date).getTime()) < 24 * 60 * 60 * 1000;
};

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
  const cfg = {
    pending:  { bg: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400',  icon: Clock,         label: 'Pending' },
    approved: { bg: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500',  icon: CheckCircle2,  label: 'Approved' },
    rejected: { bg: 'bg-red-50 text-red-600 border-red-200',         dot: 'bg-red-500',    icon: XCircle,       label: 'Rejected' },
  };
  const c = cfg[status] || cfg.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'pending' ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
};

/* ── DETAIL MODAL ── */
const DetailModal = ({ req, onClose, onApprove, onReject }) => {
  const vd = req.verificationData || {};
  const expertise = Array.isArray(vd.expertise) ? vd.expertise : vd.expertise ? [vd.expertise] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-3xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">
            <X size={15} />
          </button>
          <div className="flex items-center gap-4 relative">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl">
              {(vd.fullName || req.name)?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{vd.fullName || req.name}</h2>
              <p className="text-slate-300 text-sm flex items-center gap-1.5 mt-0.5">
                <Mail size={12} /> {req.email}
              </p>
              <div className="mt-2"><StatusBadge status={req.verificationStatus} /></div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Personal Info */}
          <Section title="Personal Information" icon={User}>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={Mail} label="Email" value={req.email} />
              <InfoRow icon={Phone} label="Phone" value={vd.phone || '—'} />
            </div>
          </Section>

          {/* Professional Info */}
          <Section title="Professional Details" icon={Briefcase}>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {expertise.length > 0 ? expertise.map((e, i) => (
                    <span key={i} className="bg-green-50 text-green-700 border border-green-100 text-xs font-semibold px-3 py-1 rounded-full">
                      {e}
                    </span>
                  )) : <span className="text-slate-400 text-sm">—</span>}
                </div>
              </div>
              <InfoRow icon={Star} label="Experience" value={vd.experience ? `${vd.experience} years` : '—'} />
              {vd.bio && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1">Bio</p>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{vd.bio}</p>
                </div>
              )}
              {vd.linkedin && (
                <a href={vd.linkedin} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  <ExternalLink size={13} /> LinkedIn Profile
                </a>
              )}
            </div>
          </Section>

          {/* Agreement */}
          <Section title="Platform Agreement" icon={FileText}>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
              <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-800 font-medium">
                Accepted <strong>80% mentor / 20% platform</strong> revenue split agreement
              </p>
            </div>
          </Section>

          {/* Applied date */}
          {vd.submittedAt && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock size={11} /> Applied {new Date(vd.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {/* Rejection reason */}
          {req.verificationStatus === 'rejected' && req.rejectionReason && (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{req.rejectionReason}</p>
            </div>
          )}

          {/* Actions — only for pending */}
          {req.verificationStatus === 'pending' && (
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition">
                Close
              </button>
              <button onClick={() => { onReject(req._id); onClose(); }}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm border border-red-100 transition">
                <XCircle size={15} /> Reject
              </button>
              <button onClick={() => { onApprove(req._id); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-shadow">
                <ShieldCheck size={15} /> Approve
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Section = ({ title, icon: Icon, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
        <Icon size={14} className="text-slate-500" />
      </div>
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Icon size={9} />{label}</p>
    <p className="text-sm font-semibold text-slate-700">{value}</p>
  </div>
);

/* ── REQUEST CARD ── */
const RequestCard = ({ req, onView, onApprove, onReject, index }) => {
  const vd = req.verificationData || {};
  const expertise = Array.isArray(vd.expertise) ? vd.expertise : vd.expertise ? [vd.expertise] : [];
  const fresh = isNew(vd.submittedAt || req.createdAt);
  const isPending = req.verificationStatus === 'pending';

  return (
    <motion.div
      {...fu(index * 0.05)}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`relative bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-shadow group
        ${isPending ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-100'}`}
    >
      {/* Pending glow top bar */}
      {isPending && <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400 w-full" />}

      {/* New badge */}
      {fresh && isPending && (
        <div className="absolute top-4 right-4 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
          NEW
        </div>
      )}

      <div className="p-5">
        {/* Avatar + name */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg
            ${isPending ? 'bg-gradient-to-br from-amber-400 to-orange-500' : req.verificationStatus === 'approved' ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}
          >
            {(vd.fullName || req.name)?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 truncate">{vd.fullName || req.name}</h3>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <Mail size={10} /> {req.email}
            </p>
          </div>
          <StatusBadge status={req.verificationStatus} />
        </div>

        {/* Expertise tags */}
        {expertise.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {expertise.slice(0, 3).map((e, i) => (
              <span key={i} className="bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                {e}
              </span>
            ))}
            {expertise.length > 3 && (
              <span className="text-[11px] text-slate-400 font-medium">+{expertise.length - 3}</span>
            )}
          </div>
        )}

        {/* Experience + date */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
          {vd.experience && (
            <span className="flex items-center gap-1"><Briefcase size={10} /> {vd.experience} yrs</span>
          )}
          {(vd.submittedAt || req.createdAt) && (
            <span className="flex items-center gap-1"><Clock size={10} />
              {new Date(vd.submittedAt || req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {/* Rejection reason pill */}
        {req.verificationStatus === 'rejected' && req.rejectionReason && (
          <div className="mb-4 p-2.5 bg-red-50 rounded-xl border border-red-100">
            <p className="text-[11px] text-red-600 font-medium line-clamp-2">{req.rejectionReason}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className={`grid gap-2 ${isPending ? 'grid-cols-3' : 'grid-cols-1'}`}>
          <button onClick={() => onView(req)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-bold transition border border-slate-200">
            <Eye size={12} /> View
          </button>
          {isPending && (
            <>
              <button onClick={() => onReject(req._id)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition border border-red-100">
                <XCircle size={12} /> Reject
              </button>
              <button onClick={() => onApprove(req._id)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 text-xs font-bold transition shadow-md shadow-green-500/25">
                <ShieldCheck size={12} /> Approve
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════ MAIN PAGE ═══════════════ */
const MentorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    getVerificationRequests()
      .then(r => setRequests(r.data?.data || []))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  /* tab counts */
  const counts = useMemo(() => ({
    all:      requests.length,
    pending:  requests.filter(r => r.verificationStatus === 'pending').length,
    approved: requests.filter(r => r.verificationStatus === 'approved').length,
    rejected: requests.filter(r => r.verificationStatus === 'rejected').length,
  }), [requests]);

  /* filtered list */
  const visible = useMemo(() => {
    let d = tab === 'all' ? requests : requests.filter(r => r.verificationStatus === tab);
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(r =>
        (r.verificationData?.fullName || r.name)?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        (Array.isArray(r.verificationData?.expertise)
          ? r.verificationData.expertise.join(' ')
          : r.verificationData?.expertise || ''
        ).toLowerCase().includes(q)
      );
    }
    return d;
  }, [requests, tab, search]);

  /* approve */
  const handleApprove = async (id) => {
    setActing(true);
    try {
      await handleVerificationDecision(id, { action: 'approve' });
      toast.success('✅ Mentor approved! Email sent.');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally { setActing(false); }
  };

  /* reject */
  const handleReject = async () => {
    setActing(true);
    try {
      await handleVerificationDecision(rejectModal.id, { action: 'reject', reason: rejectReason });
      toast.error('Application rejected. Email sent.');
      setRejectModal({ open: false, id: null });
      setRejectReason('');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally { setActing(false); }
  };

  const openReject = (id) => setRejectModal({ open: true, id });

  const TABS = [
    { key: 'all',      label: 'All',      color: 'text-slate-600' },
    { key: 'pending',  label: 'Pending',  color: 'text-amber-600' },
    { key: 'approved', label: 'Approved', color: 'text-green-600' },
    { key: 'rejected', label: 'Rejected', color: 'text-red-600' },
  ];

  return (
    <div className="space-y-7 pb-12">

      {/* Header */}
      <motion.div {...fu(0)}>
        <h1 className="text-2xl font-black text-slate-900">Mentor Verification</h1>
        <p className="text-sm text-slate-400 mt-1">Review and manage instructor verification applications</p>
      </motion.div>

      {/* Summary cards */}
      <motion.div {...fu(0.05)} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',    count: counts.all,      bg: 'from-slate-500 to-slate-600',   light: 'bg-slate-50' },
          { label: 'Pending',  count: counts.pending,  bg: 'from-amber-400 to-orange-500',  light: 'bg-amber-50' },
          { label: 'Approved', count: counts.approved, bg: 'from-green-500 to-emerald-600', light: 'bg-green-50' },
          { label: 'Rejected', count: counts.rejected, bg: 'from-red-500 to-rose-600',      light: 'bg-red-50' },
        ].map(({ label, count, bg, light }) => (
          <div key={label} className={`${light} rounded-2xl p-4 border border-white/80`}>
            <div className={`w-8 h-8 bg-gradient-to-br ${bg} rounded-xl flex items-center justify-center mb-2`}>
              <GraduationCap size={15} className="text-white" />
            </div>
            <p className="text-2xl font-black text-slate-800">{count}</p>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs + Search */}
      <motion.div {...fu(0.1)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        {/* Tab pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === key ? 'text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === key && (
                <motion.div layoutId="tabBg"
                  className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-md shadow-green-500/25"
                />
              )}
              <span className="relative">{label}</span>
              <span className={`relative text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                tab === key ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or expertise..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition"
          />
        </div>
      </motion.div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-slate-100 rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <motion.div {...fu(0.15)} className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {tab === 'pending' ? (
              <ShieldCheck size={26} className="text-green-300" />
            ) : (
              <GraduationCap size={26} className="text-slate-300" />
            )}
          </div>
          <p className="font-bold text-slate-700">
            {tab === 'pending' ? "You're all caught up! 🎉" : `No ${tab} requests`}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {tab === 'pending' ? 'No pending mentor applications right now.' : 'Nothing to show here.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visible.map((req, i) => (
              <RequestCard
                key={req._id} req={req} index={i}
                onView={setSelected}
                onApprove={handleApprove}
                onReject={openReject}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            req={selected}
            onClose={() => setSelected(null)}
            onApprove={(id) => { handleApprove(id); setSelected(null); }}
            onReject={(id) => { openReject(id); setSelected(null); }}
          />
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectModal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setRejectModal({ open: false, id: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">Reject Application</h3>
              <p className="text-sm text-slate-500 text-center mt-1 mb-4">
                Provide a reason (optional). It will be sent to the applicant via email.
              </p>
              <textarea
                rows={3} value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Insufficient experience, incomplete documentation..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none placeholder:text-slate-400"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setRejectModal({ open: false, id: null }); setRejectReason(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button onClick={handleReject} disabled={acting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-md shadow-red-500/20 transition disabled:opacity-60">
                  {acting ? 'Sending…' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorRequests;
