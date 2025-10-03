import type { BloomAuthConfig, BloomHandlerContext, GenericResponse } from '@/types';
import { User as UserModel, UserCredentials, Session as SessionModel, Token } from '@/models';
import { hashPassword, generateSecureToken, hashToken, generateSessionId } from '@/utils/crypto';
import { APIError, APIErrorCode } from '@/types/errors';
import { APIResponse } from '@/utils/response';
import { checkRateLimit } from '@/api/ratelimit';
import { validateEmailAndPassword, normalizeEmail } from '@/api/validation';
import { emitCallback } from '@/api/callbacks';
import { mapUser, mapSession } from '@/utils/mappers';

export async function handleRegister(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const { email, password } = ctx.request.body;

  const rateLimitError = await checkRateLimit('registration', ctx, config);
  if (rateLimitError) return rateLimitError;

  const error = validateEmailAndPassword(email, password);
  if (error) return error;

  const normalizedEmail = normalizeEmail(email);

  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    return new APIError(APIErrorCode.EMAIL_ALREADY_EXISTS).toResponse();
  }

  const user = new UserModel({ email: normalizedEmail });
  await user.save();

  const { hash, salt } = await hashPassword(password);
  const credentials = new UserCredentials({
    user_id: user._id,
    password_hash: hash,
    salt,
  });
  await credentials.save();

  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const verificationToken = new Token({
    token_hash: tokenHash,
    type: 'email_verification',
    user_id: user._id,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await verificationToken.save();

  const sessionId = generateSessionId();
  const session = new SessionModel({
    session_id: sessionId,
    user_id: user._id,
    expires_at: new Date(Date.now() + (config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000)),
    user_agent: ctx.request.userAgent || ctx.request.headers?.['user-agent'],
    ip_address: ctx.request.ip,
  });
  await session.save();

  const mappedUser = mapUser(user);
  const mappedSession = mapSession(session);

  await emitCallback('onRegister', {
    action: 'register',
    endpoint: '/register',
    ip: ctx.request.ip,
    userId: mappedUser.id,
    email: mappedUser.email,
    user: mappedUser,
    session: mappedSession
  }, config);

  return APIResponse.created({
    message: 'Registration successful',
    user: mappedUser,
    session: mappedSession
  }, {
    userId: mappedUser.id,
    sessionId: sessionId,
  });
}
