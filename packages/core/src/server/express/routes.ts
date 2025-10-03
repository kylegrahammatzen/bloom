import type { Application } from 'express';
import express from 'express';

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
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  });
}
