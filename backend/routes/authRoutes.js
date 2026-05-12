import express from 'express';
import { loginUser, registerUser, getUserProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

// ── Redis Rate Limiting ──────────────────────────────────
import { authLimiter } from '../middlewares/rateLimiter.js';

// ── Redis Session Service (for logout) ───────────────────
import { deleteSession, blacklistToken } from '../services/sessionService.js';

const router = express.Router();

// Apply auth rate limiter to login & register (brute-force protection)
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/profile', protect, getUserProfile);

// @desc    Logout user (blacklist current token + remove session)
// @route   POST /api/v1/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    // Blacklist the current JWT so it can't be reused
    if (token) {
      await blacklistToken(token);
    }

    // Remove the active session from Redis
    await deleteSession(req.user._id.toString());

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
