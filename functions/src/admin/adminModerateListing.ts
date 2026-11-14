import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, FUNCTIONS_REGION } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { adminModerateListingSchema } from '../shared/validators';

/**
 * Admin action to moderate or remove an unsafe or rule-violating marketplace listing.
 */
export const adminModerateListing = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Admin authentication required');
  }

  if (request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Only administrators can moderate listings');
  }

  try {
    const { listingId, status, moderationReason } = adminModerateListingSchema.parse(request.data);

    const listingRef = db.collection('listings').doc(listingId);
    const listingDoc = await listingRef.get();

    if (!listingDoc.exists) {
      throw new HttpsError('not-found', `Listing ${listingId} not found`);
    }

    const now = new Date().toISOString();

    const batch = db.batch();
    batch.update(listingRef, {
      status,
      moderationReason,
      updatedAt: now,
    });

    const auditRef = db.collection('auditLogs').doc();
    batch.set(auditRef, {
      logId: auditRef.id,
      actorUid: request.auth.uid,
      action: 'MODERATE_LISTING',
      targetType: 'listing',
      targetId: listingId,
      metadata: {
        newStatus: status,
        moderationReason,
        previousStatus: listingDoc.data()?.status,
        ownerUid: listingDoc.data()?.ownerUid,
      },
      timestamp: now,
    });

    await batch.commit();

    return {
      success: true,
      listingId,
      status,
    };
  } catch (error) {
    return handleCallableError(error);
  }
});
