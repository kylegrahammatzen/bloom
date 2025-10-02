import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  image?: string;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean;
  last_login?: Date;
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
  name: {
    type: String,
    trim: true,
    maxlength: 255,
  },
  image: {
    type: String,
    maxlength: 2048,
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
});

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ created_at: 1 });

UserSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);