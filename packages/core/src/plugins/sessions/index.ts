import type { BloomPlugin, BloomAuth, ApiMethodParams, Session } from '@/schemas';
import { Session as SessionModel } from '@/models';
import { parseSessionCookie } from '@/schemas/session';
import { mapSession } from '@/utils/mappers';
import { APIError, APIErrorCode } from '@/schemas/errors';
import mongoose from 'mongoose';

/**
 * Sessions plugin - provides multi-session management
 * Adds auth.api.sessions.getAll() and auth.api.sessions.revoke()
 */
export const sessions = (): BloomPlugin => {
  return {
    name: 'sessions',
    init: (auth: BloomAuth) => {
      const cookieName = auth.config.session?.cookieName || 'bloom.sid';

      auth.api.sessions = {
        /**
         * Get all sessions for the authenticated user
         */
        getAll: async (params: ApiMethodParams): Promise<Session[]> => {
          const cookieValue = params.headers?.['cookie'] || params.headers?.['Cookie'];

          if (!cookieValue || typeof cookieValue !== 'string') {
            throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
          }

          const cookies = parseCookies(cookieValue);
          const sessionCookie = cookies[cookieName];

          if (!sessionCookie) {
            throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
          }

          const sessionData = parseSessionCookie(sessionCookie);
          if (!sessionData) {
            throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
          }

          // Find all sessions for this user
          const sessionDocs = await SessionModel.find({
            user_id: new mongoose.Types.ObjectId(sessionData.userId)
          }).sort({ last_accessed: -1 });

          if (!sessionDocs || sessionDocs.length === 0) {
            return [];
          }

          // Map sessions with isCurrent flag
          return sessionDocs.map(session =>
            mapSession(
              session,
              undefined,
              session.session_id === sessionData.sessionId
            )
          );
        },

        /**
         * Revoke a specific session
         */
        revoke: async (params: ApiMethodParams): Promise<{ message: string }> => {
          const cookieValue = params.headers?.['cookie'] || params.headers?.['Cookie'];
          const sessionIdToRevoke = params.body?.sessionId;

          if (!sessionIdToRevoke || typeof sessionIdToRevoke !== 'string') {
            throw new APIError(APIErrorCode.INVALID_INPUT);
          }

          if (!cookieValue || typeof cookieValue !== 'string') {
            throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
          }

          const cookies = parseCookies(cookieValue);
          const sessionCookie = cookies[cookieName];

          if (!sessionCookie) {
            throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
          }

          const sessionData = parseSessionCookie(sessionCookie);
          if (!sessionData) {
            throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
          }

          // Verify the session to revoke belongs to this user
          const sessionToRevoke = await SessionModel.findOne({
            session_id: sessionIdToRevoke
          });

          if (!sessionToRevoke) {
            throw new APIError(APIErrorCode.SESSION_NOT_FOUND);
          }

          if (!sessionToRevoke.user_id.equals(new mongoose.Types.ObjectId(sessionData.userId))) {
            throw new APIError(APIErrorCode.UNAUTHORIZED);
          }

          // Don't allow revoking the current session via this method
          if (sessionIdToRevoke === sessionData.sessionId) {
            throw new APIError(APIErrorCode.INVALID_INPUT, 'Cannot revoke current session. Use logout instead.');
          }

          await SessionModel.deleteOne({ session_id: sessionIdToRevoke });

          return { message: 'Session revoked successfully' };
        }
      };
    }
  };
};

/**
 * Simple cookie parser helper
 */
function parseCookies(cookieString: string): Record<string, string> {
  return cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
}
