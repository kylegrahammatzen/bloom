import type { BloomAuthConfig, BloomHandlerContext, GenericResponse } from '../../types';
import { Session as SessionModel } from '../../models';
import { APIResponse } from '../../utils/response';
import { emitCallback } from '../callbacks';

export async function handleLogout(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const userId = ctx.session?.userId;

  if (ctx.session?.sessionId) {
    await SessionModel.deleteOne({ session_id: ctx.session.sessionId });
  }

  if (userId) {
    await emitCallback('onSignOut', {
      action: 'logout',
      endpoint: '/logout',
      ip: ctx.request.ip,
      userId
    }, config);
  }

  return APIResponse.logout();
}
