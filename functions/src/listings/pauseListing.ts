import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { pauseListingSchema } from '../shared/validators';
import { Listing } from '../shared/types';

/**
 * Allows the owner of a listing to temporarily pause or resume campus availability.
 */
export const pauseListing = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Caller must be authenticated');
  }

  const uid = request.auth.uid;

  try {
    const { listingId, paused } = pauseListingSchema.parse(request.data);

    const listingRef = db.collection('listings').doc(listingId);
    const listingDoc = await listingRef.get();

    if (!listingDoc.exists) {
      throw new HttpsError('not-found', `Listing '${listingId}' does not exist.`);
    }

    const currentListing = listingDoc.data() as Listing;

    if (currentListing.ownerUid !== uid && request.auth.token.admin !== true) {
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
