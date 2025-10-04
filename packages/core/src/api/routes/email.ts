import type { BloomAuthConfig, BloomHandlerContext, GenericResponse } from '@/schemas';
import { User as UserModel, Token } from '@/models';
import { hashToken } from '@/utils/crypto';
import { APIError, APIErrorCode } from '@/schemas/errors';
import { json } from '@/utils/response';
import { emitCallback } from '@/api/callbacks';
import { mapUser } from '@/utils/mappers';

export async function handleVerifyEmail(ctx: BloomHandlerContext, config: BloomAuthConfig): Promise<GenericResponse> {
  const { token } = ctx.request.body;

  if (!token) {
    return new APIError(APIErrorCode.TOKEN_REQUIRED).toResponse();
  }

  const tokenHash = hashToken(token);
  const verificationToken = await Token.findOne({
    token_hash: tokenHash,
    type: 'email_verification',
  });

  if (!verificationToken || !verificationToken.isValid()) {
    return new APIError(APIErrorCode.INVALID_TOKEN).toResponse();
  }

  const user = await UserModel.findById(verificationToken.user_id);
  if (!user) {
    return new APIError(APIErrorCode.USER_NOT_FOUND).toResponse();
  }

  user.email_verified = true;
  await user.save();
  await verificationToken.markAsUsed();

  await emitCallback('onEmailVerify', {
    action: 'email_verify',
    endpoint: '/verify-email',
    ip: ctx.request.ip,
    userId: user._id.toString(),
    email: user.email
  }, config);

  return json({
    message: 'Email verified successfully',
    user: mapUser(user),
  });
}
