import mongoose, { Document, Schema, UpdateWriteOpResult } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  salt: string;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean;
  last_login?: Date;
  failed_login_attempts: number;
  locked_until?: Date;

  // Instance methods
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<UpdateWriteOpResult>;
  resetLoginAttempts(): Promise<UpdateWriteOpResult>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 255,
  },
  password_hash: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  last_login: {
    type: Date,
  },
  failed_login_attempts: {
    type: Number,
    default: 0,
  },
  locked_until: {
    type: Date,
  },
});

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ created_at: 1 });
UserSchema.index({ locked_until: 1 });

// Update the updated_at field before saving
UserSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

// Instance methods
UserSchema.methods.isAccountLocked = function (): boolean {
  return !!(this.locked_until && this.locked_until > new Date());
};

UserSchema.methods.incrementLoginAttempts = function (): Promise<UpdateWriteOpResult> {
  // If we have a previous lock that has expired, restart at 1
  if (this.locked_until && this.locked_until < new Date()) {
    return this.updateOne({
      $unset: { locked_until: 1 },
      $set: { failed_login_attempts: 1 },
    });
  }

  const updates: any = { $inc: { failed_login_attempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.failed_login_attempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = { locked_until: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }

  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function (): Promise<UpdateWriteOpResult> {
  return this.updateOne({
    $unset: { failed_login_attempts: 1, locked_until: 1 },
  });
};

export const User = mongoose.model<IUser>('User', UserSchema);