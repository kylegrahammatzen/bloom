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
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    console.error(`MongoDB connection failed: ${message}`);
    throw new Error(`Database connection failed: ${message}`);
  }
}
