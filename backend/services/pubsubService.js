// ──────────────────────────────────────────────────────────
// Local Pub/Sub Service — LearnSkill LMS
// ──────────────────────────────────────────────────────────
// Redis has been removed. Using local EventEmitter instead.
// ──────────────────────────────────────────────────────────

import { EventEmitter } from 'events';

const localPubSub = new EventEmitter();

export const initPubSub = async () => {
  console.log('✅ Local Pub/Sub initialized');
};

export const CHANNELS = {
  NOTIFICATION: 'notifications',         
  COURSE_UPDATE: 'course:updates',       
  ENROLLMENT: 'enrollment:new',          
  VERIFICATION: 'verification:update',   
  SYSTEM_ALERT: 'system:alerts',         
};

export const publish = async (channel, data) => {
  try {
    localPubSub.emit(channel, data);
  } catch (error) {
    console.error(`❌ Local Pub/Sub PUBLISH error [${channel}]:`, error.message);
  }
};

export const subscribe = async (channel, callback) => {
  try {
    localPubSub.on(channel, callback);
    console.log(`📡 Subscribed locally to channel: ${channel}`);
  } catch (error) {
    console.error(`❌ Local Pub/Sub SUBSCRIBE error [${channel}]:`, error.message);
  }
};

export const disconnectPubSub = async () => {
  localPubSub.removeAllListeners();
  console.log('🔴 Local Pub/Sub: Disconnected');
};

export default {
  initPubSub,
  publish,
  subscribe,
  disconnectPubSub,
  CHANNELS,
};
