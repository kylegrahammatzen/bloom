import { Request, Response, NextFunction } from 'express';

type CustomError = Error & {
  status?: number;
  statusCode?: number;
};

/**
 * Express error handling middleware
 * @param err - Error object with optional status codes
 * @param req - Express request object
 * @param res - Express response object
 * @param _next - Express next function (required for error handler recognition)
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('Error details:', {
      status,
      message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};