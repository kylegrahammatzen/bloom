import mongoose from 'mongoose';

mongoose.connect(process.env.DATABASE_URL!, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 1000,
  socketTimeoutMS: 45000,
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

export { mongoose };
