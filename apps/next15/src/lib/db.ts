import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.DATABASE_URL!, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 1000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
