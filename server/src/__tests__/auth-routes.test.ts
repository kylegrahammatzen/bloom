import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { User, Token, Session } from '../models';
import authRoutes from '../routes/auth';
import { hashPassword } from '../utils/auth';

const app = express();

// Setup middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// Use auth routes
app.use('/api/auth', authRoutes);

// Error handler for tests
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 500).json({ error: { message: err.message } });
});

describe('Authentication Routes', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'TestPassword123!',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.message).toContain('Registration successful');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.email_verified).toBe(false);
      expect(response.body.verification_token).toBeDefined();

      // Verify user was created in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user!.email_verified).toBe(false);
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'TestPassword123!',
        })
        .expect(201);

      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body.error.message).toContain('security requirements');
      expect(response.body.error.details).toBeInstanceOf(Array);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(validUserData).expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(409);

      expect(response.body.error.message).toContain('already exists');
    });

    it('should reject password longer than 256 characters', async () => {
      const longPassword = 'A'.repeat(257) + '1!';
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: longPassword,
        })
        .expect(400);

      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should create email verification token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.verification_token).toBeDefined();

      // Verify token was created in database
      const tokens = await Token.find({ type: 'email_verification' });
      expect(tokens.length).toBe(1);
      expect(tokens[0].expires_at.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const { hash, salt } = await hashPassword(validUserData.password);
      const user = new User({
        email: validUserData.email,
        password_hash: hash,
        salt,
        email_verified: true,
      });
      await user.save();
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(validUserData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.last_login).toBeDefined();

      // Verify session was created
      const sessions = await Session.find();
      expect(sessions.length).toBe(1);
    });

    it('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.error.message).toBe('Invalid credentials');

      // Verify failed attempt was recorded
      const user = await User.findOne({ email: validUserData.email });
      expect(user!.failed_login_attempts).toBe(1);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        })
        .expect(401);

      expect(response.body.error.message).toBe('Invalid credentials');
    });

    it('should lock account after 5 failed attempts', async () => {
      const user = await User.findOne({ email: validUserData.email });
      user!.failed_login_attempts = 4;
      await user!.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      // Check that account is now locked
      const updatedUser = await User.findOne({ email: validUserData.email });
      expect(updatedUser!.isAccountLocked()).toBe(true);
    });

    it('should reject login for locked account', async () => {
      const user = await User.findOne({ email: validUserData.email });
      user!.locked_until = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      await user!.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send(validUserData)
        .expect(423);

      expect(response.body.error.message).toContain('temporarily locked');
    });

    it('should normalize email during login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: validUserData.password,
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
    });

    it('should reset login attempts on successful login', async () => {
      // Set some failed attempts
      const user = await User.findOne({ email: validUserData.email });
      user!.failed_login_attempts = 2;
      await user!.save();

      await request(app).post('/api/auth/login').send(validUserData).expect(200);

      // Check that attempts were reset
      const updatedUser = await User.findOne({ email: validUserData.email });
      expect(updatedUser!.failed_login_attempts).toBeUndefined();
    });
  });

  describe('POST /api/auth/verify-email', () => {
    let verificationToken: string;
    let user: any;

    beforeEach(async () => {
      // Register user and get verification token
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      verificationToken = response.body.verification_token;
      user = await User.findOne({ email: validUserData.email });
    });

    it('should verify email successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully');
      expect(response.body.user.email_verified).toBe(true);

      // Verify in database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser!.email_verified).toBe(true);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({})
        .expect(400);

      expect(response.body.error.message).toContain('required');
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    beforeEach(async () => {
      const { hash, salt } = await hashPassword(validUserData.password);
      const user = new User({
        email: validUserData.email,
        password_hash: hash,
        salt,
        email_verified: true,
      });
      await user.save();
    });

    it('should create password reset token for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: validUserData.email })
        .expect(200);

      expect(response.body.message).toContain('password reset link');
      expect(response.body.reset_token).toBeDefined();

      // Verify token was created
      const tokens = await Token.find({ type: 'password_reset' });
      expect(tokens.length).toBe(1);
    });

    it('should return success for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toContain('password reset link');
      expect(response.body.reset_token).toBeUndefined();

      // Verify no token was created
      const tokens = await Token.find({ type: 'password_reset' });
      expect(tokens.length).toBe(0);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid email format');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string;
    let user: any;

    beforeEach(async () => {
      // Create user and get reset token
      const { hash, salt } = await hashPassword(validUserData.password);
      user = new User({
        email: validUserData.email,
        password_hash: hash,
        salt,
        email_verified: true,
      });
      await user.save();

      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: validUserData.email });

      resetToken = response.body.reset_token;
    });

    it('should reset password successfully with valid token', async () => {
      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);

      expect(response.body.message).toContain('Password reset successful');

      // Verify password was changed
      const updatedUser = await User.findById(user._id);
      const originalHash = user.password_hash;
      expect(updatedUser!.password_hash).not.toBe(originalHash);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'weak',
        })
        .expect(400);

      expect(response.body.error.message).toContain('security requirements');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should invalidate all user sessions after password reset', async () => {
      // Create a session first
      await request(app).post('/api/auth/login').send(validUserData);

      const sessionsBeforeReset = await Session.find({ user_id: user._id });
      expect(sessionsBeforeReset.length).toBe(1);

      // Reset password
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!',
        })
        .expect(200);

      // Verify sessions were deleted
      const sessionsAfterReset = await Session.find({ user_id: user._id });
      expect(sessionsAfterReset.length).toBe(0);
    });
  });

  describe('GET /api/auth/me', () => {
    let user: any;

    beforeEach(async () => {
      const { hash, salt } = await hashPassword(validUserData.password);
      user = new User({
        email: validUserData.email,
        password_hash: hash,
        salt,
        email_verified: true,
      });
      await user.save();
    });

    it('should return user info when authenticated', async () => {
      // Login first to get session
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send(validUserData);

      const response = await agent.get('/api/auth/me').expect(200);

      expect(response.body.user.email).toBe(validUserData.email);
      expect(response.body.user.email_verified).toBe(true);
      expect(response.body.user.created_at).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.error.message).toBe('Not authenticated');
    });
  });

  describe('POST /api/auth/logout', () => {
    let user: any;

    beforeEach(async () => {
      const { hash, salt } = await hashPassword(validUserData.password);
      user = new User({
        email: validUserData.email,
        password_hash: hash,
        salt,
        email_verified: true,
      });
      await user.save();
    });

    it('should logout successfully', async () => {
      // Login first
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send(validUserData);

      // Verify session exists
      const sessionsBeforeLogout = await Session.find({ user_id: user._id });
      expect(sessionsBeforeLogout.length).toBe(1);

      // Logout
      const response = await agent.post('/api/auth/logout').expect(200);
      expect(response.body.message).toBe('Logout successful');

      // Verify session was removed
      const sessionsAfterLogout = await Session.find({ user_id: user._id });
      expect(sessionsAfterLogout.length).toBe(0);
    });

    it('should handle logout without active session', async () => {
      const response = await request(app).post('/api/auth/logout').expect(200);
      expect(response.body.message).toBe('Logout successful');
    });
  });
});