import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  
  try {
    const user = await User.findOne();
    user.name = 'Test Update';
    await user.save();
    console.log('User Updated');
  } catch (err) {
    console.log('ERROR:', err.message);
  } finally {
    mongoose.disconnect();
  }
}
test();
