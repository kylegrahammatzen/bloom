import { describe, it, expect, beforeEach } from 'vitest';
import { User, IUser } from '../models/User';
import { hashPassword } from '../utils/auth';

describe('User Model', () => {
  const validUserData = {
    email: 'test@example.com',
    password_hash: 'hashed_password',
    salt: 'salt_value',
  };

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const user = new User(validUserData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.password_hash).toBe('hashed_password');
      expect(savedUser.salt).toBe('salt_value');
      expect(savedUser.email_verified).toBe(false);
      expect(savedUser.failed_login_attempts).toBe(0);
      expect(savedUser.created_at).toBeInstanceOf(Date);
      expect(savedUser.updated_at).toBeInstanceOf(Date);
    });

    it('should normalize email to lowercase', async () => {
      const user = new User({
        ...validUserData,
        email: 'TEST@EXAMPLE.COM',
      });
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
    });

    it('should trim email whitespace', async () => {
      const user = new User({
        ...validUserData,
        email: '  test@example.com  ',
      });
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
    });

    it('should require email field', async () => {
      const user = new User({
        password_hash: 'hashed_password',
        salt: 'salt_value',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require password_hash field', async () => {
      const user = new User({
        email: 'test@example.com',
        salt: 'salt_value',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require salt field', async () => {
      const user = new User({
        email: 'test@example.com',
        password_hash: 'hashed_password',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const user1 = new User(validUserData);
      await user1.save();

      const user2 = new User({
        ...validUserData,
        email: 'test@example.com', // Same email
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should reject email longer than 255 characters', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // 261 characters
      const user = new User({
        ...validUserData,
        email: longEmail,
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Instance Methods', () => {
    let user: IUser;

    beforeEach(async () => {
      user = new User(validUserData);
      await user.save();
    });

    describe('isAccountLocked', () => {
      it('should return false for unlocked account', () => {
        expect(user.isAccountLocked()).toBe(false);
      });

      it('should return true for locked account', () => {
        user.locked_until = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        expect(user.isAccountLocked()).toBe(true);
      });

      it('should return false for expired lock', () => {
        user.locked_until = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        expect(user.isAccountLocked()).toBe(false);
      });
    });

    describe('incrementLoginAttempts', () => {
      it('should increment failed_login_attempts', async () => {
        await user.incrementLoginAttempts();
        const updatedUser = await User.findById(user._id);
        expect(updatedUser?.failed_login_attempts).toBe(1);
      });

      it('should lock account after 5 failed attempts', async () => {
        // Set to 4 attempts initially
        user.failed_login_attempts = 4;
        await user.save();

        await user.incrementLoginAttempts();
        const updatedUser = await User.findById(user._id);

        expect(updatedUser?.failed_login_attempts).toBe(5);
        expect(updatedUser?.locked_until).toBeInstanceOf(Date);
        expect(updatedUser?.locked_until!.getTime()).toBeGreaterThan(Date.now());
      });

      it('should reset attempts if expired lock exists', async () => {
        user.failed_login_attempts = 5;
        user.locked_until = new Date(Date.now() - 60 * 60 * 1000); // Expired 1 hour ago
        await user.save();

        await user.incrementLoginAttempts();
        const updatedUser = await User.findById(user._id);

        expect(updatedUser?.failed_login_attempts).toBe(1);
        expect(updatedUser?.locked_until).toBeUndefined();
      });
    });

    describe('resetLoginAttempts', () => {
      it('should reset failed_login_attempts and locked_until', async () => {
        user.failed_login_attempts = 3;
        user.locked_until = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        await user.resetLoginAttempts();
        const updatedUser = await User.findById(user._id);

        expect(updatedUser?.failed_login_attempts).toBeUndefined();
        expect(updatedUser?.locked_until).toBeUndefined();
      });
    });
  });

  describe('User Schema Middleware', () => {
    it('should update updated_at field on save', async () => {
      const user = new User(validUserData);
      const originalTime = user.updated_at;

      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      user.email_verified = true;
      await user.save();

      expect(user.updated_at.getTime()).toBeGreaterThan(originalTime.getTime());
    });
  });

  describe('Integration with Auth Utils', () => {
    it('should work with hashPassword utility', async () => {
      const password = 'TestPassword123!';
      const { hash, salt } = await hashPassword(password);

      const user = new User({
        email: 'integration@test.com',
        password_hash: hash,
        salt: salt,
      });

      const savedUser = await user.save();
      expect(savedUser.password_hash).toBe(hash);
      expect(savedUser.salt).toBe(salt);
    });
  });
});