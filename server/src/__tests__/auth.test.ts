import { describe, it, expect } from 'vitest';
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

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const result = await hashPassword(password);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
      expect(result.hash.length).toBeGreaterThan(0);
      expect(result.salt.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const result1 = await hashPassword(password);
      const result2 = await hashPassword(password);

      expect(result1.hash).not.toBe(result2.hash);
      expect(result1.salt).not.toBe(result2.salt);
    });

    it('should handle empty password', async () => {
      await expect(hashPassword('')).resolves.toHaveProperty('hash');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const { hash, salt } = await hashPassword(password);

      const isValid = await verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const { hash, salt } = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash, salt);
      expect(isValid).toBe(false);
    });

    it('should reject with invalid salt', async () => {
      const password = 'TestPassword123!';
      const { hash } = await hashPassword(password);

      const isValid = await verifyPassword(password, hash, 'invalidSalt');
      expect(isValid).toBe(false);
    });

    it('should reject with invalid hash', async () => {
      const password = 'TestPassword123!';
      const { salt } = await hashPassword(password);

      const isValid = await verifyPassword(password, 'invalidHash', salt);
      expect(isValid).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a token', () => {
      const token = generateSecureToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with only valid base32 characters', () => {
      const token = generateSecureToken();
      const validChars = /^[a-z2-7]+$/;
      expect(validChars.test(token)).toBe(true);
    });
  });

  describe('hashToken', () => {
    it('should hash a token to hex string', () => {
      const token = 'test-token-123';
      const hash = hashToken(token);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 hex length
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it('should generate same hash for same token', () => {
      const token = 'test-token-123';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different tokens', () => {
      const hash1 = hashToken('token1');
      const hash2 = hashToken('token2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateSessionId', () => {
    it('should generate a session ID', () => {
      const sessionId = generateSessionId();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBe(64); // 32 bytes as hex
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });

    it('should generate hex-only session IDs', () => {
      const sessionId = generateSessionId();
      expect(/^[a-f0-9]+$/.test(sessionId)).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.com',
        'user+tag@example.org',
        'test123@sub.domain.co.uk',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@domain.com',
        'user@',
        'user@@domain.com',
        'user@domain',
        '',
        'user name@domain.com',
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should reject emails longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('normalizeEmail', () => {
    it('should normalize email to lowercase and trim', () => {
      expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(normalizeEmail('User@Domain.Com')).toBe('user@domain.com');
    });

    it('should handle already normalized emails', () => {
      const email = 'test@example.com';
      expect(normalizeEmail(email)).toBe(email);
    });
  });

  describe('checkPasswordStrength', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MySecure@Pass1',
        'Complex#Password99',
      ];

      strongPasswords.forEach(password => {
        const result = checkPasswordStrength(password);
        expect(result.isStrong).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });

    it('should reject weak passwords with specific issues', () => {
      const weakPasswords = [
        { password: 'short', expectedIssues: 4 }, // too short, missing upper, number, special
        { password: 'toolongpasswordthatexceeds256characters'.repeat(10), expectedIssues: 1 }, // too long
        { password: 'nouppercase123!', expectedIssues: 1 }, // missing uppercase
        { password: 'NOLOWERCASE123!', expectedIssues: 1 }, // missing lowercase
        { password: 'NoNumbers!', expectedIssues: 1 }, // missing number
        { password: 'NoSpecialChars123', expectedIssues: 1 }, // missing special char
      ];

      weakPasswords.forEach(({ password, expectedIssues }) => {
        const result = checkPasswordStrength(password);
        expect(result.isStrong).toBe(false);
        expect(result.issues.length).toBeGreaterThanOrEqual(expectedIssues);
      });
    });

    it('should provide specific error messages', () => {
      const result = checkPasswordStrength('weak');
      expect(result.issues).toContain('Password must be at least 8 characters long');
      expect(result.issues).toContain('Password must contain at least one uppercase letter');
      expect(result.issues).toContain('Password must contain at least one number');
      expect(result.issues).toContain('Password must contain at least one special character');
    });
  });
});