import mongoose, { UpdateWriteOpResult } from 'mongoose';
import { zodSchema } from '@zodyac/zod-mongoose';
import { UserCredentialsModelSchema } from '@/schemas/models';

const schema = zodSchema(UserCredentialsModelSchema);

schema.index({ user_id: 1 }, { unique: true });
schema.index({ locked_until: 1 });

schema.methods.isAccountLocked = function (): boolean {
  return !!(this.locked_until && this.locked_until > new Date());
};

schema.methods.incrementLoginAttempts = function (): Promise<UpdateWriteOpResult> {
  if (this.locked_until && this.locked_until < new Date()) {
    return this.updateOne({
      $unset: { locked_until: 1 },
      $set: { failed_login_attempts: 1 },
    });
  }

  const updates: any = { $inc: { failed_login_attempts: 1 } };

  if (this.failed_login_attempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = { locked_until: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }

  return this.updateOne(updates);
};

schema.methods.resetLoginAttempts = function (): Promise<UpdateWriteOpResult> {
  return this.updateOne({
    $unset: { failed_login_attempts: 1, locked_until: 1 },
  });
};

export const UserCredentials = mongoose.models.UserCredentials || mongoose.model('UserCredentials', schema);

export interface IUserCredentials extends mongoose.InferSchemaType<typeof schema>, mongoose.Document {
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<UpdateWriteOpResult>;
  resetLoginAttempts(): Promise<UpdateWriteOpResult>;
}
