import type { ZodSchema, ZodError } from 'zod';
import type { ValidatedContext, ValidationMiddleware } from '@/schemas/validation';
import { APIError, APIErrorCode } from '@/schemas/errors';

/**
 * Creates a validation middleware from a Zod schema
 */
export function validateRequest<T>(
  schema: ZodSchema<T>
): ValidationMiddleware<T> {
  return (context: ValidatedContext<T>) => {
    const result = schema.safeParse(context.request.body);

    if (!result.success) {
      const issues = formatZodError(result.error);
      return new APIError(APIErrorCode.INVALID_REQUEST, issues).toResponse();
    }

    context.validatedData = result.data;
    return null;
  };
}

/**
 * Formats Zod validation errors into a user-friendly structure
 */
function formatZodError(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map(issue => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));
}

/**
 * Composes multiple middleware functions, short-circuits on first error
 */
export function composeMiddleware(
  ...middlewares: Array<ValidationMiddleware<any>>
): ValidationMiddleware<any> {
  return async (context: ValidatedContext<any>) => {
    for (const middleware of middlewares) {
      const result = await middleware(context);
      if (result) return result;
    }
    return null;
  };
}
