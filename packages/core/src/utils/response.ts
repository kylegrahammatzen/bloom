import type { GenericResponse } from '../types';

export function createSuccess(status: number, body: any, sessionData?: { userId: string; sessionId: string }, clearSession?: boolean): GenericResponse {
  return {
    status,
    body,
    ...(sessionData && { sessionData }),
    ...(clearSession && { clearSession })
  };
}
