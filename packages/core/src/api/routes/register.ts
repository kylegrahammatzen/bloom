import type { BloomAuthConfig, GenericResponse, ValidatedContext } from '@/schemas';
import { User as UserModel, UserCredentials, Session as SessionModel, Token } from '@/models';
import { hashPassword, generateSecureToken, hashToken, generateSessionId, normalizeEmail } from '@/utils/crypto';
import { APIError, APIErrorCode } from '@/schemas/errors';
import { json } from '@/utils/response';
import { checkRateLimit } from '@/api/ratelimit';
import { validateRequest, composeMiddleware } from '@/validation';
import { RegisterSchema, type RegisterInput } from '@/schemas/auth';
import { emitCallback } from '@/api/callbacks';
import { mapUser, mapSession } from '@/utils/mappers';
import { parseUserAgent } from '@/utils/user-agent';

export async function handleRegister(ctx: ValidatedContext<RegisterInput>, config: BloomAuthConfig): Promise<GenericResponse> {
  const validate = composeMiddleware(
    (ctx) => checkRateLimit('registration', ctx, config),
    validateRequest(RegisterSchema)
  );

  const error = await validate(ctx);
  if (error) return error;

  const { email, password } = ctx.validatedData!;
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

  const userAgentString = ctx.request.userAgent || ctx.request.headers?.['user-agent'] as string | undefined;
  const deviceInfo = parseUserAgent(userAgentString);

  const sessionId = generateSessionId();
  const session = new SessionModel({
    session_id: sessionId,
    user_id: user._id,
    expires_at: new Date(Date.now() + (config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000)),
    user_agent: userAgentString,
    ip_address: ctx.request.ip,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device_type: deviceInfo.deviceType,
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

  return json({
    message: 'Registration successful',
    user: mappedUser,
    session: mappedSession
  }, {
    status: 201,
    sessionData: {
      userId: mappedUser.id,
      sessionId: sessionId,
    }
  });
}
