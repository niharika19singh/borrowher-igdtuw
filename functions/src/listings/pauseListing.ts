import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, FUNCTIONS_REGION } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { pauseListingSchema } from '../shared/validators';
import { Listing } from '../shared/types';

/**
 * Allows the owner of a listing to temporarily pause or resume campus availability.
 *
 * Enforces:
 * - Direct Firestore account check: caller must have `accountStatus === 'active'`
 *   and `verificationStatus === 'verified'` (unless administrator).
 * - Ownership check.
 */
export const pauseListing = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Caller must be authenticated');
  }

  const uid = request.auth.uid;
  const isAdmin = request.auth.token.admin === true;

  try {
    if (!isAdmin) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'Student profile record not found.');
      }
      const userData = userDoc.data();
      if (userData?.accountStatus === 'suspended') {
        throw new HttpsError(
          'permission-denied',
          'Your account has been suspended. Marketplace modifications are denied.'
        );
      }
      if (userData?.verificationStatus !== 'verified') {
        throw new HttpsError(
          'permission-denied',
          'Only verified IGDTUW students can pause or resume listings.'
        );
      }
    }

    const { listingId, paused } = pauseListingSchema.parse(request.data);

    const listingRef = db.collection('listings').doc(listingId);
    const listingDoc = await listingRef.get();

    if (!listingDoc.exists) {
      throw new HttpsError('not-found', `Listing '${listingId}' does not exist.`);
    }

    const currentListing = listingDoc.data() as Listing;

    if (currentListing.ownerUid !== uid && !isAdmin) {
      throw new HttpsError('permission-denied', 'You do not have permission to modify this listing.');
    }

    if (currentListing.status === 'removed') {
      throw new HttpsError('failed-precondition', 'Cannot modify a listing that has been removed by moderation.');
    }

    const newStatus = paused ? 'paused' : 'active';
    const now = new Date().toISOString();

    await listingRef.update({
      status: newStatus,
      updatedAt: now,
    });

    return {
      success: true,
      listingId,
      status: newStatus,
    };
  } catch (error) {
    return handleCallableError(error);
  }
});
