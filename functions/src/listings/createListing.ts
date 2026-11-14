import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, FUNCTIONS_REGION } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { createListingSchema } from '../shared/validators';
import { Listing } from '../shared/types';

/**
 * Creates a new marketplace listing.
 *
 * Enforces:
 * - Direct Firestore account check: caller must have `accountStatus === 'active'`
 *   and `verificationStatus === 'verified'` (never relies solely on cached token claims).
 * - Input validation (title, description, price, condition, borrow limits).
 * - Verifies category exists and is currently active.
 * - Verifies all selected pickup zones are confirmed approved campus points (approvalStatus === 'approved' && active === true).
 * - Assigns ownerUid directly from authenticated context (never client-provided).
 */
export const createListing = onCall(
  { region: FUNCTIONS_REGION },
  async (request): Promise<Listing> => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to create a listing');
  }

  const uid = request.auth.uid;

  try {
    // 1. Authoritative server check against Firestore user profile
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Student profile record not found. Please register first.');
    }

    const userData = userDoc.data();
    if (userData?.accountStatus !== 'active' || userData?.verificationStatus !== 'verified') {
      if (userData?.accountStatus === 'suspended') {
        throw new HttpsError(
          'permission-denied',
          'Your account has been suspended. Marketplace listing creation is denied.'
        );
      }
      if (userData?.verificationStatus !== 'verified') {
        throw new HttpsError(
          'permission-denied',
          'Only verified IGDTUW students can publish marketplace listings. Please complete student verification.'
        );
      }
      throw new HttpsError(
        'permission-denied',
        'Your account status is invalid or inactive. Marketplace listing creation is denied.'
      );
    }

    // 2. Validate input
    const input = createListingSchema.parse(request.data);

    // 3. Verify category existence and active state
    const categoryDoc = await db.collection('categories').doc(input.categoryId).get();
    if (!categoryDoc.exists || categoryDoc.data()?.active !== true) {
      throw new HttpsError(
        'invalid-argument',
        `Category '${input.categoryId}' is either invalid or inactive.`
      );
    }

    // 4. Verify pickup zones exist and are officially approved
    const zoneRefs = input.pickupZoneIds.map((id) => db.collection('pickupZones').doc(id));
    const zoneSnapshots = await db.getAll(...zoneRefs);
    for (let i = 0; i < zoneSnapshots.length; i++) {
      const snap = zoneSnapshots[i];
      if (
        !snap.exists ||
        snap.data()?.active !== true ||
        snap.data()?.approvalStatus !== 'approved'
      ) {
        throw new HttpsError(
          'invalid-argument',
          `Pickup zone '${input.pickupZoneIds[i]}' is not an approved campus location (currently pending review or inactive).`
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
