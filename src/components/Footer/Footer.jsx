import { FaGraduationCap, FaHeart, FaGithub, FaTwitter, FaLinkedinIn, FaYoutube, FaInstagram, FaArrowRight, FaPaperPlane } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const Footer = () => {
  const [email, setEmail] = useState('');

  return (
    <footer className="relative bg-slate-950 text-white overflow-hidden">
      {/* ── Background Glow Effects ── */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* ── Newsletter Strip ── */}
      <div className="relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-black text-white">Stay Ahead of the Curve</h3>
              <p className="text-slate-400 mt-1.5 text-sm">Get weekly insights, new courses, and exclusive offers delivered to your inbox.</p>
            </div>
            <div className="flex items-center w-full lg:w-auto max-w-md">
              <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus-within:border-green-500/50 transition-colors">
                <FaPaperPlane className="text-green-400 mr-3 text-sm" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-transparent outline-none flex-1 text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <button className="ml-3 gradient-primary text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg hover:shadow-green-500/20 transition-all flex-shrink-0 flex items-center gap-2">
                Subscribe <FaArrowRight className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer Content ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <FaGraduationCap className="text-white text-xl" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight">Skill<span className="text-green-400">Sphere</span></span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Empowering learners worldwide with premium courses from industry-leading mentors. Learn, grow, and build the career you deserve.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: <FaTwitter />, href: '#', hoverBg: 'hover:bg-sky-500' },
                { icon: <FaLinkedinIn />, href: '#', hoverBg: 'hover:bg-blue-600' },
                { icon: <FaYoutube />, href: '#', hoverBg: 'hover:bg-red-500' },
                { icon: <FaInstagram />, href: '#', hoverBg: 'hover:bg-pink-500' },
                { icon: <FaGithub />, href: '#', hoverBg: 'hover:bg-slate-600' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className={`w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white ${social.hoverBg} border border-white/5 hover:border-transparent transition-all duration-300 hover:scale-110 hover:shadow-lg`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-sm uppercase tracking-widest text-green-400 mb-5">Platform</h4>
            <ul className="space-y-3">
              {[
                { label: 'Browse Courses', to: '/courses' },
                { label: 'Become a Mentor', to: '/register' },
                { label: 'Pricing Plans', to: '/' },
                { label: 'Certifications', to: '/' },
                { label: 'For Enterprise', to: '/' },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.to} className="text-sm text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-sm uppercase tracking-widest text-green-400 mb-5">Resources</h4>
            <ul className="space-y-3">
              {['Help Center', 'Blog & Articles', 'Community Forum', 'Career Guides', 'Free Tutorials'].map((label, i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-sm uppercase tracking-widest text-green-400 mb-5">Company</h4>
            <ul className="space-y-3">
              {['About Us', 'Careers', 'Press & Media', 'Contact Us', 'Partner Program'].map((label, i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-sm uppercase tracking-widest text-green-400 mb-5">Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy', 'Sitemap'].map((label, i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Stats Ribbon ── */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {[
            { value: '10K+', label: 'Students' },
            { value: '500+', label: 'Courses' },
            { value: '120+', label: 'Mentors' },
            { value: '50+', label: 'Countries' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-950 px-6 py-5 text-center">
              <p className="text-xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} SkillSphere. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
              <span className="flex items-center gap-1.5">
                Made with <FaHeart className="text-red-400 text-[10px] animate-pulse" /> in India
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
