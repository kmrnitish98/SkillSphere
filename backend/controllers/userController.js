import User from '../models/User.js';
import { uploadFromBuffer } from '../utils/cloudinaryUpload.js';

// ── Redis Cache Integration ──────────────────────────────
import { getCache, setCache, deleteCache, deleteCachePattern } from '../services/cacheService.js';
import { invalidateAllSessions } from '../services/sessionService.js';

// ── Cache Key Constants ──────────────────────────────────
const CACHE_KEYS = {
  ALL_USERS: 'users:all',
  TOP_MENTORS: 'users:top-mentors',
  USER_PROFILE: (id) => `user:profile:${id}`,
};

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    // ── CACHE: Try Redis first ──────────────────────────
    const cached = await getCache(CACHE_KEYS.ALL_USERS);
    if (cached) {
      console.log(`⚡ Cache HIT: ${CACHE_KEYS.ALL_USERS}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${CACHE_KEYS.ALL_USERS}`);
    const users = await User.find({}).select('-password');
    const response = { success: true, count: users.length, data: users };

    // Cache all users for 5 minutes (admin view changes frequently)
    await setCache(CACHE_KEYS.ALL_USERS, response, 300);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get top mentors
// @route   GET /api/v1/users/top-mentors
// @access  Public
export const getTopMentors = async (req, res) => {
  try {
    // ── CACHE: Try Redis first ──────────────────────────
    // Top mentors don't change often — cache for 1 hour
    const cached = await getCache(CACHE_KEYS.TOP_MENTORS);
    if (cached) {
      console.log(`⚡ Cache HIT: ${CACHE_KEYS.TOP_MENTORS}`);
      return res.json(cached);
    }

    console.log(`🐌 Cache MISS: ${CACHE_KEYS.TOP_MENTORS}`);
    const mentors = await User.aggregate([
      { $match: { role: 'mentor' } },
      { $limit: 4 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'mentor',
          as: 'mentorCourses'
        }
      },
      {
        $addFields: {
          coursesCount: { $size: '$mentorCourses' },
          studentsCount: { $sum: '$mentorCourses.studentCount' },
          rating: { $avg: '$mentorCourses.averageRating' }
        }
      },
      {
        $unset: ['password', 'mentorCourses']
      }
    ]);

    const response = { success: true, data: mentors };

    // Cache top mentors for 1 hour
    await setCache(CACHE_KEYS.TOP_MENTORS, response, 3600);

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();

      // ── CACHE INVALIDATION ────────────────────────────
      await deleteCache(CACHE_KEYS.USER_PROFILE(req.params.id));
      await deleteCache(CACHE_KEYS.ALL_USERS);
      await deleteCache(CACHE_KEYS.TOP_MENTORS);
      // Invalidate deleted user's sessions
      await invalidateAllSessions(req.params.id);

      res.json({ success: true, message: 'User removed' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ban or Suspend user (Admin only)
// @route   PUT /api/v1/users/:id/ban
// @access  Private/Admin
export const banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // For simplicity, we can add a 'status' or 'isBanned' field on User model,
      // but without changing the model significantly, let's just assume we update the role or add a field
      user.role = 'banned'; 
      await user.save();

      // ── CACHE INVALIDATION ────────────────────────────
      await deleteCache(CACHE_KEYS.USER_PROFILE(req.params.id));
      await deleteCache(CACHE_KEYS.ALL_USERS);
      // Force-invalidate banned user's sessions (immediate lockout)
      await invalidateAllSessions(req.params.id);

      res.json({ success: true, message: 'User banned' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add/Remove mentor to favorites
// @route   POST /api/v1/users/favorites/:mentorId
// @access  Private/Student
export const toggleFavoriteMentor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const mentorId = req.params.mentorId;

    const isFavorited = user.favoriteMentors.includes(mentorId);

    if (isFavorited) {
      user.favoriteMentors = user.favoriteMentors.filter(
        (id) => id.toString() !== mentorId.toString()
      );
    } else {
      user.favoriteMentors.push(mentorId);
    }

    await user.save();

    // ── CACHE INVALIDATION ──────────────────────────────
    await deleteCache(CACHE_KEYS.USER_PROFILE(req.user._id));

    res.json({ success: true, favoriteMentors: user.favoriteMentors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Basic fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
    if (req.body.timezone) user.timezone = req.body.timezone;
    if (req.body.language) user.language = req.body.language;

    // Social links
    if (req.body.socialLinks) {
      user.socialLinks = {
        ...user.socialLinks?.toObject?.() || user.socialLinks || {},
        ...req.body.socialLinks,
      };
    }

    // Notification preferences
    if (req.body.notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences?.toObject?.() || user.notificationPreferences || {},
        ...req.body.notificationPreferences,
      };
    }

    const updatedUser = await user.save();

    // ── CACHE INVALIDATION ──────────────────────────────
    // Invalidate the user's cached profile so next fetch gets fresh data
    await deleteCache(CACHE_KEYS.USER_PROFILE(req.user._id));
    // If mentor, also invalidate top mentors cache
    if (user.role === 'mentor') {
      await deleteCache(CACHE_KEYS.TOP_MENTORS);
    }

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        socialLinks: updatedUser.socialLinks,
        timezone: updatedUser.timezone,
        language: updatedUser.language,
        notificationPreferences: updatedUser.notificationPreferences,
        createdAt: updatedUser.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/v1/users/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    // ── REDIS: Invalidate all sessions on password change ──
    // Forces re-login on all devices for security
    await invalidateAllSessions(req.user._id.toString());
    await deleteCache(CACHE_KEYS.USER_PROFILE(req.user._id));

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload user avatar
// @route   POST /api/v1/users/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await uploadFromBuffer(req.file.buffer, 'skillsphere/avatars');
    user.avatar = result.secure_url;
    await user.save();

    // ── CACHE INVALIDATION ──────────────────────────────
    await deleteCache(CACHE_KEYS.USER_PROFILE(req.user._id));

    res.json({ success: true, avatarUrl: result.secure_url, message: 'Avatar updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
