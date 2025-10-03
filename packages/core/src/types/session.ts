/**
 * Session cookie data structure stored in HTTP-only cookies
 */
export type SessionCookieData = {
  userId: string;
  sessionId: string;
};

/**
 * Type guard to validate session cookie data structure
 */
export function isValidSessionData(data: unknown): data is SessionCookieData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'userId' in data &&
    'sessionId' in data &&
    typeof (data as any).userId === 'string' &&
    typeof (data as any).sessionId === 'string' &&
    (data as any).userId.length > 0 &&
    (data as any).sessionId.length > 0
  );
}

/**
 * Safely parse and validate session cookie data
 * @param cookieValue - Raw cookie value string
 * @returns Validated session data or null if invalid
 */
export function parseSessionCookie(cookieValue: string): SessionCookieData | null {
  try {
    const data = JSON.parse(cookieValue);
    return isValidSessionData(data) ? data : null;
  } catch {
    return null;
  }
}
