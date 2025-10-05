import type { BloomAuthConfig, BloomHandlerContext, GenericResponse, ValidatedContext } from '@/schemas';
import { User as UserModel, Token } from '@/models';
import { hashToken, generateSecureToken, normalizeEmail } from '@/utils/crypto';
import { APIError, APIErrorCode } from '@/schemas/errors';
import { json } from '@/utils/response';
import { emitCallback } from '@/api/callbacks';
import { mapUser } from '@/utils/mappers';
import { checkRateLimit } from '@/api/ratelimit';
import { validateRequest, composeMiddleware } from '@/validation';
import { EmailVerificationRequestSchema, type EmailVerificationRequestInput } from '@/schemas/auth';

export async function handleRequestEmailVerification(ctx: ValidatedContext<EmailVerificationRequestInput>, config: BloomAuthConfig): Promise<GenericResponse> {
  const validate = composeMiddleware(
    (ctx) => checkRateLimit('emailVerification', ctx, config),
    validateRequest(EmailVerificationRequestSchema)
  );

  const error = await validate(ctx);
  if (error) return error;

  const { email } = ctx.validatedData!;
  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalizedEmail });

  // Return success even if user doesn't exist (security best practice)
  if (!user) {
    return json({ message: 'If an account with this email exists, a verification link has been sent.' });
  }

  // If already verified, no need to send again
  if (user.email_verified) {
    return json({ message: 'Email is already verified.' });
  }

  // Generate verification token
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const verificationToken = new Token({
    token_hash: tokenHash,
    type: 'email_verification',
    user_id: user._id,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });
  await verificationToken.save();

  // Build verification URL with callback URL (defaults to root)
  const baseUrl = config.baseUrl || 'http://localhost:3000';
  const callbackUrl = '/';
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}&callbackUrl=${encodeURIComponent(callbackUrl)}`;

  // Fire callback to send verification email
  if (config.callbacks?.onSendVerification) {
    await config.callbacks.onSendVerification({
      email: user.email,
      token,
      userId: user._id.toString(),
      verificationUrl,
    });
  }

  return json({ message: 'If an account with this email exists, a verification link has been sent.' });
}

export async function handleVerifyEmail(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  // Check if email verification is enabled
  if (!config.emailVerification?.enabled) {
    const error = new APIError(APIErrorCode.INVALID_REQUEST, 'Email verification is not enabled').toResponse();
    const callbackUrl = ctx.request.query?.callbackUrl;
    if (callbackUrl) {
      return { ...error, callbackUrl: `${callbackUrl}?error=not_enabled` };
    }
    return error;
  }

  const token = ctx.request.query?.token || ctx.request.body?.token;
  const callbackUrl = ctx.request.query?.callbackUrl;

  if (!token) {
    const error = new APIError(APIErrorCode.TOKEN_REQUIRED).toResponse();
    if (callbackUrl) {
      return { ...error, callbackUrl: `${callbackUrl}?error=token_required` };
    }
    return error;
  }

  const tokenHash = hashToken(token);
  const verificationToken = await Token.findOne({
    token_hash: tokenHash,
    type: 'email_verification',
  });

  if (!verificationToken || !verificationToken.isValid()) {
    const error = new APIError(APIErrorCode.INVALID_TOKEN).toResponse();
    if (callbackUrl) {
      return { ...error, callbackUrl: `${callbackUrl}?error=invalid_token` };
    }
    return error;
  }

  const user = await UserModel.findById(verificationToken.user_id);
  if (!user) {
    const error = new APIError(APIErrorCode.USER_NOT_FOUND).toResponse();
    if (callbackUrl) {
      return { ...error, callbackUrl: `${callbackUrl}?error=user_not_found` };
    }
    return error;
  }

  user.email_verified = true;
  await user.save();
  await verificationToken.markAsUsed();

  // Fire onEmailVerification callback
  if (config.callbacks?.onEmailVerification) {
    await config.callbacks.onEmailVerification({
      userId: user._id.toString(),
      email: user.email,
      ip: ctx.request.ip,
    });
  }

  const response = json({
    message: 'Email verified successfully',
    user: mapUser(user),
  });

  // Redirect to callback URL if provided
  if (callbackUrl) {
    return { ...response, callbackUrl: `${callbackUrl}?verified=true` };
  }

  return response;
}
