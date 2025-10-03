import type { BloomAuthConfig, BloomHandlerContext, GenericResponse } from '@/types';
import { User as UserModel, UserCredentials, Session as SessionModel, Token } from '@/models';
import { APIError, APIErrorCode } from '@/types/errors';
import { APIResponse } from '@/utils/response';
import { emitCallback } from '@/api/callbacks';

export async function handleDeleteAccount(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  if (!ctx.session?.userId) {
    return new APIError(APIErrorCode.NOT_AUTHENTICATED).toResponse();
  }

  const userId = ctx.session.userId;

  const user = await UserModel.findById(userId);
  if (!user) {
    return new APIError(APIErrorCode.USER_NOT_FOUND).toResponse();
  }

  await emitCallback('onAccountDelete', {
    action: 'account_delete',
    endpoint: '/account',
    ip: ctx.request.ip,
    userId,
    email: user.email
  }, config);

  await SessionModel.deleteMany({ user_id: userId });
  await Token.deleteMany({ user_id: userId });
  await UserCredentials.deleteOne({ user_id: userId });
  await UserModel.findByIdAndDelete(userId);

  return APIResponse.logout('Account deleted successfully');
}
