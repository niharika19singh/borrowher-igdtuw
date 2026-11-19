import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, FUNCTIONS_REGION } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { Listing, PublicProfile } from '../shared/types';

export interface GetListingResponse {
  listing: Listing;
  lenderProfile: PublicProfile | null;
}

/**
 * Retrieves detailed listing information along with the lender's public reputation summary.
 */
export const getListing = onCall(
  { region: FUNCTIONS_REGION },
  async (request): Promise<GetListingResponse> => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Caller must be authenticated');
  }

  const listingId = String(request.data?.listingId || '').trim();
  if (!listingId) {
    throw new HttpsError('invalid-argument', 'Listing ID is required');
  }

  try {
    const listingDoc = await db.collection('listings').doc(listingId).get();
    if (!listingDoc.exists) {
      throw new HttpsError('not-found', `Listing '${listingId}' does not exist`);
    }

    const listing = listingDoc.data() as Listing;
    const isOwner = request.auth.uid === listing.ownerUid;
    const isAdmin = request.auth.token.admin === true;

    // Authoritative verification check:
    // Administrators retain moderation access.
    // For all students (including the listing owner), fetch caller's live Firestore
    // user document and require accountStatus === 'active' AND verificationStatus === 'verified'.
    // Stale verifiedStudent token claims and ownership never bypass this check.
    if (!isAdmin) {
      const userDoc = await db.collection('users').doc(request.auth.uid).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'Student profile record not found.');
      }

      const userData = userDoc.data();
      if (userData?.accountStatus !== 'active' || userData?.verificationStatus !== 'verified') {
        if (userData?.accountStatus === 'suspended') {
          throw new HttpsError(
            'permission-denied',
            'Your account has been suspended. Marketplace item access is denied.'
          );
        }
        if (userData?.verificationStatus !== 'verified') {
          throw new HttpsError(
            'permission-denied',
            'Only verified IGDTUW students can access full marketplace item details.'
          );
        }
        throw new HttpsError(
          'permission-denied',
          'Your account status is invalid or inactive. Marketplace item access is denied.'
        );
      }
    }

    // Check visibility permissions: active listings are visible to verified students;
    // non-active listings (paused, draft, removed) are restricted to owner and administrators.
    if (listing.status !== 'active' && !isOwner && !isAdmin) {
      throw new HttpsError(
        'permission-denied',
        'This listing is not currently active on the campus marketplace.'
      );
    }

    // Fetch lender's public profile
    const publicProfileDoc = await db.collection('publicProfiles').doc(listing.ownerUid).get();
    const lenderProfile = publicProfileDoc.exists ? (publicProfileDoc.data() as PublicProfile) : null;

    return {
      listing,
      lenderProfile,
    };
  } catch (error) {
    return handleCallableError(error);
  }
});
