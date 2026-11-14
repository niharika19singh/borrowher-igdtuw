import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import * as admin from 'firebase-admin';
import { getListing } from '../../functions/src/listings/getListing';
import { createListing } from '../../functions/src/listings/createListing';
import { updateListing } from '../../functions/src/listings/updateListing';
import { pauseListing } from '../../functions/src/listings/pauseListing';

const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-borrowher';

describe('Listing Account Validation & getListing Hardening Integration Tests', () => {
  let db: admin.firestore.Firestore;

  beforeAll(async () => {
    process.env.FIREBASE_PROJECT_ID = projectId;
    if (admin.apps.length === 0) {
      admin.initializeApp({ projectId });
    }
    db = admin.firestore();
  });

  const activeStudentUid = 'student_ananya_active';
  const otherStudentUid = 'student_priya_active';
  const suspendedOwnerUid = 'student_suspended_owner';
  const rejectedStudentUid = 'student_rejected_stale';
  const pendingStudentUid = 'student_pending_stale';
  const malformedStudentUid = 'student_malformed_status';
  const adminUid = 'admin_super_user';

  const activeListingId = 'listing_calc_fx991';
  const pausedListingId = 'listing_drafter_paused';

  beforeEach(async () => {
    // Seed users
    const now = new Date().toISOString();

    // 1. Active & verified students
    await db.collection('users').doc(activeStudentUid).set({
      uid: activeStudentUid,
      displayName: 'Ananya Sharma',
      email: 'ananya@igdtuw.ac.in',
      accountStatus: 'active',
      verificationStatus: 'verified',
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('users').doc(otherStudentUid).set({
      uid: otherStudentUid,
      displayName: 'Priya Patel',
      email: 'priya@igdtuw.ac.in',
      accountStatus: 'active',
      verificationStatus: 'verified',
      createdAt: now,
      updatedAt: now,
    });

    // 2. Suspended student who owns a listing (testing that ownership cannot bypass verification)
    await db.collection('users').doc(suspendedOwnerUid).set({
      uid: suspendedOwnerUid,
      displayName: 'Suspended Owner',
      email: 'suspended_owner@igdtuw.ac.in',
      accountStatus: 'suspended',
      verificationStatus: 'verified', // Stale claim
      createdAt: now,
      updatedAt: now,
    });

    // 3. Rejected student with stale token claim
    await db.collection('users').doc(rejectedStudentUid).set({
      uid: rejectedStudentUid,
      displayName: 'Rejected Student',
      email: 'rejected@igdtuw.ac.in',
      accountStatus: 'active',
      verificationStatus: 'rejected',
      createdAt: now,
      updatedAt: now,
    });

    // 4. Pending student with stale token claim
    await db.collection('users').doc(pendingStudentUid).set({
      uid: pendingStudentUid,
      displayName: 'Pending Student',
      email: 'pending@igdtuw.ac.in',
      accountStatus: 'active',
      verificationStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    // 5. User with missing/malformed account status
    await db.collection('users').doc(malformedStudentUid).set({
      uid: malformedStudentUid,
      displayName: 'Malformed Student',
      email: 'malformed@igdtuw.ac.in',
      accountStatus: 'deactivated', // Unexpected status
      verificationStatus: 'verified',
      createdAt: now,
      updatedAt: now,
    });

    // Seed listings
    await db.collection('listings').doc(activeListingId).set({
      listingId: activeListingId,
      ownerUid: suspendedOwnerUid,
      title: 'Casio Scientific Calculator fx-991EX',
      description: 'Used for semester 2 engineering maths. Great condition.',
      categoryId: 'electronics-calculators',
      condition: 'like-new',
      imagePaths: ['listing-images/sample.jpg'],
      mode: 'borrow',
      pricePerDay: 15,
      depositAmount: 500,
      minDays: 1,
      maxDays: 14,
      pickupZoneIds: ['admin-block-foyer'],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('listings').doc(pausedListingId).set({
      listingId: pausedListingId,
      ownerUid: activeStudentUid,
      title: 'Rotary Mini Drafter with Clamp',
      description: 'Engineering drawing drafter.',
      categoryId: 'lab-project-equipment',
      condition: 'good',
      imagePaths: ['listing-images/sample.jpg'],
      mode: 'borrow',
      pricePerDay: 20,
      depositAmount: 400,
      minDays: 2,
      maxDays: 30,
      pickupZoneIds: ['admin-block-foyer'],
      status: 'paused',
      createdAt: now,
      updatedAt: now,
    });

    // Seed public profile for owner
    await db.collection('publicProfiles').doc(suspendedOwnerUid).set({
      uid: suspendedOwnerUid,
      displayName: 'Suspended Owner',
      photoURL: null,
      verificationBadge: true,
      completedBorrowCount: 2,
      ratingSummary: { averageRating: 4.5, totalReviews: 2 },
    });
  });

  // ===========================================================================
  // getListing HARDENED AUTHORIZATION TESTS
  // ===========================================================================
  describe('getListing Authorization Hardening', () => {
    it('rejects unauthenticated callers', async () => {
      await expect(
        (getListing as any).run({ auth: null, data: { listingId: activeListingId } })
      ).rejects.toThrow('Caller must be authenticated');
    });

    it('rejects caller whose user document does not exist in Firestore', async () => {
      await expect(
        (getListing as any).run({
          auth: { uid: 'nonexistent_user', token: { verifiedStudent: true } },
          data: { listingId: activeListingId },
        })
      ).rejects.toThrow('Student profile record not found');
    });

    it('rejects caller with stale verifiedStudent claim when accountStatus is suspended', async () => {
      await expect(
        (getListing as any).run({
          auth: { uid: suspendedOwnerUid, token: { verifiedStudent: true } },
          data: { listingId: activeListingId },
        })
      ).rejects.toThrow('Your account has been suspended. Marketplace item access is denied.');
    });

    it('does not allow suspended student to bypass verification merely because they own the listing', async () => {
      // The suspended user is the registered owner of activeListingId
      await expect(
        (getListing as any).run({
          auth: { uid: suspendedOwnerUid, token: { verifiedStudent: true } },
          data: { listingId: activeListingId },
        })
      ).rejects.toThrow('Your account has been suspended. Marketplace item access is denied.');
    });

    it('rejects caller with stale verifiedStudent claim when verificationStatus is rejected in Firestore', async () => {
      await expect(
        (getListing as any).run({
          auth: { uid: rejectedStudentUid, token: { verifiedStudent: true } },
          data: { listingId: activeListingId },
        })
      ).rejects.toThrow('Only verified IGDTUW students can access full marketplace item details.');
    });

    it('rejects caller with stale verifiedStudent claim when verificationStatus is pending in Firestore', async () => {
      await expect(
        (getListing as any).run({
          auth: { uid: pendingStudentUid, token: { verifiedStudent: true } },
          data: { listingId: activeListingId },
        })
      ).rejects.toThrow('Only verified IGDTUW students can access full marketplace item details.');
    });

    it('rejects caller when accountStatus is malformed or unexpected in Firestore', async () => {
      await expect(
        (getListing as any).run({
          auth: { uid: malformedStudentUid, token: { verifiedStudent: true } },
          data: { listingId: activeListingId },
        })
      ).rejects.toThrow('Your account status is invalid or inactive. Marketplace item access is denied.');
    });

    it('allows an active, verified student to retrieve active listing details', async () => {
      const res = await (getListing as any).run({
        auth: { uid: otherStudentUid, token: { verifiedStudent: true } },
        data: { listingId: activeListingId },
      });

      expect(res.listing).toBeDefined();
      expect(res.listing.listingId).toBe(activeListingId);
      expect(res.lenderProfile).toBeDefined();
      expect(res.lenderProfile.displayName).toBe('Suspended Owner');
    });

    it('denies active verified student from accessing paused listing owned by someone else', async () => {
      await expect(
        (getListing as any).run({
          auth: { uid: otherStudentUid, token: { verifiedStudent: true } },
          data: { listingId: pausedListingId }, // owned by activeStudentUid, status: paused
        })
      ).rejects.toThrow('This listing is not currently active on the campus marketplace.');
    });

    it('allows active verified student owner to view their own paused listing', async () => {
      const res = await (getListing as any).run({
        auth: { uid: activeStudentUid, token: { verifiedStudent: true } },
        data: { listingId: pausedListingId }, // owned by activeStudentUid
      });

      expect(res.listing).toBeDefined();
      expect(res.listing.status).toBe('paused');
    });

    it('allows platform administrator to view any listing without student verification claims', async () => {
      const res = await (getListing as any).run({
        auth: { uid: adminUid, token: { admin: true } },
        data: { listingId: pausedListingId },
      });

      expect(res.listing).toBeDefined();
      expect(res.listing.listingId).toBe(pausedListingId);
    });
  });

  // ===========================================================================
  // STRICT ACCOUNT STATUS VALIDATION ON LISTING MUTATIONS
  // ===========================================================================
  describe('Listing Mutation Strict Account Status Enforcement', () => {
    it('createListing rejects caller with suspended accountStatus', async () => {
      await expect(
        (createListing as any).run({
          auth: { uid: suspendedOwnerUid, token: { verifiedStudent: true } },
          data: {
            title: 'Lab Coat Size M',
            description: 'Cotton chemistry lab coat in great shape.',
            categoryId: 'lab-project-equipment',
            condition: 'good',
            imagePaths: ['listing-images/coat.jpg'],
            mode: 'borrow',
            pricePerDay: 10,
            depositAmount: 100,
            minDays: 1,
            maxDays: 7,
            pickupZoneIds: ['admin-block-foyer'],
          },
        })
      ).rejects.toThrow('Your account has been suspended. Marketplace listing creation is denied.');
    });

    it('createListing rejects caller with malformed accountStatus', async () => {
      await expect(
        (createListing as any).run({
          auth: { uid: malformedStudentUid, token: { verifiedStudent: true } },
          data: {
            title: 'Lab Coat Size M',
            description: 'Cotton chemistry lab coat in great shape.',
            categoryId: 'lab-project-equipment',
            condition: 'good',
            imagePaths: ['listing-images/coat.jpg'],
            mode: 'borrow',
            pricePerDay: 10,
            depositAmount: 100,
            minDays: 1,
            maxDays: 7,
            pickupZoneIds: ['admin-block-foyer'],
          },
        })
      ).rejects.toThrow('Your account status is invalid or inactive. Marketplace listing creation is denied.');
    });

    it('updateListing rejects non-admin caller with suspended accountStatus', async () => {
      await expect(
        (updateListing as any).run({
          auth: { uid: suspendedOwnerUid, token: { verifiedStudent: true } },
          data: {
            listingId: activeListingId,
            title: 'Updated Title Attempt',
          },
        })
      ).rejects.toThrow('Your account has been suspended. Marketplace modifications are denied.');
    });

    it('updateListing rejects non-admin caller with malformed accountStatus', async () => {
      await expect(
        (updateListing as any).run({
          auth: { uid: malformedStudentUid, token: { verifiedStudent: true } },
          data: {
            listingId: activeListingId,
            title: 'Updated Title Attempt',
          },
        })
      ).rejects.toThrow('Your account status is invalid or inactive. Marketplace modifications are denied.');
    });

    it('pauseListing rejects non-admin caller with suspended accountStatus', async () => {
      await expect(
        (pauseListing as any).run({
          auth: { uid: suspendedOwnerUid, token: { verifiedStudent: true } },
          data: {
            listingId: activeListingId,
            paused: true,
          },
        })
      ).rejects.toThrow('Your account has been suspended. Marketplace modifications are denied.');
    });

    it('pauseListing rejects non-admin caller with malformed accountStatus', async () => {
      await expect(
        (pauseListing as any).run({
          auth: { uid: malformedStudentUid, token: { verifiedStudent: true } },
          data: {
            listingId: activeListingId,
            paused: true,
          },
        })
      ).rejects.toThrow('Your account status is invalid or inactive. Marketplace modifications are denied.');
    });
  });

  // ===========================================================================
  // PARTIAL LISTING UPDATE & MERGED STATE VALIDATION (updateListing)
  // ===========================================================================
  describe('Partial Listing Update & Merged State Validation (updateListing)', () => {
    const updateTestListingId = 'listing_update_test_1';
    const freePeerTestListingId = 'listing_update_test_free';

    beforeEach(async () => {
      const now = new Date().toISOString();
      // Rental listing: minDays 2, maxDays 7, pricePerDay 25
      await db.collection('listings').doc(updateTestListingId).set({
        listingId: updateTestListingId,
        ownerUid: activeStudentUid,
        title: 'Original Drafter Title',
        description: 'Original description of the drafting kit.',
        categoryId: 'lab-project-equipment',
        condition: 'good',
        imagePaths: ['listing-images/orig.jpg'],
        mode: 'rental',
        pricePerDay: 25,
        depositAmount: 300,
        minDays: 2,
        maxDays: 7,
        pickupZoneIds: ['admin-block-foyer'],
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });

      // Free peer listing: minDays 1, maxDays 5, pricePerDay 0
      await db.collection('listings').doc(freePeerTestListingId).set({
        listingId: freePeerTestListingId,
        ownerUid: activeStudentUid,
        title: 'Free Engineering Textbook',
        description: 'Free peer lending for semester reference.',
        categoryId: 'academic-books',
        condition: 'like-new',
        imagePaths: ['listing-images/book.jpg'],
        mode: 'free_peer',
        pricePerDay: 0,
        depositAmount: 100,
        minDays: 1,
        maxDays: 5,
        pickupZoneIds: ['admin-block-foyer'],
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
    });

    it('rejects updating minDays alone beyond existing maxDays', async () => {
      // Existing maxDays is 7. Updating minDays alone to 10 makes maxDays (7) < minDays (10)
      try {
        await (updateListing as any).run({
          auth: { uid: activeStudentUid, token: { verifiedStudent: true } },
          data: {
            listingId: updateTestListingId,
            minDays: 10,
          },
        });
        expect.fail('Should have thrown validation error');
      } catch (err: any) {
        expect(err.code).toBe('invalid-argument');
        expect(err.message).toBe('Validation failed');
        expect(
          err.details?.issues?.some((i: any) =>
            i.message.includes('Maximum borrow days must be greater than or equal to minimum borrow days')
          )
        ).toBe(true);
      }
    });

    it('rejects updating maxDays below existing minDays', async () => {
      // Existing minDays is 2. Updating maxDays alone to 1 makes maxDays (1) < minDays (2)
      try {
        await (updateListing as any).run({
          auth: { uid: activeStudentUid, token: { verifiedStudent: true } },
          data: {
            listingId: updateTestListingId,
            maxDays: 1,
          },
        });
        expect.fail('Should have thrown validation error');
      } catch (err: any) {
        expect(err.code).toBe('invalid-argument');
        expect(err.message).toBe('Validation failed');
        expect(
          err.details?.issues?.some((i: any) =>
            i.message.includes('Maximum borrow days must be greater than or equal to minimum borrow days')
          )
        ).toBe(true);
      }
    });

    it('rejects switching rental to free_peer without resetting price', async () => {
      // Existing listing is rental with pricePerDay: 25. Updating mode alone leaves price > 0
      try {
        await (updateListing as any).run({
          auth: { uid: activeStudentUid, token: { verifiedStudent: true } },
          data: {
            listingId: updateTestListingId,
            mode: 'free_peer',
          },
        });
        expect.fail('Should have thrown validation error');
      } catch (err: any) {
        expect(err.code).toBe('invalid-argument');
        expect(err.message).toBe('Validation failed');
        expect(
          err.details?.issues?.some((i: any) =>
            i.message.includes('Price per day must be 0 for free peer lending mode')
          )
        ).toBe(true);
      }
    });

    it('rejects updating price while mode is free_peer', async () => {
      // Existing listing is free_peer. Updating pricePerDay to 15 violates free_peer constraint
      try {
        await (updateListing as any).run({
          auth: { uid: activeStudentUid, token: { verifiedStudent: true } },
          data: {
            listingId: freePeerTestListingId,
            pricePerDay: 15,
          },
        });
        expect.fail('Should have thrown validation error');
      } catch (err: any) {
        expect(err.code).toBe('invalid-argument');
        expect(err.message).toBe('Validation failed');
        expect(
          err.details?.issues?.some((i: any) =>
            i.message.includes('Price per day must be 0 for free peer lending mode')
          )
        ).toBe(true);
      }
    });

    it('accepts valid partial updates (title, minDays, and mode switch with price reset)', async () => {
      // 1. Update title alone
      const titleRes = await (updateListing as any).run({
        auth: { uid: activeStudentUid, token: { verifiedStudent: true } },
        data: {
          listingId: updateTestListingId,
          title: 'Brand New Drafter Title',
        },
      });
      expect(titleRes.title).toBe('Brand New Drafter Title');
      expect(titleRes.pricePerDay).toBe(25); // preserved

      // 2. Update minDays within existing maxDays (4 <= 7)
      const daysRes = await (updateListing as any).run({
        auth: { uid: activeStudentUid, token: { verifiedStudent: true } },
        data: {
          listingId: updateTestListingId,
          minDays: 4,
        },
      });
      expect(daysRes.minDays).toBe(4);
      expect(daysRes.maxDays).toBe(7);

      // 3. Switch rental to free_peer with pricePerDay: 0
      const freeRes = await (updateListing as any).run({
        auth: { uid: activeStudentUid, token: { verifiedStudent: true } },
        data: {
          listingId: updateTestListingId,
          mode: 'free_peer',
          pricePerDay: 0,
        },
      });
      expect(freeRes.mode).toBe('free_peer');
      expect(freeRes.pricePerDay).toBe(0);
    });
  });
});
