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
exports.Session = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SessionSchema = new mongoose_1.Schema({
    session_id: {
        type: String,
        required: true,
        unique: true,
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
SessionSchema.methods.isExpired = function () {
    return this.expires_at < new Date();
};
SessionSchema.methods.extendExpiration = function (days = 7) {
    this.expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    this.last_accessed = new Date();
};
exports.Session = mongoose_1.default.model('Session', SessionSchema);
