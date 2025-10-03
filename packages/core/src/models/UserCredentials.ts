import mongoose, { Document, Schema, UpdateWriteOpResult } from 'mongoose';

export interface IUserCredentials extends Document {
  user_id: mongoose.Types.ObjectId;
  password_hash: string;
  salt: string;
  failed_login_attempts: number;
  locked_until?: Date;

  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<UpdateWriteOpResult>;
  resetLoginAttempts(): Promise<UpdateWriteOpResult>;
}

const UserCredentialsSchema = new Schema<IUserCredentials>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  failed_login_attempts: {
    type: Number,
    default: 0,
  },
  locked_until: {
    type: Date,
  },
});

UserCredentialsSchema.index({ user_id: 1 }, { unique: true });
UserCredentialsSchema.index({ locked_until: 1 });

UserCredentialsSchema.methods.isAccountLocked = function (): boolean {
  return !!(this.locked_until && this.locked_until > new Date());
};

UserCredentialsSchema.methods.incrementLoginAttempts = function (): Promise<UpdateWriteOpResult> {
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

UserCredentialsSchema.methods.resetLoginAttempts = function (): Promise<UpdateWriteOpResult> {
  return this.updateOne({
    $unset: { failed_login_attempts: 1, locked_until: 1 },
  });
};

export const UserCredentials = mongoose.models.UserCredentials || mongoose.model<IUserCredentials>('UserCredentials', UserCredentialsSchema);
