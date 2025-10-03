import { isValidEmail, normalizeEmail, checkPasswordStrength } from '@/utils/crypto';
import { APIError, APIErrorCode } from '@/types/errors';
import type { GenericResponse } from '@/types';

export function validateEmail(email: string): GenericResponse | null {
  if (!email || !isValidEmail(email)) {
    return new APIError(APIErrorCode.INVALID_EMAIL).toResponse();
  }
  return null;
}

export function validatePassword(password: string): GenericResponse | null {
  if (!password || password.length < 8 || password.length > 256) {
    return new APIError(APIErrorCode.PASSWORD_REQUIRED).toResponse();
  }

  const passwordCheck = checkPasswordStrength(password);
  if (!passwordCheck.isStrong) {
    return new APIError(APIErrorCode.WEAK_PASSWORD, passwordCheck.issues).toResponse();
  }

  return null;
}

export function validateEmailAndPassword(email: string, password: string): GenericResponse | null {
  const emailError = validateEmail(email);
  if (emailError) return emailError;

  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;

  return null;
}

export { normalizeEmail };
