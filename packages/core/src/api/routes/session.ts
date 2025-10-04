import type { BloomHandlerContext, GenericResponse, BloomAuthConfig } from '@/schemas';
import { User as UserModel, Session as SessionModel } from '@/models';
import { APIError, APIErrorCode } from '@/schemas/errors';
import { json } from '@/utils/response';
import { mapUser, mapSession } from '@/utils/mappers';

export async function handleGetSession(ctx: BloomHandlerContext): Promise<GenericResponse> {
  if (!ctx.session?.userId) {
    return new APIError(APIErrorCode.NOT_AUTHENTICATED).toResponse();
  }

  const user = await UserModel.findById(ctx.session.userId);
  if (!user) {
    return new APIError(APIErrorCode.USER_NOT_FOUND).toResponse();
  }

  const userSession = await SessionModel.findOne({ session_id: ctx.session.sessionId });
  if (!userSession) {
    return new APIError(APIErrorCode.SESSION_NOT_FOUND).toResponse();
  }

  if (userSession.isExpired()) {
    return new APIError(APIErrorCode.SESSION_EXPIRED).toResponse();
  }

  return json({
    user: mapUser(user),
    session: mapSession(userSession),
  });
}

export async function handleGetAllSessions(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  if (!ctx.session?.userId) {
    return new APIError(APIErrorCode.NOT_AUTHENTICATED).toResponse();
  }

  const sessions = await SessionModel.find({
    user_id: ctx.session.userId
  }).sort({ last_accessed: -1 });

  const mappedSessions = sessions.map(session =>
    mapSession(
      session,
      undefined,
      session.session_id === ctx.session?.sessionId
    )
  );

  return json({ sessions: mappedSessions });
}

export async function handleRevokeSession(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  if (!ctx.session?.userId) {
    return new APIError(APIErrorCode.NOT_AUTHENTICATED).toResponse();
  }

  const sessionId = ctx.request.body?.sessionId;

  if (!sessionId || typeof sessionId !== 'string') {
    return new APIError(APIErrorCode.INVALID_INPUT).toResponse();
  }

  const sessionToRevoke = await SessionModel.findOne({ session_id: sessionId });

  if (!sessionToRevoke) {
    return new APIError(APIErrorCode.SESSION_NOT_FOUND).toResponse();
  }

  if (sessionToRevoke.user_id.toString() !== ctx.session.userId) {
    return new APIError(APIErrorCode.UNAUTHORIZED).toResponse();
  }

  if (sessionId === ctx.session.sessionId) {
    return new APIError(APIErrorCode.INVALID_INPUT, 'Cannot revoke current session. Use logout instead.').toResponse();
  }

  await SessionModel.deleteOne({ session_id: sessionId });

  return json({ message: 'Session revoked successfully' });
}
