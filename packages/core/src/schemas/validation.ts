import type { BloomHandlerContext } from './handler';
import type { GenericResponse } from './api';

/**
 * Request context with validated data from Zod schemas
 */
export type ValidatedContext<T = unknown> = BloomHandlerContext & {
  validatedData?: T;
};

/**
 * Validation middleware function signature
 */
export type ValidationMiddleware<T = unknown> = (
  context: ValidatedContext<T>
) => Promise<GenericResponse | null> | GenericResponse | null;
