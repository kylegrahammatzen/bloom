import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  session_id: string;
  user_id: mongoose.Types.ObjectId;
  expires_at: Date;
  user_agent?: string;
  ip_address?: string;
  created_at: Date;
  last_accessed: Date;

  // Instance methods
  isExpired(): boolean;
  extendExpiration(days?: number): void;
}

const SessionSchema = new Schema<ISession>({
  session_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL index for automatic cleanup
  },
  user_agent: {
    type: String,
    maxlength: 500,
  },
  ip_address: {
    type: String,
    maxlength: 45, // IPv6 addresses can be up to 45 characters
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  last_accessed: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
SessionSchema.index({ session_id: 1 }, { unique: true });
SessionSchema.index({ user_id: 1 });
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Update last_accessed before saving
SessionSchema.pre('save', function (next) {
  if (!this.isNew) {
    this.last_accessed = new Date();
  }
  next();
});

// Instance methods
SessionSchema.methods.isExpired = function (): boolean {
  return this.expires_at < new Date();
};

SessionSchema.methods.extendExpiration = function (days: number = 7): void {
  this.expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  this.last_accessed = new Date();
};

export const Session = mongoose.model<ISession>('Session', SessionSchema);