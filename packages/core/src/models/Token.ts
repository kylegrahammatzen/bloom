import mongoose from 'mongoose';
import { mongooseSchema } from '@/utils/mongoose-schema';
import { TokenModelSchema } from '@/schemas/models';

const schema = mongooseSchema(TokenModelSchema);

schema.index({ token_hash: 1 }, { unique: true });
schema.index({ user_id: 1 });
schema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
schema.index({ type: 1 });

schema.methods.isExpired = function (): boolean {
  return this.expires_at < new Date();
};

schema.methods.isUsed = function (): boolean {
  return !!this.used_at;
};

schema.methods.markAsUsed = function (): Promise<IToken> {
  this.used_at = new Date();
  return this.save();
};

schema.methods.isValid = function (): boolean {
  return !this.isExpired() && !this.isUsed();
};

export const Token = mongoose.models.Token || mongoose.model('Token', schema);

export interface IToken extends mongoose.InferSchemaType<typeof schema>, mongoose.Document {
  isExpired(): boolean;
  isUsed(): boolean;
  markAsUsed(): Promise<IToken>;
  isValid(): boolean;
}