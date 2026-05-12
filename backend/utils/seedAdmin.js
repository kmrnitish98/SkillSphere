import User from '../models/User.js';

/**
 * seedAdmin — runs once on server start.
 * 
 * • Checks if any user with role === 'admin' already exists.
 * • If not, creates one silently using ADMIN_EMAIL & ADMIN_PASSWORD
 *   from environment variables.
 * • If admin exists, does nothing.
 * • Password is auto-hashed by the User model's pre('save') hook (bcrypt, 10 salt rounds).
 */
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Guard: ensure env vars are configured
    if (!adminEmail || !adminPassword) {
      console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed.');
      return;
    }

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('✅  Default admin already exists — skipping seed.');
      return;
    }

    // Create the default admin
    await User.create({
      name: 'Nitish',
      email: adminEmail,
      password: adminPassword,   // hashed automatically by pre('save') hook
      role: 'admin',
    });

    console.log('🔐  Default admin created successfully.');
  } catch (error) {
    console.error('❌  Admin seed failed:', error.message);
  }
};

export default seedAdmin;
