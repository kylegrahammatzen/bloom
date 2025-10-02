import mongoose, { Document, UpdateWriteOpResult } from 'mongoose';
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
export declare const UserCredentials: mongoose.Model<IUserCredentials, {}, {}, {}, mongoose.Document<unknown, {}, IUserCredentials> & IUserCredentials & {
    _id: mongoose.Types.ObjectId;
}, any>;
