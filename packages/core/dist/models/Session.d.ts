import mongoose, { Document } from 'mongoose';
export interface ISession extends Document {
    session_id: string;
    user_id: mongoose.Types.ObjectId;
    expires_at: Date;
    user_agent?: string;
    ip_address?: string;
    created_at: Date;
    last_accessed: Date;
    isExpired(): boolean;
    extendExpiration(days?: number): void;
}
export declare const Session: mongoose.Model<ISession, {}, {}, {}, mongoose.Document<unknown, {}, ISession> & ISession & {
    _id: mongoose.Types.ObjectId;
}, any>;
