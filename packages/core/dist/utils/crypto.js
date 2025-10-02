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
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateSecureToken = generateSecureToken;
exports.hashToken = hashToken;
exports.generateSessionId = generateSessionId;
exports.isValidEmail = isValidEmail;
exports.normalizeEmail = normalizeEmail;
exports.checkPasswordStrength = checkPasswordStrength;
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
const ARGON2_CONFIG = {
    type: argon2.argon2id,
    memoryCost: 19 * 1024,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
};
/**
 * Hash a password using Argon2id with secure salt
 * @param password - The plaintext password to hash
 * @returns Promise containing the hash and salt as base64 strings
 */
async function hashPassword(password) {
    try {
        const salt = (0, crypto_1.randomBytes)(32);
        const hash = await argon2.hash(password, {
            ...ARGON2_CONFIG,
            salt,
        });
        return {
            hash,
            salt: salt.toString('base64'),
        };
    }
    catch (error) {
        throw new Error('Failed to hash password');
    }
}
/**
 * Verify a password against its hash using constant-time comparison
 * @param password - The plaintext password to verify
 * @param hash - The stored hash to compare against
 * @param salt - The salt used for the original hash (base64 encoded)
 * @returns Promise resolving to true if password matches, false otherwise
 */
async function verifyPassword(password, hash, salt) {
    try {
        const saltBuffer = Buffer.from(salt, 'base64');
        const newHash = await argon2.hash(password, {
            ...ARGON2_CONFIG,
            salt: saltBuffer,
        });
        return (0, crypto_1.timingSafeEqual)(Buffer.from(hash), Buffer.from(newHash));
    }
    catch (error) {
        return false;
    }
}
/**
 * Generate a cryptographically secure random token
 * @returns Base32 encoded token string (120 bits of entropy)
 */
function generateSecureToken() {
    const bytes = (0, crypto_1.randomBytes)(15);
    return encodeBase32(bytes);
}
/**
 * Custom Base32 encoding implementation using RFC 4648 alphabet
 * @param buffer - Buffer to encode
 * @returns Base32 encoded string in lowercase
 */
function encodeBase32(buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;
    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;
        while (bits >= 5) {
            result += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        result += alphabet[(value << (5 - bits)) & 31];
    }
    return result.toLowerCase();
}
/**
 * Hash a token with SHA-256 for secure storage
 * @param token - Token string to hash
 * @returns SHA-256 hash as hex string
 */
function hashToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
/**
 * Generate session ID with sufficient entropy
 * @returns 64-character hex string (256 bits of entropy)
 */
function generateSessionId() {
    const bytes = (0, crypto_1.randomBytes)(32);
    return bytes.toString('hex');
}
/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if email format is valid and within length limits
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
}
/**
 * Normalize email address
 * @param email - Email address to normalize
 * @returns Lowercase, trimmed email address
 */
function normalizeEmail(email) {
    return email.toLowerCase().trim();
}
/**
 * Check password strength
 * @param password - Password to validate
 * @returns Object containing strength assessment and issues
 */
function checkPasswordStrength(password) {
    const issues = [];
    if (password.length < 8) {
        issues.push('Password must be at least 8 characters long');
    }
    if (password.length > 256) {
        issues.push('Password must be less than 256 characters');
    }
    if (!/[a-z]/.test(password)) {
        issues.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        issues.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        issues.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        issues.push('Password must contain at least one special character');
    }
    return {
        isStrong: issues.length === 0,
        issues,
    };
}
