import { z } from 'zod';

/**
 * Session cookie data schema for runtime validation
 */
export const SessionCookieDataSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
}).passthrough();

/**
 * Session cookie data structure stored in HTTP-only cookies
 */
export type SessionCookieData = z.infer<typeof SessionCookieDataSchema>;

/**
 * Type guard to validate session data at runtime
 */
export function isValidSessionData(data: any): data is SessionCookieData {
  const result = SessionCookieDataSchema.safeParse(data);
  return result.success;
}

/**
 * Safely parse and validate session cookie data
 */
export function parseSessionCookie(cookieValue: string): SessionCookieData | null {
  try {
    const data = JSON.parse(cookieValue);
    const result = SessionCookieDataSchema.safeParse(data);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
