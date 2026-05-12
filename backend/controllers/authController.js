import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// ── Redis Session & Cache Integration ────────────────────
import { storeSession } from '../services/sessionService.js';
import { getCache, setCache, deleteCache } from '../services/cacheService.js';

// ── Cache Key Constants ──────────────────────────────────
const CACHE_KEYS = {
  USER_PROFILE: (id) => `user:profile:${id}`,
};

// @desc    Auth user & get token
// @route   POST /api/v1/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // ⛔ Admins must use /api/admin/login — block them from public login
    if (user && user.role === 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      // ── REDIS: Store active session ───────────────────
      // This enables token tracking, forced logout, etc.
      await storeSession(user._id.toString(), token);

      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerifiedMentor: user.isVerifiedMentor || false,
        verificationStatus: user.verificationStatus || 'none',
        token,
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ⛔ Block admin creation via public signup
    if (role === 'admin') {
      return res.status(403).json({ success: false, message: 'Registration not allowed for this role' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Only allow 'student' or 'mentor' from public registration
    const allowedRoles = ['student', 'mentor'];
    const safeRole = allowedRoles.includes(role) ? role : 'student';

    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
    });

    if (user) {
      const token = generateToken(user._id);

      // ── REDIS: Store session for newly registered user ──
      await storeSession(user._id.toString(), token);

      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/me
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const cacheKey = CACHE_KEYS.USER_PROFILE(req.user._id);

    // ── CACHE: Try Redis first ──────────────────────────
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${cacheKey}`);
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      const response = {
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          bio: user.bio || '',
          phone: user.phone || '',
          avatar: user.avatar || '',
          socialLinks: user.socialLinks || {},
          timezone: user.timezone || 'Asia/Kolkata',
          language: user.language || 'en',
          notificationPreferences: user.notificationPreferences || {},
          createdAt: user.createdAt,
        }
      };

      // Cache profile for 15 minutes
      await setCache(cacheKey, response, 900);

      res.json(response);
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
