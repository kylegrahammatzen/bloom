import type { GenericResponse } from '@/types';

export class APIResponse {
  static success(body: any, sessionData?: { userId: string; sessionId: string }): GenericResponse {
    return {
      status: 200,
      body,
      ...(sessionData && { sessionData })
    };
  }

  static created(body: any, sessionData?: { userId: string; sessionId: string }): GenericResponse {
    return {
      status: 201,
      body,
      ...(sessionData && { sessionData })
    };
  }

  static logout(message: string = 'Logout successful'): GenericResponse {
    return {
      status: 200,
      body: { message },
      clearSession: true
    };
  }
}

export function createSuccess(status: number, body: any, sessionData?: { userId: string; sessionId: string }, clearSession?: boolean): GenericResponse {
  return {
    status,
    body,
    ...(sessionData && { sessionData }),
    ...(clearSession && { clearSession })
  };
}
