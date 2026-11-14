import { HttpsError } from 'firebase-functions/v2/https';
import { ZodError } from 'zod';

export function createError(
  code:
    | 'unauthenticated'
    | 'permission-denied'
    | 'invalid-argument'
    | 'not-found'
    | 'already-exists'
    | 'failed-precondition'
    | 'internal',
  message: string,
  details?: unknown
): HttpsError {
  return new HttpsError(code, message, details);
}

export function handleCallableError(error: unknown): never {
  if (error instanceof HttpsError || (error && (error as any).name === 'HttpsError') || (error && typeof (error as any).code === 'string' && (error as any).details !== undefined)) {
    throw error;
  }

  if (error instanceof ZodError || (error && (error as any).name === 'ZodError')) {
    const issues = (error as ZodError).issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    throw new HttpsError('invalid-argument', 'Validation failed', { issues });
  }

  const errMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  // Avoid leaking private/stack information in production
  throw new HttpsError('internal', errMessage);
}
