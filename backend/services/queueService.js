// ──────────────────────────────────────────────────────────
// Queue Service (Direct) — LearnSkill LMS
// ──────────────────────────────────────────────────────────
// Redis and BullMQ have been removed. Jobs run directly.
// ──────────────────────────────────────────────────────────

import { sendVerificationEmail } from '../utils/sendEmail.js';
import Notification from '../models/Notification.js';

export const addEmailJob = async (emailData) => {
  try {
    console.log(`📧 Sending email directly: ${emailData.type} → ${emailData.to}`);
    await sendVerificationEmail({ to: emailData.to, subject: emailData.subject, html: emailData.html });
    console.log(`✅ Email sent: ${emailData.to}`);
  } catch (e) {
    console.error('❌ Direct email send failed:', e.message);
  }
};

export const addNotificationJob = async (notifData) => {
  try {
    const { userId, type, title, message } = notifData;
    console.log(`🔔 Creating notification directly: ${type} for user ${userId}`);
    await Notification.create({ user: userId, type, title, message });
    console.log(`✅ Notification created`);
  } catch (error) {
    console.warn('⚠️ Notification creation failed:', error.message);
  }
};

export const addBackgroundJob = async (task, payload = {}, options = {}) => {
  console.log(`⚙️ Processing background task directly: ${task}`);
  switch (task) {
    case 'cleanup_expired_otps':
      console.log('🧹 Cleaning up expired OTPs...');
      break;
    case 'generate_report':
      console.log('📊 Generating report:', payload);
      break;
    case 'sync_course_stats':
      console.log('📈 Syncing course statistics...');
      break;
    default:
      console.log(`❓ Unknown background task: ${task}`);
  }
};

export const getQueueStats = async () => {
  return null;
};

export default {
  addEmailJob,
  addNotificationJob,
  addBackgroundJob,
  getQueueStats,
};
