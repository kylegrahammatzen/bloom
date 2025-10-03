import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

export async function connectDatabase(mongoUri: string) {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('Connected to MongoDB successfully');
  }

  mongoose.connection.on('error', (error) => {
    logger.error({ error }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}
