import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Payment from './models/Payment.js';

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  
  try {
    const p = new Payment({
      student: new mongoose.Types.ObjectId(),
      course: new mongoose.Types.ObjectId(),
      amountPaid: 100,
      platformFee: 20,
      mentorEarnings: 80,
      status: 'completed',
      transactionId: 'test1234',
    });
    await p.save();
    console.log('Saved');
  } catch (err) {
    console.log('ERROR:', err.message);
  } finally {
    mongoose.disconnect();
  }
}
test();
