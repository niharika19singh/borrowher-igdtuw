import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth, FUNCTIONS_REGION } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { UserProfile, PublicProfile, EnsureUserProfileResponse } from '../shared/types';

/**
 * Idempotent server-side user-profile initialization.
 *
 * Rules:
 * - Strictly verifies caller authentication.
 * - NEVER accepts client-supplied role, verificationStatus or admin claims.
 * - Creates private profile in `users/{uid}` and public profile in `publicProfiles/{uid}`.
 * - Idempotently returns existing profiles if already initialized.
 */
export const ensureUserProfile = onCall(
  { region: FUNCTIONS_REGION },
  async (request): Promise<EnsureUserProfileResponse> => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Caller must be authenticated to initialize profile');
  }

  try {
    const uid = request.auth.uid;
    const email = request.auth.token.email || '';
    const userDocRef = db.collection('users').doc(uid);
    const publicDocRef = db.collection('publicProfiles').doc(uid);

    const userDoc = await userDocRef.get();
    const now = new Date().toISOString();

    if (userDoc.exists) {
      const publicDoc = await publicDocRef.get();
      return {
        user: userDoc.data() as UserProfile,
        publicProfile: publicDoc.exists ? (publicDoc.data() as PublicProfile) : {
          uid,
          displayName: userDoc.data()?.displayName || 'IGDTUW Student',
          photoURL: null,
          verificationBadge: userDoc.data()?.verificationStatus === 'verified',
          completedBorrowCount: 0,
          ratingSummary: { averageRating: 0, totalReviews: 0 },
        },
        isNewUser: false,
      };
    }

    // Attempt to get user record from Auth for displayName
    let displayName = 'IGDTUW Student';
    let photoURL: string | null = null;
    try {
      const authUser = await auth.getUser(uid);
      if (authUser.displayName) displayName = authUser.displayName;
      if (authUser.photoURL) photoURL = authUser.photoURL;
    } catch {
      // Fallback to token details if getUser fails in test/emulator
      if (request.auth.token.name) displayName = String(request.auth.token.name);
    }

    const newUserProfile: UserProfile = {
      uid,
      displayName,
      email,
      verificationStatus: 'pending', // Always start as pending; requires admin approval
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const newPublicProfile: PublicProfile = {
      uid,
      displayName,
      photoURL,
      verificationBadge: false,
      completedBorrowCount: 0,
      ratingSummary: {
        averageRating: 0,
        totalReviews: 0,
      },
    };

    // Atomically write both private and public profile records
    const batch = db.batch();
    batch.set(userDocRef, newUserProfile);
    batch.set(publicDocRef, newPublicProfile);
    await batch.commit();

    return {
      user: newUserProfile,
      publicProfile: newPublicProfile,
      isNewUser: true,
    };
  } catch (error) {
    return handleCallableError(error);
  }
});
