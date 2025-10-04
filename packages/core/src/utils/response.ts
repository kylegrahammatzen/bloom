import { GenericResponseSchema, type SessionCookieData } from '@/schemas';

export const json = (body: any, options?: {
  status?: number;
  sessionData?: SessionCookieData;
  clearSession?: boolean;
}) => {
  const response = {
    status: options?.status ?? 200,
    body,
    ...(options?.sessionData && { sessionData: options.sessionData }),
    ...(options?.clearSession && { clearSession: true }),
  };

  return GenericResponseSchema.parse(response);
};
