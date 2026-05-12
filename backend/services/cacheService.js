// ──────────────────────────────────────────────────────────
// Cache Service (Dummy) — LearnSkill LMS
// ──────────────────────────────────────────────────────────
// Redis has been removed. All caching is disabled.
// ──────────────────────────────────────────────────────────

export const getCache = async (key) => null;
export const setCache = async (key, data, ttl) => {};
export const deleteCache = async (key) => {};
export const deleteCachePattern = async (pattern) => {};
export const incrementCounter = async (key, ttl) => 1;
export const setWithExpiry = async (key, value, ttl) => {};
export const getRawValue = async (key) => null;
export const getTTL = async (key) => -2;
export const existsInCache = async (key) => false;

export default {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  incrementCounter,
  setWithExpiry,
  getRawValue,
  getTTL,
  existsInCache,
};
