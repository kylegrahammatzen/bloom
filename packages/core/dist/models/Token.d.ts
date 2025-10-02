import mongoose, { Document } from 'mongoose';
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
export declare const Token: mongoose.Model<IToken, {}, {}, {}, mongoose.Document<unknown, {}, IToken> & IToken & {
    _id: mongoose.Types.ObjectId;
}, any>;
