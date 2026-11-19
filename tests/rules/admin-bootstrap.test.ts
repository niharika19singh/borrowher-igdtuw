import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import * as admin from 'firebase-admin';
import { bootstrapAdmin } from '../../scripts/bootstrap-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-borrowher';

describe('Admin Bootstrap Integration Test Suite', () => {
  let auth: admin.auth.Auth;
  let db: admin.firestore.Firestore;

  beforeAll(async () => {
    process.env.FIREBASE_PROJECT_ID = projectId;
    if (admin.apps.length === 0) {
      admin.initializeApp({ projectId });
    }
    auth = admin.auth();
    db = admin.firestore();
  });

  afterAll(async () => {
    // Clean up
  });

  it('rejects bootstrap when explicit project ID is omitted and no environment variable is set', async () => {
    const savedProject = process.env.FIREBASE_PROJECT_ID;
    const savedGcloud = process.env.GCLOUD_PROJECT;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.GCLOUD_PROJECT;

    await expect(
      bootstrapAdmin({
        targetEmail: 'admin@igdtuw.ac.in',
        confirmed: true,
      })
    ).rejects.toThrow('Firebase Project ID is required');

    if (savedProject) process.env.FIREBASE_PROJECT_ID = savedProject;
    if (savedGcloud) process.env.GCLOUD_PROJECT = savedGcloud;
  });

  it('rejects provisioning when target Firebase Auth account does not exist', async () => {
    await expect(
      bootstrapAdmin({
        targetEmail: 'nonexistent-admin@igdtuw.ac.in',
        confirmed: true,
        projectId,
      })
    ).rejects.toThrow('Firebase Auth account not found');
  });

  it('rejects provisioning when candidate email is not verified', async () => {
    const unverifiedEmail = 'unverified-candidate@igdtuw.ac.in';
    let unverifiedUser: admin.auth.UserRecord;
    try {
      unverifiedUser = await auth.getUserByEmail(unverifiedEmail);
    } catch {
      unverifiedUser = await auth.createUser({
        email: unverifiedEmail,
        emailVerified: false, // NOT verified
        displayName: 'Unverified Candidate',
      });
    }

    await expect(
      bootstrapAdmin({
        targetEmail: unverifiedEmail,
        confirmed: true,
        projectId,
      })
    ).rejects.toThrow('email address has not been verified');
  });

  it('successfully provisions an existing, verified candidate account with neutral reputation', async () => {
    const candidateEmail = 'authorized-faculty@igdtuw.ac.in';
    let candidateUser: admin.auth.UserRecord;
    try {
      candidateUser = await auth.getUserByEmail(candidateEmail);
    } catch {
      candidateUser = await auth.createUser({
        email: candidateEmail,
        emailVerified: true, // Verified
        displayName: 'Dr. Faculty Admin',
      });
    }

    const result = await bootstrapAdmin({
      targetEmail: candidateEmail,
      confirmed: true,
      projectId,
    });

    expect(result.uid).toBe(candidateUser.uid);
    expect(result.claims.admin).toBe(true);
    expect(result.claims.verifiedStudent).toBe(true);

    // Verify Auth Custom Claims
    const updatedUser = await auth.getUser(candidateUser.uid);
    expect(updatedUser.customClaims?.admin).toBe(true);
    expect(updatedUser.customClaims?.verifiedStudent).toBe(true);

    // Verify Firestore Private Profile
    const userDoc = await db.collection('users').doc(candidateUser.uid).get();
    expect(userDoc.exists).toBe(true);
    expect(userDoc.data()?.verificationStatus).toBe('verified');
    expect(userDoc.data()?.accountStatus).toBe('active');

    // Verify Public Profile (neutral rating, zero reviews)
    const publicDoc = await db.collection('publicProfiles').doc(candidateUser.uid).get();
    expect(publicDoc.exists).toBe(true);
    expect(publicDoc.data()?.verificationBadge).toBe(true);
    expect(publicDoc.data()?.ratingSummary?.averageRating).toBe(0.0); // Neutral, NOT 5.0
    expect(publicDoc.data()?.ratingSummary?.totalReviews).toBe(0);

    // Verify Audit Log
    const auditLogs = await db
      .collection('auditLogs')
      .where('targetId', '==', candidateUser.uid)
      .where('action', '==', 'BOOTSTRAP_INITIAL_ADMIN')
      .get();
    expect(auditLogs.empty).toBe(false);
  });
});
