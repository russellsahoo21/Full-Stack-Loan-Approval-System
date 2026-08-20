import mongoose from 'mongoose';

export let isDbConnected = false;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/loan_approval_db';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout for IP whitelist / network check
    });
    isDbConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isDbConnected = false;
    console.error(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.log('💡 Note: If using MongoDB Atlas, make sure your IP is added to Atlas Network Access (0.0.0.0/0).');
    console.log('⚡ Backend is operating with smart fallback handler for zero downtime.');
  }
};
