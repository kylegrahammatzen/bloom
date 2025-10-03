import type { BloomAuthConfig, BloomHandlerContext, GenericResponse } from '@/types';
import { User as UserModel, UserCredentials, Session as SessionModel } from '@/models';
import { verifyPassword, generateSessionId, normalizeEmail } from '@/utils/crypto';
import { APIError, APIErrorCode } from '@/types/errors';
import { APIResponse } from '@/utils/response';
import { checkRateLimit } from '@/api/ratelimit';
import { emitCallback } from '@/api/callbacks';
import { mapUser, mapSession } from '@/utils/mappers';

export async function handleLogin(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const { email, password } = ctx.request.body;

  const rateLimitError = await checkRateLimit('login', ctx, config);
  if (rateLimitError) return rateLimitError;

  if (!email || !password) {
    return new APIError(APIErrorCode.INVALID_CREDENTIALS).toResponse();
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    return new APIError(APIErrorCode.INVALID_CREDENTIALS).toResponse();
  }

  const credentials = await UserCredentials.findOne({ user_id: user._id });
  if (!credentials) {
    return new APIError(APIErrorCode.INVALID_CREDENTIALS).toResponse();
  }

  if (credentials.isAccountLocked()) {
    return new APIError(APIErrorCode.ACCOUNT_LOCKED).toResponse();
  }

  const isValidPassword = await verifyPassword(password, credentials.password_hash, credentials.salt);
  if (!isValidPassword) {
    await credentials.incrementLoginAttempts();
    return new APIError(APIErrorCode.INVALID_CREDENTIALS).toResponse();
  }

  await credentials.resetLoginAttempts();
  user.last_login = new Date();
  await user.save();

  const sessionId = generateSessionId();
  const newSession = new SessionModel({
    session_id: sessionId,
    user_id: user._id,
    expires_at: new Date(Date.now() + (config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000)),
    user_agent: ctx.request.userAgent || ctx.request.headers?.['user-agent'],
    ip_address: ctx.request.ip,
  });
  await newSession.save();

  const mappedUser = mapUser(user);
  const mappedSession = mapSession(newSession);

  await emitCallback('onSignIn', {
    action: 'login',
    endpoint: '/login',
    ip: ctx.request.ip,
    userId: mappedUser.id,
    email: mappedUser.email,
    user: mappedUser,
    session: mappedSession
  }, config);

  return APIResponse.success({
    message: 'Login successful',
    user: mappedUser,
    session: mappedSession
  }, {
    userId: mappedUser.id,
    sessionId: sessionId,
  });
}
