"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TokenSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
// Indexes
TokenSchema.index({ token_hash: 1 }, { unique: true });
TokenSchema.index({ user_id: 1 });
TokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
TokenSchema.index({ type: 1 });
// Instance methods
TokenSchema.methods.isExpired = function () {
    return this.expires_at < new Date();
};
TokenSchema.methods.isUsed = function () {
    return !!this.used_at;
};
TokenSchema.methods.markAsUsed = function () {
    this.used_at = new Date();
    return this.save();
};
TokenSchema.methods.isValid = function () {
    return !this.isExpired() && !this.isUsed();
};
exports.Token = mongoose_1.default.model('Token', TokenSchema);
