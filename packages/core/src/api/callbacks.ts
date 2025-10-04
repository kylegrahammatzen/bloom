import type { BloomAuthConfig, User, Session } from '@/schemas';

type CallbackContext = {
  action: string;
  endpoint: string;
  ip?: string;
  userId?: string;
  email?: string;
  user?: User;
  session?: Session;
  details?: any;
};

export async function emitCallback(type: keyof NonNullable<BloomAuthConfig['callbacks']>, context: CallbackContext, config: BloomAuthConfig) {
  const callback = config.callbacks?.[type];
  if (callback) {
    await callback(context as any);
  }

  if (config.callbacks?.onAuthEvent && type !== 'onAuthEvent') {
    await config.callbacks.onAuthEvent({
      action: context.action,
      userId: context.userId,
      email: context.email,
      endpoint: context.endpoint,
      ip: context.ip
    });
  }
}
