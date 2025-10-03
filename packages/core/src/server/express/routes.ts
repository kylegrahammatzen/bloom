import type { Application } from 'express';
import express from 'express';
import { APIError, APIErrorCode } from '@/types/errors';

export function setupHealthRoute(app: Application) {
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'bloom-auth-server',
      version: '1.0.0'
    });
  });
}

export function setupErrorHandler(app: Application) {
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (!(err instanceof APIError)) {
      console.error('Error:', err);
    }

    const apiError = err instanceof APIError
      ? err
      : new APIError(APIErrorCode.INTERNAL_ERROR);

    const response = apiError.toResponse();
    res.status(response.status).json(response.body);
  });
}
