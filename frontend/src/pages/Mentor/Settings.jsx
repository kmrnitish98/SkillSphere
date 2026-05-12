import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, changePassword, uploadAvatar } from '../../services/api';
import { FaUser, FaLock, FaBell, FaMoon, FaCamera, FaLinkedin, FaTwitter, FaGithub, FaGlobe, FaCheck, FaSpinner, FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

/* ─── Reusable Toggle ─── */
const Toggle = ({ checked, onChange, accent = 'green' }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className={`w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${accent}-500`}></div>
  </label>
);

/* ─── Reusable Input ─── */
const Input = ({ label, type = 'text', value, onChange, placeholder, icon: Icon, disabled, suffix }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-${suffix ? '10' : '4'} py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm disabled:bg-slate-50 disabled:text-slate-400 transition-all`}
      />
      {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
  </div>
);

/* ─── Notification Row ─── */
const NotifRow = ({ title, desc, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
    <div>
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

/* ─── Fade Wrapper ─── */
const TabPanel = ({ children }) => (
  <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
    {children}
  </motion.div>
);

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '', bio: '', phone: '', avatar: '' });
  const [socialLinks, setSocialLinks] = useState({ linkedin: '', twitter: '', github: '', website: '' });

  // Security state
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // Preferences
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [language, setLanguage] = useState('en');

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: true, pushNotifications: true,
    courseUpdates: true, promotionalEmails: false, mentorMessages: true,
  });

  /* ─── Fetch profile on mount ─── */
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getProfile();
      const d = data.data || data;
      setProfile({ name: d.name || '', email: d.email || '', bio: d.bio || '', phone: d.phone || '', avatar: d.avatar || '' });
      setSocialLinks({ linkedin: d.socialLinks?.linkedin || '', twitter: d.socialLinks?.twitter || '', github: d.socialLinks?.github || '', website: d.socialLinks?.website || '' });
      setTimezone(d.timezone || 'Asia/Kolkata');
      setLanguage(d.language || 'en');
      if (d.notificationPreferences) setNotifPrefs(prev => ({ ...prev, ...d.notificationPreferences }));
    } catch {
      // fallback to local user
      setProfile({ name: user?.name || '', email: user?.email || '', bio: '', phone: '', avatar: '' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  /* ─── Save Profile ─── */
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await updateProfile({ ...profile, socialLinks });
      if (data.success) {
        toast.success('Profile updated!');
        updateUser({ name: data.data.name, email: data.data.email });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  /* ─── Upload Avatar ─── */
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image size must be less than 5MB');
    }

    setSaving(true);
    const toastId = toast.loading('Uploading profile picture...');
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const { data } = await uploadAvatar(formData);
      if (data.success) {
        toast.success('Profile picture updated!', { id: toastId });
        setProfile(p => ({ ...p, avatar: data.avatarUrl }));
        updateUser({ ...user, avatar: data.avatarUrl });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  /* ─── Change Password ─── */
  const handleChangePassword = async () => {
    if (!passwords.current) return toast.error('Enter current password');
    if (passwords.new.length < 6) return toast.error('Min 6 characters');
    if (passwords.new !== passwords.confirm) return toast.error('Passwords don\'t match');
    setSaving(true);
    try {
      const { data } = await changePassword({ currentPassword: passwords.current, newPassword: passwords.new });
      if (data.success) {
        toast.success('Password changed!');
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  /* ─── Save Preferences ─── */
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const { data } = await updateProfile({ timezone, language });
      if (data.success) toast.success('Preferences saved!');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  /* ─── Save Notifications ─── */
  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const { data } = await updateProfile({ notificationPreferences: notifPrefs });
      if (data.success) toast.success('Notification settings saved!');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FaUser /> },
    { id: 'security', label: 'Security', icon: <FaLock /> },
    { id: 'preferences', label: 'Preferences', icon: <FaMoon /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
  ];

  const SaveBtn = ({ onClick, text = 'Save Changes' }) => (
    <button onClick={onClick} disabled={saving}
      className="inline-flex items-center gap-2 bg-green-500 disabled:bg-green-300 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-all shadow-sm hover:shadow-md">
      {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaCheck className="text-xs" /> {text}</>}
    </button>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <FaSpinner className="animate-spin text-3xl text-green-500" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[540px]">
        {/* Sidebar */}
        <div className="w-full md:w-60 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-4">
          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-green-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/50'
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          {/* Account info */}
          <div className="hidden md:block mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm uppercase">
                {profile.name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{profile.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8">
          <AnimatePresence mode="wait">
            {/* ─── PROFILE TAB ─── */}
            {activeTab === 'profile' && (
              <TabPanel key="profile">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Profile Information</h2>

                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-white uppercase overflow-hidden">
                      {profile.avatar ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" /> : profile.name?.charAt(0)}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs hover:bg-green-600 transition-colors shadow cursor-pointer">
                      <FaCamera />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={saving} />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{profile.name || 'Your Name'}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">JPG, GIF or PNG. Max 800K</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <Input label="Full Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
                  <Input label="Email Address" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="john@email.com" />
                  <Input label="Phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Bio</label>
                    <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Tell us about yourself..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm resize-none" />
                  </div>
                </div>

                {/* Social Links */}
                <h3 className="text-sm font-bold text-slate-700 pt-2">Social Links</h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <Input icon={FaLinkedin} value={socialLinks.linkedin} onChange={e => setSocialLinks(s => ({ ...s, linkedin: e.target.value }))} placeholder="linkedin.com/in/username" />
                  <Input icon={FaTwitter} value={socialLinks.twitter} onChange={e => setSocialLinks(s => ({ ...s, twitter: e.target.value }))} placeholder="twitter.com/username" />
                  <Input icon={FaGithub} value={socialLinks.github} onChange={e => setSocialLinks(s => ({ ...s, github: e.target.value }))} placeholder="github.com/username" />
                  <Input icon={FaGlobe} value={socialLinks.website} onChange={e => setSocialLinks(s => ({ ...s, website: e.target.value }))} placeholder="yourwebsite.com" />
                </div>

                <div className="pt-2"><SaveBtn onClick={handleSaveProfile} /></div>
              </TabPanel>
            )}

            {/* ─── SECURITY TAB ─── */}
            {activeTab === 'security' && (
              <TabPanel key="security">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2"><FaShieldAlt className="text-green-500" /> Security</h2>

                <div className="space-y-5 max-w-md">
                  <Input label="Current Password" type={showPw.current ? 'text' : 'password'} value={passwords.current}
                    onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="Enter current password"
                    suffix={<button type="button" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))} className="text-slate-400 hover:text-slate-600">
                      {showPw.current ? <FaEyeSlash /> : <FaEye />}
                    </button>} />
                  <Input label="New Password" type={showPw.new ? 'text' : 'password'} value={passwords.new}
                    onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} placeholder="Min 6 characters"
                    suffix={<button type="button" onClick={() => setShowPw(s => ({ ...s, new: !s.new }))} className="text-slate-400 hover:text-slate-600">
                      {showPw.new ? <FaEyeSlash /> : <FaEye />}
                    </button>} />
                  <Input label="Confirm Password" type={showPw.confirm ? 'text' : 'password'} value={passwords.confirm}
                    onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter new password"
                    suffix={<button type="button" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} className="text-slate-400 hover:text-slate-600">
                      {showPw.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>} />

                  {passwords.new && (
                    <div className="text-xs space-y-1">
                      <p className={passwords.new.length >= 6 ? 'text-green-600' : 'text-red-500'}>
                        {passwords.new.length >= 6 ? '✓' : '✗'} At least 6 characters
                      </p>
                      <p className={passwords.new === passwords.confirm && passwords.confirm ? 'text-green-600' : 'text-red-500'}>
                        {passwords.new === passwords.confirm && passwords.confirm ? '✓' : '✗'} Passwords match
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2"><SaveBtn onClick={handleChangePassword} text="Update Password" /></div>
              </TabPanel>
            )}

            {/* ─── PREFERENCES TAB ─── */}
            {activeTab === 'preferences' && (
              <TabPanel key="preferences">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Preferences</h2>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Dark Mode</h3>
                    <p className="text-xs text-slate-500">Toggle dark theme for the dashboard</p>
                  </div>
                  <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Timezone</label>
                    <select value={timezone} onChange={e => setTimezone(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm bg-white">
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm bg-white">
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2"><SaveBtn onClick={handleSavePreferences} /></div>
              </TabPanel>
            )}

            {/* ─── NOTIFICATIONS TAB ─── */}
            {activeTab === 'notifications' && (
              <TabPanel key="notifications">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Notification Settings</h2>

                <div className="space-y-3">
                  <NotifRow title="Email Notifications" desc="Receive daily summaries and alerts via email"
                    checked={notifPrefs.emailNotifications} onChange={() => setNotifPrefs(p => ({ ...p, emailNotifications: !p.emailNotifications }))} />
                  <NotifRow title="Push Notifications" desc="Get instant alerts in the browser"
                    checked={notifPrefs.pushNotifications} onChange={() => setNotifPrefs(p => ({ ...p, pushNotifications: !p.pushNotifications }))} />
                  <NotifRow title="Course Updates" desc="New lessons, quizzes, and assignments"
                    checked={notifPrefs.courseUpdates} onChange={() => setNotifPrefs(p => ({ ...p, courseUpdates: !p.courseUpdates }))} />
                  <NotifRow title="Mentor Messages" desc="Direct messages from students or mentors"
                    checked={notifPrefs.mentorMessages} onChange={() => setNotifPrefs(p => ({ ...p, mentorMessages: !p.mentorMessages }))} />
                  <NotifRow title="Promotional Emails" desc="Offers, discounts, and platform news"
                    checked={notifPrefs.promotionalEmails} onChange={() => setNotifPrefs(p => ({ ...p, promotionalEmails: !p.promotionalEmails }))} />
                </div>

                <div className="pt-2"><SaveBtn onClick={handleSaveNotifications} /></div>
              </TabPanel>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
