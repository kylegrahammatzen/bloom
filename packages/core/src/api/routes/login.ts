import type { BloomAuthConfig, GenericResponse, ValidatedContext } from '@/schemas';
import { User as UserModel, UserCredentials, Session as SessionModel } from '@/models';
import { verifyPassword, generateSessionId, normalizeEmail } from '@/utils/crypto';
import { APIError, APIErrorCode } from '@/schemas/errors';
import { json } from '@/utils/response';
import { checkRateLimit } from '@/api/ratelimit';
import { validateRequest, composeMiddleware } from '@/validation';
import { LoginSchema, type LoginInput } from '@/schemas/auth';
import { emitCallback } from '@/api/callbacks';
import { mapUser, mapSession } from '@/utils/mappers';

export async function handleLogin(ctx: ValidatedContext<LoginInput>, config: BloomAuthConfig): Promise<GenericResponse> {
  const validate = composeMiddleware(
    (ctx) => checkRateLimit('login', ctx, config),
    validateRequest(LoginSchema)
  );

  const error = await validate(ctx);
  if (error) return error;

  const { email, password } = ctx.validatedData!;
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

  return json({
    message: 'Login successful',
    user: mappedUser,
    session: mappedSession
  }, {
    sessionData: {
      userId: mappedUser.id,
      sessionId: sessionId,
    }
  });
}
