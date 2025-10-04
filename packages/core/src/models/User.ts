import mongoose from 'mongoose';
import { zodSchema } from '@zodyac/zod-mongoose';
import { UserModelSchema } from '@/schemas/models';

const schema = zodSchema(UserModelSchema);

schema.index({ email: 1 }, { unique: true });
schema.index({ created_at: 1 });

schema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export const User = mongoose.models.User || mongoose.model('User', schema);
export type IUser = mongoose.InferSchemaType<typeof schema> & mongoose.Document;