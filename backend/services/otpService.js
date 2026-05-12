// ──────────────────────────────────────────────────────────
// OTP / Email Verification Store — LearnSkill LMS
// ──────────────────────────────────────────────────────────
// Stores OTPs and email verification tokens in Redis with
// automatic expiration. Supports:
//   • OTP generation and verification
//   • Rate limiting OTP requests per email
//   • Attempt tracking to prevent brute force
// ──────────────────────────────────────────────────────────

import { setWithExpiry, getRawValue, deleteCache, incrementCounter } from './cacheService.js';

// ── Key Prefixes ─────────────────────────────────────────
const OTP_PREFIX = 'otp:';               // otp:{email}
const OTP_ATTEMPTS_PREFIX = 'otp_att:';   // otp_att:{email}
const VERIFY_TOKEN_PREFIX = 'verify:';    // verify:{token}

// ── Configuration ────────────────────────────────────────
const OTP_TTL = 600;           // OTP valid for 10 minutes
const OTP_MAX_ATTEMPTS = 5;   // Max wrong OTP attempts before lockout
const OTP_COOLDOWN = 60;      // Minimum seconds between OTP requests

/**
 * Generate a 6-digit OTP
 * @returns {string} - 6-digit OTP string
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store an OTP for a given email
 * @param {string} email - User's email address
 * @returns {{ otp: string, success: boolean, message: string }}
 */
export const createOTP = async (email) => {
  // Check cooldown (prevent OTP spam)
  const cooldownKey = `otp_cd:${email}`;
  const existingCooldown = await getRawValue(cooldownKey);
  if (existingCooldown) {
    return {
      success: false,
      otp: null,
      message: 'Please wait before requesting a new OTP',
    };
  }

  const otp = generateOTP();

  // Store OTP with expiration
  await setWithExpiry(`${OTP_PREFIX}${email}`, otp, OTP_TTL);

  // Set cooldown to prevent rapid-fire OTP requests
  await setWithExpiry(cooldownKey, '1', OTP_COOLDOWN);

  // Reset attempt counter
  await deleteCache(`${OTP_ATTEMPTS_PREFIX}${email}`);

  return { success: true, otp, message: 'OTP generated' };
};

/**
 * Verify an OTP for a given email
 * @param {string} email - User's email address
 * @param {string} otp - OTP to verify
 * @returns {{ success: boolean, message: string }}
 */
export const verifyOTP = async (email, otp) => {
  // Check attempt limit
  const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${email}`;
  const attempts = await incrementCounter(attemptsKey, OTP_TTL);

  if (attempts > OTP_MAX_ATTEMPTS) {
    // Delete the OTP to force re-generation
    await deleteCache(`${OTP_PREFIX}${email}`);
    return { success: false, message: 'Too many attempts. Please request a new OTP.' };
  }

  const storedOTP = await getRawValue(`${OTP_PREFIX}${email}`);

  if (!storedOTP) {
    return { success: false, message: 'OTP expired or not found. Please request a new one.' };
  }

  if (storedOTP !== otp) {
    return { success: false, message: `Invalid OTP. ${OTP_MAX_ATTEMPTS - attempts} attempts remaining.` };
  }

  // OTP verified — clean up
  await deleteCache(`${OTP_PREFIX}${email}`);
  await deleteCache(attemptsKey);

  return { success: true, message: 'OTP verified successfully' };
};

/**
 * Store an email verification token (for account verification links)
 * @param {string} token - Unique verification token
 * @param {string} userId - User's MongoDB _id
 * @param {number} ttl - Expiration in seconds (default: 24 hours)
 */
export const storeVerificationToken = async (token, userId, ttl = 86400) => {
  await setWithExpiry(`${VERIFY_TOKEN_PREFIX}${token}`, userId, ttl);
};

/**
 * Validate a verification token
 * @param {string} token - Verification token
 * @returns {string|null} - userId if valid, null otherwise
 */
export const validateVerificationToken = async (token) => {
  const userId = await getRawValue(`${VERIFY_TOKEN_PREFIX}${token}`);
  if (userId) {
    // Token is one-time use — delete after validation
    await deleteCache(`${VERIFY_TOKEN_PREFIX}${token}`);
  }
  return userId;
};

export default {
  createOTP,
  verifyOTP,
  storeVerificationToken,
  validateVerificationToken,
};
