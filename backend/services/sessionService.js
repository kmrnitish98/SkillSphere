// ──────────────────────────────────────────────────────────
// Session / Token Store (Dummy) — LearnSkill LMS
// ──────────────────────────────────────────────────────────
// Redis has been removed. Session management disabled.
// ──────────────────────────────────────────────────────────

export const storeSession = async (userId, token, ttlSeconds) => {};
export const getSession = async (userId) => null;
export const deleteSession = async (userId) => {};
export const blacklistToken = async (token, ttlSeconds) => {};
export const isTokenBlacklisted = async (token) => false;
export const invalidateAllSessions = async (userId) => {};

export default {
  storeSession,
  getSession,
  deleteSession,
  blacklistToken,
  isTokenBlacklisted,
  invalidateAllSessions,
};
