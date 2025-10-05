import type { BloomAuthConfig, BloomHandlerContext } from '@/schemas';
import { checkRateLimit as checkLimit, trackAttempt } from '@/utils/rateLimit';
import { APIError, APIErrorCode } from '@/schemas/errors';

type RateLimitEndpoint = 'login' | 'registration' | 'passwordReset' | 'emailVerification';

export async function checkRateLimit(
  endpoint: RateLimitEndpoint,
  ctx: BloomHandlerContext,
  config: BloomAuthConfig
) {
  if (!config.rateLimit?.enabled || !config.rateLimit[endpoint]) return null;

  const rateLimitConfig = config.rateLimit[endpoint];
  if (!rateLimitConfig?.max || !rateLimitConfig?.window) return null;

  const rateLimitKey = `${endpoint}:${ctx.request.ip || 'unknown'}`;
  const rateLimit = await checkLimit(rateLimitKey, {
    max: rateLimitConfig.max,
    window: rateLimitConfig.window
  }, config.secondaryStorage);

  if (rateLimit.isLimited) {
    if (config.callbacks?.onRateLimit) {
      await config.callbacks.onRateLimit({
        ip: ctx.request.ip || 'unknown',
        endpoint: `/${endpoint}`,
        limit: { max: rateLimitConfig.max, window: rateLimitConfig.window },
        userId: ctx.session?.userId
      });
    }

    return new APIError(APIErrorCode.RATE_LIMITED, { resetAt: rateLimit.resetAt }).toResponse();
  }

  await trackAttempt(rateLimitKey, config.secondaryStorage);
  return null;
}
