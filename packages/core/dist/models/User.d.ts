import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    email: string;
    name?: string;
    image?: string;
    created_at: Date;
    updated_at: Date;
    email_verified: boolean;
    last_login?: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
