import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://bloom:bloom-dev-password@localhost:27017/bloom-auth';

/**
 * Connect to MongoDB database and set up connection event handlers
 * @throws Will exit process with code 1 if connection fails
 */
export const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('Connected to MongoDB successfully');

    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Close the MongoDB database connection
 */
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};