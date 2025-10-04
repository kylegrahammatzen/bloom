import mongoose from 'mongoose';

export async function connectDatabase(mongoUri: string) {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  mongoose.connection.on('error', (error) => {
    console.error('[Bloom MongoDB Error]', error);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Bloom MongoDB] Disconnected');
  });
}
