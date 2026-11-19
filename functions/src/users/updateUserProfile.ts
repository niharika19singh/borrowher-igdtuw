import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, FUNCTIONS_REGION } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { updateUserProfileSchema } from '../shared/validators';
import { UserProfile } from '../shared/types';

/**
 * Updates elective student profile fields (displayName, programme, year).
 * Strictly forbids client-side mutation of verificationStatus, accountStatus, email, or uid.
 */
export const updateUserProfile = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to update profile');
  }

  try {
    const validatedData = updateUserProfileSchema.parse(request.data);
    const uid = request.auth.uid;
    const userDocRef = db.collection('users').doc(uid);
    const publicDocRef = db.collection('publicProfiles').doc(uid);

    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User profile not found. Please initialize your profile first.');
    }

    const currentData = userDoc.data() as UserProfile;
    if (currentData.accountStatus === 'suspended') {
      throw new HttpsError('permission-denied', 'Account is suspended. Profile updates are not permitted.');
    }

    const now = new Date().toISOString();
    const updates: Partial<UserProfile> = {
      updatedAt: now,
    };

    if (validatedData.displayName !== undefined) {
      updates.displayName = validatedData.displayName;
    }
    if (validatedData.programme !== undefined) {
      updates.programme = validatedData.programme;
    }
    if (validatedData.year !== undefined) {
      updates.year = validatedData.year;
    }

    const batch = db.batch();
    batch.update(userDocRef, updates);

    // If displayName was updated, sync to public profile
    if (validatedData.displayName !== undefined) {
      batch.update(publicDocRef, {
        displayName: validatedData.displayName,
      });
    }

    await batch.commit();

    return {
      success: true,
      uid,
      updates,
    };
  } catch (error) {
    return handleCallableError(error);
  }
});
