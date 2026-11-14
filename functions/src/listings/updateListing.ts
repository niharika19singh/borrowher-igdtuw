import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, FUNCTIONS_REGION } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { updateListingSchema, validateMergedListingState } from '../shared/validators';
import { Listing } from '../shared/types';

/**
 * Updates an existing listing owned by the caller.
 *
 * Enforces:
 * - Direct Firestore account check: caller must have `accountStatus === 'active'`
 *   and `verificationStatus === 'verified'` (unless administrator).
 * - Caller must be the registered owner of the listing.
 * - Cannot modify listings that have been removed by moderation.
 * - Validates input and referenced category / approved pickup zones.
 * - Protects server-managed fields (ownerUid, createdAt, moderationReason).
 */
export const updateListing = onCall(
  { region: FUNCTIONS_REGION },
  async (request): Promise<Listing> => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Caller must be authenticated to update listing');
  }

  const uid = request.auth.uid;
  const isAdmin = request.auth.token.admin === true;

  try {
    // 1. Authoritative check on student account status if not an admin override
    if (!isAdmin) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'Student profile record not found.');
      }
      const userData = userDoc.data();
      if (userData?.accountStatus !== 'active' || userData?.verificationStatus !== 'verified') {
        if (userData?.accountStatus === 'suspended') {
          throw new HttpsError(
            'permission-denied',
            'Your account has been suspended. Marketplace modifications are denied.'
          );
        }
        if (userData?.verificationStatus !== 'verified') {
          throw new HttpsError(
            'permission-denied',
            'Only verified IGDTUW students can modify marketplace listings.'
          );
        }
        throw new HttpsError(
          'permission-denied',
          'Your account status is invalid or inactive. Marketplace modifications are denied.'
        );
      }
    }

    const input = updateListingSchema.parse(request.data);
    const listingRef = db.collection('listings').doc(input.listingId);

    // Execute read-validate-write atomically within a Firestore transaction
    const updatedListing = await db.runTransaction(async (transaction) => {
      // 1. Read current listing inside transaction
      const listingDoc = await transaction.get(listingRef);

      // 2. Perform existence, ownership and moderation checks
      if (!listingDoc.exists) {
        throw new HttpsError('not-found', `Listing '${input.listingId}' does not exist.`);
      }

      const currentListing = listingDoc.data() as Listing;

      // Check ownership
      if (currentListing.ownerUid !== uid && !isAdmin) {
        throw new HttpsError('permission-denied', 'You do not have permission to update this listing.');
      }

      // Check moderation status
      if (currentListing.status === 'removed') {
        throw new HttpsError(
          'failed-precondition',
          'This listing has been removed by moderation and cannot be modified.'
        );
      }

      // 3. Build complete merged listing state using existing validateMergedListingState()
      // 4. Validate maxDays >= minDays and all pricing invariants against transaction's latest document state
      const validatedMerged = validateMergedListingState(currentListing, input);

      // 5. Perform category and pickup-zone existence/approval reads inside the transaction when necessary
      if (input.categoryId && input.categoryId !== currentListing.categoryId) {
        const categoryRef = db.collection('categories').doc(input.categoryId);
        const categoryDoc = await transaction.get(categoryRef);
        if (!categoryDoc.exists || categoryDoc.data()?.active !== true) {
          throw new HttpsError('invalid-argument', `Category '${input.categoryId}' is invalid.`);
        }
      }

      if (input.pickupZoneIds) {
        const zoneRefs = input.pickupZoneIds.map((id) => db.collection('pickupZones').doc(id));
        const zoneSnapshots = await transaction.getAll(...zoneRefs);
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
      }

      // 6. Ensure every transaction read happens before any transaction write
      // 7. Commit partial field updates using transaction.update()
      // 8. Preserve all server-managed field protections
      const now = new Date().toISOString();
      const updates: Partial<Listing> = {
        updatedAt: now,
      };

      if (input.title !== undefined) updates.title = validatedMerged.title;
      if (input.description !== undefined) updates.description = validatedMerged.description;
      if (input.categoryId !== undefined) updates.categoryId = validatedMerged.categoryId;
      if (input.condition !== undefined) updates.condition = validatedMerged.condition;
      if (input.imagePaths !== undefined) updates.imagePaths = validatedMerged.imagePaths;
      if (input.mode !== undefined) updates.mode = validatedMerged.mode;
      if (input.pricePerDay !== undefined) updates.pricePerDay = validatedMerged.pricePerDay;
      if (input.depositAmount !== undefined) updates.depositAmount = validatedMerged.depositAmount;
      if (input.minDays !== undefined) updates.minDays = validatedMerged.minDays;
      if (input.maxDays !== undefined) updates.maxDays = validatedMerged.maxDays;
      if (input.pickupZoneIds !== undefined) updates.pickupZoneIds = validatedMerged.pickupZoneIds;
      if (input.status !== undefined) updates.status = validatedMerged.status;

      transaction.update(listingRef, updates);

      return {
        ...currentListing,
        ...updates,
      };
    });

    return updatedListing;
  } catch (error) {
    return handleCallableError(error);
  }
});
