import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../middleware/errorHandler';
import { rateLimiter, loginRateLimiter } from '../middleware/rateLimiter';

type CustomError = Error & {
  status?: number;
  statusCode?: number;
};

describe('Middleware Functions', () => {
  describe('errorHandler', () => {
    let mockRequest: Request;
    let mockResponse: Response;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        url: '/test',
        method: 'GET',
      } as Request;

      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      nextFunction = vi.fn();
    });

    it('should handle errors with status code', () => {
      const error: CustomError = new Error('Test error');
      error.status = 404;

      errorHandler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors with statusCode property', () => {
      const error: CustomError = new Error('Test error');
      error.statusCode = 400;

      errorHandler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should default to status 500 for errors without status', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should return error response with message', () => {
      const error = new Error('Test error message');

      errorHandler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Test error message',
          status: 500,
        },
      });
    });

    it('should include stack trace in non-production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: 'Error stack trace',
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Test error',
          status: 500,
        },
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('rateLimiter middleware', () => {
    it('should be a function', () => {
      expect(typeof rateLimiter).toBe('function');
    });

    it('should be a middleware function with 3 parameters', () => {
      expect(rateLimiter.length).toBe(3);
    });
  });

  describe('loginRateLimiter middleware', () => {
    it('should be a function', () => {
      expect(typeof loginRateLimiter).toBe('function');
    });

    it('should be a middleware function with 3 parameters', () => {
      expect(loginRateLimiter.length).toBe(3);
    });
  });
});