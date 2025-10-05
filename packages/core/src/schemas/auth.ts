import { z } from 'zod';
import { isCommonPassword, hasSufficientEntropy } from '@/utils/common-passwords';

/**
 * Email validation schema
 * Uses Zod 4's top-level email() function for better tree-shaking
 */
export const EmailSchema = z.email({ error: 'Invalid email address' });

/**
 * Password validation schema
 * Requirements:
 * - 8-256 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 * - Not a common password (blacklist check)
 * - Sufficient entropy (randomness)
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(256, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character')
  .refine((password) => !isCommonPassword(password), {
    message: 'This password is too common and appears in breach databases. Please choose a more unique password.',
  })
  .refine((password) => hasSufficientEntropy(password), {
    message: 'Password is not random enough. Try using a longer password with more varied characters.',
  });

/**
 * Registration schema
 * Used for user signup with email and password
 */
export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

/**
 * Login schema
 * Only requires valid email format and non-empty password
 * (password strength is not validated on login)
 */
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Password reset request schema
 * Only requires email to send reset link
 */
export const PasswordResetRequestSchema = z.object({
  email: EmailSchema,
});

/**
 * Password reset confirmation schema
 * Requires token and new password
 */
export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: PasswordSchema,
});

/**
 * Email verification request schema
 * Requires email to send verification link
 */
export const EmailVerificationRequestSchema = z.object({
  email: EmailSchema,
});

/**
 * Email verification schema
 * Requires verification token
 */
export const EmailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * TypeScript types inferred from schemas
 * Use these types in your application code for type-safe request handling
 */
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
export type EmailVerificationRequestInput = z.infer<typeof EmailVerificationRequestSchema>;
export type EmailVerificationInput = z.infer<typeof EmailVerificationSchema>;
