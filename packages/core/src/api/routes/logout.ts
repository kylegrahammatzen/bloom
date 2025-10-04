import type { BloomAuthConfig, BloomHandlerContext, GenericResponse } from '@/schemas';
import { Session as SessionModel, User as UserModel } from '@/models';
import { json } from '@/utils/response';
import { emitCallback } from '@/api/callbacks';

export async function handleLogout(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const userId = ctx.session?.userId;

  const user = userId ? await UserModel.findById(userId) : null;

  if (ctx.session?.sessionId) {
    await SessionModel.deleteOne({ session_id: ctx.session.sessionId });
  }

  if (userId) {
    await emitCallback('onSignOut', {
      action: 'logout',
      endpoint: '/logout',
      ip: ctx.request.ip,
      userId,
      email: user?.email
    }, config);
  }

  return json({ message: 'Logout successful' }, { clearSession: true });
}
