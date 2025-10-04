import type { BloomAuthConfig, GenericResponse, ValidatedContext } from '@/schemas';
import { User as UserModel, UserCredentials, Session as SessionModel, Token } from '@/models';
import { hashPassword, generateSecureToken, hashToken, normalizeEmail } from '@/utils/crypto';
import { APIError, APIErrorCode } from '@/schemas/errors';
import { json } from '@/utils/response';
import { checkRateLimit } from '@/api/ratelimit';
import { validateRequest, composeMiddleware } from '@/validation';
import { PasswordResetRequestSchema, PasswordResetConfirmSchema, type PasswordResetRequestInput, type PasswordResetConfirmInput } from '@/schemas/auth';
import { emitCallback } from '@/api/callbacks';

export async function handleRequestPasswordReset(ctx: ValidatedContext<PasswordResetRequestInput>, config: BloomAuthConfig): Promise<GenericResponse> {
  const validate = composeMiddleware(
    (ctx) => checkRateLimit('passwordReset', ctx, config),
    validateRequest(PasswordResetRequestSchema)
  );

  const error = await validate(ctx);
  if (error) return error;

  const { email } = ctx.validatedData!;
  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    return json({ message: 'If an account with this email exists, a password reset link has been sent.' });
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

  return json({ message: 'If an account with this email exists, a password reset link has been sent.' });
}

export async function handleResetPassword(ctx: ValidatedContext<PasswordResetConfirmInput>, config: BloomAuthConfig): Promise<GenericResponse> {
  const error = await validateRequest(PasswordResetConfirmSchema)(ctx);
  if (error) return error;

  const { token, password } = ctx.validatedData!;
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

  return json({ message: 'Password reset successful' });
}
