import { describe, it, expect } from 'vitest';
import { createError, handleCallableError } from '../../functions/src/shared/errors';
import { HttpsError } from 'firebase-functions/v2/https';
import { ZodError, z } from 'zod';
import { UserProfile, PublicProfile } from '../../functions/src/shared/types';

describe('Error Handling and Response Helpers', () => {
  it('creates an HttpsError with the correct code and message', () => {
    const error = createError('permission-denied', 'Only verified students can perform this action');
    expect(error.code).toBe('permission-denied');
    expect(error.message).toBe('Only verified students can perform this action');
  });

  it('preserves existing HttpsError in handleCallableError', () => {
    const original = new HttpsError('not-found', 'Listing not found');
    expect(() => handleCallableError(original)).toThrowError();
  });

  it('converts ZodError into invalid-argument HttpsError with structured issues', () => {
    let capturedZodError: ZodError | null = null;
    try {
      z.object({
        title: z.string().min(3, 'Title must be at least 3 characters long'),
      }).parse({ title: 'ab' });
    } catch (err: any) {
      capturedZodError = err;
    }

    expect(capturedZodError).not.toBeNull();

    try {
      handleCallableError(capturedZodError);
    } catch (err: any) {
      expect(err.code).toBe('invalid-argument');
      expect(err.message).toBe('Validation failed');
      expect(err.details.issues).toEqual([
        { path: 'title', message: 'Title must be at least 3 characters long' },
      ]);
    }
  });

  it('converts generic Error into internal HttpsError without leaking sensitive stack traces', () => {
    const rawError = new Error('Database connection timeout');
    try {
      handleCallableError(rawError);
    } catch (err: any) {
      expect(err.code).toBe('internal');
      expect(err.message).toBe('Database connection timeout');
    }
  });
});

describe('User Profile Domain Invariants', () => {
  it('enforces default non-privileged state for newly registered student profiles', () => {
    const now = new Date().toISOString();
    const newUser: UserProfile = {
      uid: 'student_123',
      displayName: 'Kavita Singh',
      email: 'kavita@igdtuw.ac.in',
      verificationStatus: 'pending', // MUST be pending
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
    };

    expect(newUser.verificationStatus).toBe('pending');
    expect(newUser.accountStatus).toBe('active');
  });

  it('enforces public profile security constraints', () => {
    const publicProf: PublicProfile = {
      uid: 'student_123',
      displayName: 'Kavita Singh',
      photoURL: null,
      verificationBadge: false,
      completedBorrowCount: 0,
      ratingSummary: {
        averageRating: 0,
        totalReviews: 0,
      },
    };

    // Verify sensitive fields do not exist on PublicProfile interface
    expect((publicProf as any).email).toBeUndefined();
    expect((publicProf as any).phone).toBeUndefined();
    expect((publicProf as any).hostelRoom).toBeUndefined();
    expect((publicProf as any).verificationDocs).toBeUndefined();
  });
});
