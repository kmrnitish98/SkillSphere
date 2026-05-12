import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── Redis Token Blacklist Integration ────────────────────
import { isTokenBlacklisted } from '../services/sessionService.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // ── REDIS: Check if token has been blacklisted ────
      // This catches tokens invalidated by logout, password
      // change, or admin ban — even before JWT natural expiry.
      // If Redis is down, isTokenBlacklisted returns false (fail-open).
      const blacklisted = await isTokenBlacklisted(token);
      if (blacklisted) {
        return res.status(401).json({ success: false, message: 'Token has been revoked. Please login again.' });
      }

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};
