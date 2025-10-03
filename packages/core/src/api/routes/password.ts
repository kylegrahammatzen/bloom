import type { BloomAuthConfig, BloomHandlerContext, GenericResponse } from '../../types';
import { User as UserModel, UserCredentials, Session as SessionModel, Token } from '../../models';
import { hashPassword, generateSecureToken, hashToken } from '../../utils/crypto';
import { APIError, APIErrorCode } from '../../types/errors';
import { APIResponse } from '../../utils/response';
import { checkRateLimit } from '../ratelimit';
import { validateEmail, validatePassword, normalizeEmail } from '../validation';
import { emitCallback } from '../callbacks';

export async function handleRequestPasswordReset(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const { email } = ctx.request.body;

  const rateLimitError = await checkRateLimit('passwordReset', ctx, config);
  if (rateLimitError) return rateLimitError;

  const error = validateEmail(email);
  if (error) return error;

  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    return APIResponse.success({ message: 'If an account with this email exists, a password reset link has been sent.' });
  }

  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const resetToken = new Token({
    token_hash: tokenHash,
    type: 'password_reset',
    user_id: user._id,
    expires_at: new Date(Date.now() + 60 * 60 * 1000),
  });
  await resetToken.save();

  return APIResponse.success({ message: 'If an account with this email exists, a password reset link has been sent.' });
}

export async function handleResetPassword(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const { token, password } = ctx.request.body;

  if (!token || !password) return new APIError(APIErrorCode.TOKEN_REQUIRED).toResponse();

  const error = validatePassword(password);
  if (error) return error;

  const tokenHash = hashToken(token);
  const resetToken = await Token.findOne({
    token_hash: tokenHash,
    type: 'password_reset',
  });

  if (!resetToken || !resetToken.isValid()) {
    return new APIError(APIErrorCode.INVALID_TOKEN).toResponse();
  }

  const user = await UserModel.findById(resetToken.user_id);
  if (!user) {
    return new APIError(APIErrorCode.USER_NOT_FOUND).toResponse();
  }

  const { hash, salt } = await hashPassword(password);
  await UserCredentials.updateOne(
    { user_id: user._id },
    { $set: { password_hash: hash, salt: salt } }
  );

  await resetToken.markAsUsed();
  await SessionModel.deleteMany({ user_id: user._id });

  await emitCallback('onPasswordReset', {
    action: 'password_reset',
    endpoint: '/reset-password',
    ip: ctx.request.ip,
    userId: user._id.toString(),
    email: user.email
  }, config);

  return APIResponse.success({ message: 'Password reset successful' });
}
