import mongoose from 'mongoose';
import { createLogger } from '@bloom/core';

const logger = createLogger();

export async function connectDatabase(mongoUri: string) {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB error', { error });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}
