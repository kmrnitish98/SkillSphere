// ──────────────────────────────────────────────────────────
// Rate Limiter Middleware (Dummy) — LearnSkill LMS
// ──────────────────────────────────────────────────────────
// Redis has been removed. Rate limiting is currently disabled.
// ──────────────────────────────────────────────────────────

export const rateLimiter = () => (req, res, next) => next();

export const apiLimiter = rateLimiter();
export const authLimiter = rateLimiter();
export const strictLimiter = rateLimiter();
export const uploadLimiter = rateLimiter();

export default {
  rateLimiter,
  apiLimiter,
  authLimiter,
  strictLimiter,
  uploadLimiter,
};
