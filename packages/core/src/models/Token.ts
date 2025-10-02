import mongoose, { Document, Schema } from 'mongoose';

export interface IToken extends Document {
  token_hash: string;
  type: 'email_verification' | 'password_reset';
  user_id: mongoose.Types.ObjectId;
  expires_at: Date;
  used_at?: Date;
  created_at: Date;

  isExpired(): boolean;
  isUsed(): boolean;
  markAsUsed(): Promise<IToken>;
  isValid(): boolean;
}

const TokenSchema = new Schema<IToken>({
  token_hash: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['email_verification', 'password_reset'],
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
  used_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

TokenSchema.index({ token_hash: 1 }, { unique: true });
TokenSchema.index({ user_id: 1 });
TokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
TokenSchema.index({ type: 1 });

TokenSchema.methods.isExpired = function (): boolean {
  return this.expires_at < new Date();
};

TokenSchema.methods.isUsed = function (): boolean {
  return !!this.used_at;
};

TokenSchema.methods.markAsUsed = function (): Promise<IToken> {
  this.used_at = new Date();
  return this.save();
};

TokenSchema.methods.isValid = function (): boolean {
  return !this.isExpired() && !this.isUsed();
};

export const Token = mongoose.model<IToken>('Token', TokenSchema);