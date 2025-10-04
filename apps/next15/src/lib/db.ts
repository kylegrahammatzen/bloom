import mongoose from 'mongoose';

await mongoose.connect(process.env.DATABASE_URL!, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 1000,
  socketTimeoutMS: 45000,
});

export { mongoose };
