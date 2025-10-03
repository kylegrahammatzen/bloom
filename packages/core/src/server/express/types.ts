import 'express-session';

type SessionDataExtension = {
  userId?: string;
  sessionId?: string;
};

declare module 'express-session' {
  interface SessionData extends SessionDataExtension {}
}
