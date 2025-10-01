import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const isDev = process.env.NODE_ENV === 'development';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 5,
  message: {
    error: {
      message: 'Too many authentication attempts, please try again in 15 minutes',
      status: 429,
      retryAfter: 15 * 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request): boolean => {
    return req.path === '/api/health';
  },
});

// Stricter rate limiter for login attempts
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 3,
  message: {
    error: {
      message: 'Too many login attempts, please try again in 15 minutes',
      status: 429,
      retryAfter: 15 * 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password reset requests
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 3,
  message: {
    error: {
      message: 'Too many password reset attempts, please try again in 1 hour',
      status: 429,
      retryAfter: 60 * 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for registration
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 3,
  message: {
    error: {
      message: 'Too many registration attempts, please try again in 1 hour',
      status: 429,
      retryAfter: 60 * 60,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});