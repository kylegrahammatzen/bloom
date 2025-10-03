export enum APIErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  RATE_LIMITED = 'RATE_LIMITED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  TOKEN_REQUIRED = 'TOKEN_REQUIRED',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED',
  ENDPOINT_NOT_FOUND = 'ENDPOINT_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

const ERROR_CONFIG: Record<APIErrorCode, { status: number; message: string }> = {
  [APIErrorCode.INVALID_CREDENTIALS]: { status: 401, message: 'Invalid credentials' },
  [APIErrorCode.NOT_AUTHENTICATED]: { status: 401, message: 'Not authenticated' },
  [APIErrorCode.EMAIL_ALREADY_EXISTS]: { status: 409, message: 'An account with this email already exists' },
  [APIErrorCode.USER_NOT_FOUND]: { status: 404, message: 'User not found' },
  [APIErrorCode.INVALID_EMAIL]: { status: 400, message: 'Invalid email format' },
  [APIErrorCode.WEAK_PASSWORD]: { status: 400, message: 'Password does not meet security requirements' },
  [APIErrorCode.ACCOUNT_LOCKED]: { status: 423, message: 'Account is temporarily locked' },
  [APIErrorCode.INVALID_TOKEN]: { status: 400, message: 'Invalid or expired token' },
  [APIErrorCode.RATE_LIMITED]: { status: 429, message: 'Too many attempts, please try again later' },
  [APIErrorCode.SESSION_NOT_FOUND]: { status: 404, message: 'Session not found' },
  [APIErrorCode.TOKEN_REQUIRED]: { status: 400, message: 'Token is required' },
  [APIErrorCode.PASSWORD_REQUIRED]: { status: 400, message: 'Password must be between 8 and 256 characters' },
  [APIErrorCode.ENDPOINT_NOT_FOUND]: { status: 404, message: 'Endpoint not found' },
  [APIErrorCode.INVALID_REQUEST]: { status: 400, message: 'Malformed request body' },
  [APIErrorCode.INTERNAL_ERROR]: { status: 500, message: 'Internal server error' },
}

export class APIError {
  constructor(public code: APIErrorCode, public details?: any) {}

  toResponse() {
    const config = ERROR_CONFIG[this.code];
    return {
      status: config.status,
      body: {
        error: {
          code: this.code,
          message: config.message,
          ...(this.details && { details: this.details })
        }
      }
    }
  }
}
