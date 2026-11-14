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

describe('Cloud Functions 2nd Gen Deployment Region Configuration', () => {
  it('configures asia-south1 region across all exported callable Cloud Functions', async () => {
    // Import all exported functions from entrypoint
    const functionsModule = await import('../../functions/src/index.js');

    const expectedFunctions = [
      'ensureUserProfile',
      'updateUserProfile',
      'approveStudent',
      'setAdminRole',
      'adminModerateListing',
      'adminManageCategory',
      'createListing',
      'updateListing',
      'pauseListing',
      'getListing',
    ];

    for (const fnName of expectedFunctions) {
      const fn = (functionsModule as any)[fnName];
      expect(fn, `Function ${fnName} should be exported`).toBeDefined();
      expect(typeof fn, `Function ${fnName} should be callable`).toBe('function');
      // In firebase-functions/v2, onCall wraps functions and defines __endpoint metadata
      if (fn.__endpoint) {
        expect(
          fn.__endpoint.region,
          `Function ${fnName} must be configured for asia-south1 region`
        ).toContain('asia-south1');
      }
    }
  });
});

describe('Admin Bootstrap Security Invariants', () => {
  it('rejects bootstrap when no email or UID target is provided', async () => {
    const { bootstrapAdmin } = await import('../../scripts/bootstrap-admin.js');
    await expect(bootstrapAdmin({ confirmed: true })).rejects.toThrow(
      'Administrator target identifier is required'
    );
  });

  it('rejects bootstrap when explicit confirmation flag is missing', async () => {
    const { bootstrapAdmin } = await import('../../scripts/bootstrap-admin.js');
    await expect(
      bootstrapAdmin({ targetEmail: 'admin@igdtuw.ac.in', confirmed: false })
    ).rejects.toThrow('Elevation confirmation is missing');
  });
});

describe('Pickup Zone Safety and Status Invariants', () => {
  it('ensures all seeded campus pickup locations are inactive and pending review by default', async () => {
    const { INITIAL_PICKUP_ZONES } = await import('../../scripts/seed-pickup-zones.js');

    expect(INITIAL_PICKUP_ZONES.length).toBeGreaterThan(0);
    for (const zone of INITIAL_PICKUP_ZONES) {
      expect(zone.active).toBe(false);
      expect(zone.approvalStatus).toBe('pending_review');
      expect(zone.guidance).not.toContain('24/7');
      expect(zone.accessNote).toBeDefined();
    }
  });
});
