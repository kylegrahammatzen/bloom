import type { BloomHandlerContext, GenericResponse } from '../../types';
import { User as UserModel, Session as SessionModel } from '../../models';
import { APIError, APIErrorCode } from '../../types/errors';
import { APIResponse } from '../../utils/response';
import { mapUser, mapSession } from '../../utils/mappers';

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

  return APIResponse.success({
    user: mapUser(user),
    session: mapSession(userSession),
  });
}
