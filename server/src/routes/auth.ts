import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User, Session, Token } from '../models';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  generateSessionId,
  isValidEmail,
  normalizeEmail,
  checkPasswordStrength,
} from '../utils/auth';
import {
  loginRateLimiter,
  registrationRateLimiter,
  passwordResetRateLimiter,
} from '../middleware/rateLimiter';

const router = express.Router();

// Registration endpoint
router.post(
  '/register',
  registrationRateLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Invalid email format')
      .isLength({ max: 255 })
      .withMessage('Email must be less than 255 characters'),
    body('password')
      .isLength({ min: 8, max: 256 })
      .withMessage('Password must be between 8 and 256 characters'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            message: 'Validation failed',
            details: errors.array(),
          },
        });
      }

      const { email, password } = req.body;
      const normalizedEmail = normalizeEmail(email);

      // Check password strength
      const passwordCheck = checkPasswordStrength(password);
      if (!passwordCheck.isStrong) {
        return res.status(400).json({
          error: {
            message: 'Password does not meet security requirements',
            details: passwordCheck.issues,
          },
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          error: {
            message: 'An account with this email already exists',
          },
        });
      }

      // Hash password
      const { hash, salt } = await hashPassword(password);

      // Create user
      const user = new User({
        email: normalizedEmail,
        password_hash: hash,
        salt,
      });

      await user.save();

      // Generate email verification token
      const token = generateSecureToken();
      const tokenHash = hashToken(token);

      const verificationToken = new Token({
        token_hash: tokenHash,
        type: 'email_verification',
        user_id: user._id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      await verificationToken.save();

      res.status(201).json({
        message: 'Registration successful. Please check your email for verification.',
        user: {
          id: user._id,
          email: user.email,
          created_at: user.created_at,
          email_verified: user.email_verified,
        },
        // In production, you would send this token via email
        // For development, we return it in the response
        ...(process.env.NODE_ENV !== 'production' && { verification_token: token }),
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Login endpoint
router.post(
  '/login',
  loginRateLimiter,
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            message: 'Invalid credentials',
          },
        });
      }

      const { email, password } = req.body;
      const normalizedEmail = normalizeEmail(email);

      // Find user
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({
          error: {
            message: 'Invalid credentials',
          },
        });
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        return res.status(423).json({
          error: {
            message: 'Account is temporarily locked due to too many failed login attempts',
          },
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password_hash, user.salt);
      if (!isValidPassword) {
        await user.incrementLoginAttempts();
        return res.status(401).json({
          error: {
            message: 'Invalid credentials',
          },
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Update last login
      user.last_login = new Date();
      await user.save();

      // Create session
      const sessionId = generateSessionId();
      const session = new Session({
        session_id: sessionId,
        user_id: user._id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        user_agent: req.get('User-Agent'),
        ip_address: req.ip,
      });

      await session.save();

      // Set session cookie
      req.session.userId = user._id.toString();
      req.session.sessionId = sessionId;

      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          email_verified: user.email_verified,
          last_login: user.last_login,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Logout endpoint
router.post('/logout', async (req, res, next) => {
  try {
    if (req.session.sessionId) {
      // Remove session from database
      await Session.deleteOne({ session_id: req.session.sessionId });
    }

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      res.clearCookie('bloom.sid');
      res.json({ message: 'Logout successful' });
    });
  } catch (error) {
    return next(error);
  }
});

// Email verification endpoint
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: {
          message: 'Verification token is required',
        },
      });
    }

    const tokenHash = hashToken(token);
    const verificationToken = await Token.findOne({
      token_hash: tokenHash,
      type: 'email_verification',
    });

    if (!verificationToken || !verificationToken.isValid()) {
      return res.status(400).json({
        error: {
          message: 'Invalid or expired verification token',
        },
      });
    }

    // Update user as verified
    const user = await User.findById(verificationToken.user_id);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
        },
      });
    }

    user.email_verified = true;
    await user.save();

    // Mark token as used
    await verificationToken.markAsUsed();

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        email_verified: user.email_verified,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Request password reset endpoint
router.post(
  '/request-password-reset',
  passwordResetRateLimiter,
  [body('email').isEmail().withMessage('Invalid email format')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            message: 'Invalid email format',
          },
        });
      }

      const { email } = req.body;
      const normalizedEmail = normalizeEmail(email);

      const user = await User.findOne({ email: normalizedEmail });

      // Always return success to prevent email enumeration
      const successResponse = {
        message: 'If an account with this email exists, a password reset link has been sent.',
      };

      if (!user) {
        return res.json(successResponse);
      }

      // Generate password reset token
      const token = generateSecureToken();
      const tokenHash = hashToken(token);

      const resetToken = new Token({
        token_hash: tokenHash,
        type: 'password_reset',
        user_id: user._id,
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      await resetToken.save();

      // In production, you would send this token via email
      // For development, we return it in the response
      res.json({
        ...successResponse,
        ...(process.env.NODE_ENV !== 'production' && { reset_token: token }),
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Reset password endpoint
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8, max: 256 })
      .withMessage('Password must be between 8 and 256 characters'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            message: 'Validation failed',
            details: errors.array(),
          },
        });
      }

      const { token, password } = req.body;

      // Check password strength
      const passwordCheck = checkPasswordStrength(password);
      if (!passwordCheck.isStrong) {
        return res.status(400).json({
          error: {
            message: 'Password does not meet security requirements',
            details: passwordCheck.issues,
          },
        });
      }

      const tokenHash = hashToken(token);
      const resetToken = await Token.findOne({
        token_hash: tokenHash,
        type: 'password_reset',
      });

      if (!resetToken || !resetToken.isValid()) {
        return res.status(400).json({
          error: {
            message: 'Invalid or expired reset token',
          },
        });
      }

      // Find user and update password
      const user = await User.findById(resetToken.user_id);
      if (!user) {
        return res.status(404).json({
          error: {
            message: 'User not found',
          },
        });
      }

      // Hash new password
      const { hash, salt } = await hashPassword(password);
      user.password_hash = hash;
      user.salt = salt;
      await user.save();

      // Mark token as used
      await resetToken.markAsUsed();

      // Invalidate all existing sessions for security
      await Session.deleteMany({ user_id: user._id });

      res.json({
        message: 'Password reset successful. Please log in with your new password.',
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Get current user endpoint
router.get('/me', async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: {
          message: 'Not authenticated',
        },
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
        },
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        email_verified: user.email_verified,
        created_at: user.created_at,
        last_login: user.last_login,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Delete account endpoint
router.delete('/account', async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: {
          message: 'Not authenticated',
        },
      });
    }

    const userId = req.session.userId;

    // Delete all user sessions
    await Session.deleteMany({ user_id: userId });

    // Delete all user tokens
    await Token.deleteMany({ user_id: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      res.clearCookie('bloom.sid');
      res.json({ message: 'Account deleted successfully' });
    });
  } catch (error) {
    return next(error);
  }
});

export default router;