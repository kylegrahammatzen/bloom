import mongoose from 'mongoose';
import { mongooseSchema } from '@/utils/mongoose-schema';
import { SessionModelSchema } from '@/schemas/models';

const schema = mongooseSchema(SessionModelSchema);

schema.index({ session_id: 1 }, { unique: true });
schema.index({ user_id: 1 });
schema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

schema.pre('save', function (next) {
  if (!this.isNew) {
    this.last_accessed = new Date();
  }
  next();
});

schema.methods.isExpired = function (): boolean {
  return this.expires_at < new Date();
};

schema.methods.extendExpiration = function (days: number = 7): void {
  this.expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  this.last_accessed = new Date();
};

export const Session = mongoose.models.Session || mongoose.model('Session', schema);

export interface ISession extends mongoose.InferSchemaType<typeof schema>, mongoose.Document {
  isExpired(): boolean;
  extendExpiration(days?: number): void;
}