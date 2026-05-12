import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  
  try {
    const u = new User({
      name: 'Test', email: 'test'+Date.now()+'@example.com', password: 'abc'
    });
    await u.save();
    console.log('User Saved');
  } catch (err) {
    console.log('ERROR:', err.message);
  } finally {
    mongoose.disconnect();
  }
}
test();
