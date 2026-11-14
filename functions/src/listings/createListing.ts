import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { createListingSchema } from '../shared/validators';
import { Listing } from '../shared/types';

/**
 * Creates a new marketplace listing.
 *
 * Enforces:
 * - Caller must be an authenticated student with active verification status.
 * - Input validation (title, description, price, condition, borrow limits).
 * - Verifies category exists and is currently active.
 * - Verifies all selected pickup zones are registered and active campus points.
 * - Assigns ownerUid directly from authenticated context (never client-provided).
 */
export const createListing = onCall(async (request): Promise<Listing> => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to create a listing');
  }

  const uid = request.auth.uid;

  try {
    // 1. Verify student verification status
    // Check custom claim first, then fallback to checking the user document
    const isVerifiedClaim = request.auth.token.verifiedStudent === true;
    if (!isVerifiedClaim) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data()?.verificationStatus !== 'verified') {
        throw new HttpsError(
          'permission-denied',
          'Only verified IGDTUW students can publish marketplace listings. Please complete verification.'
        );
      }
    }

    // 2. Validate input
    const input = createListingSchema.parse(request.data);

    // 3. Verify category existence
    const categoryDoc = await db.collection('categories').doc(input.categoryId).get();
    if (!categoryDoc.exists || categoryDoc.data()?.active !== true) {
      throw new HttpsError(
        'invalid-argument',
        `Category '${input.categoryId}' is either invalid or inactive.`
      );
    }

    // 4. Verify pickup zones exist
    const zoneRefs = input.pickupZoneIds.map((id) => db.collection('pickupZones').doc(id));
    const zoneSnapshots = await db.getAll(...zoneRefs);
    for (let i = 0; i < zoneSnapshots.length; i++) {
      const snap = zoneSnapshots[i];
      if (!snap.exists || snap.data()?.active !== true) {
        throw new HttpsError(
          'invalid-argument',
          `Pickup zone '${input.pickupZoneIds[i]}' is not an approved campus location.`
        );
      }
    }

    // 5. Create listing
    const listingRef = db.collection('listings').doc();
    const now = new Date().toISOString();

    const newListing: Listing = {
      listingId: listingRef.id,
      ownerUid: uid,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      condition: input.condition,
      imagePaths: input.imagePaths,
      mode: input.mode,
      pricePerDay: input.pricePerDay,
      depositAmount: input.depositAmount,
      minDays: input.minDays,
      maxDays: input.maxDays,
      pickupZoneIds: input.pickupZoneIds,
      status: input.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    await listingRef.set(newListing);

    return newListing;
  } catch (error) {
    return handleCallableError(error);
  }
});
