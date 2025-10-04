import { z } from 'zod';

/**
 * Email validation for client-side forms
 */
export const EmailSchema = z.email({ error: 'Invalid email address' });

/**
 * Password strength validation for registration
 *
 * Requirements enforced:
 * - 8-256 characters
 * - Lowercase letter
 * - Uppercase letter
 * - Number
 * - Special character
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(256, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character');

/**
 * Basic password validation for login (no strength requirements)
 */
export const LoginPasswordSchema = z.string().min(1, 'Password is required');

/**
 * User registration form schema
 */
export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

/**
 * User login form schema
 */
export const LoginSchema = z.object({
  email: EmailSchema,
  password: LoginPasswordSchema,
});

/**
 * Password reset request schema
 */
export const PasswordResetRequestSchema = z.object({
  email: EmailSchema,
});

/**
 * Password reset confirmation schema
 */
export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: PasswordSchema,
});

/**
 * Email verification schema
 */
export const EmailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * Inferred types for TypeScript
 * These provide full type safety in your forms and API calls
 */
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
export type EmailVerificationInput = z.infer<typeof EmailVerificationSchema>;
