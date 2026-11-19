import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'borrowher-rules-test';
const RULES_PATH = path.resolve(__dirname, '../../firestore.rules');

describe('Firestore Security Rules Test Suite', () => {
  beforeAll(async () => {
    const rules = fs.readFileSync(RULES_PATH, 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host: process.env.FIRESTORE_EMULATOR_HOST ? process.env.FIRESTORE_EMULATOR_HOST.split(':')[0] : '127.0.0.1',
        port: process.env.FIRESTORE_EMULATOR_HOST ? Number(process.env.FIRESTORE_EMULATOR_HOST.split(':')[1]) : 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  // ===========================================================================
  // 1. users/{uid} Private Profile Tests
  // ===========================================================================
  describe('users/{uid} Access Control', () => {
    const studentUid = 'student_sneha';
    const otherStudentUid = 'student_ananya';

    beforeEach(async () => {
      const adminDb = testEnv.authenticatedContext('admin_setup', { admin: true }).firestore();
      await adminDb.collection('users').doc(studentUid).set({
        uid: studentUid,
        displayName: 'Sneha Verma',
        email: 'sneha@igdtuw.ac.in',
        verificationStatus: 'pending',
        accountStatus: 'active',
        programme: 'B.Tech CSE',
        year: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    it('allows a student to read their own private profile', async () => {
      const studentDb = testEnv.authenticatedContext(studentUid).firestore();
      await assertSucceeds(studentDb.collection('users').doc(studentUid).get());
    });

    it('denies a student from reading another student private profile', async () => {
      const otherDb = testEnv.authenticatedContext(otherStudentUid).firestore();
      await assertFails(otherDb.collection('users').doc(studentUid).get());
    });

    it('denies unauthenticated read of private profiles', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('users').doc(studentUid).get());
    });

    it('allows administrator to read private user profiles', async () => {
      const adminDb = testEnv.authenticatedContext('admin_user', { admin: true }).firestore();
      await assertSucceeds(adminDb.collection('users').doc(studentUid).get());
    });

    it('denies direct client creation of user profile for non-admin students', async () => {
      const studentDb = testEnv.authenticatedContext('new_user').firestore();
      await assertFails(
        studentDb.collection('users').doc('new_user').set({
          uid: 'new_user',
          displayName: 'Hacker',
          email: 'hacker@igdtuw.ac.in',
          verificationStatus: 'verified',
          accountStatus: 'active',
        })
      );
    });

    it('allows student to update elective fields (displayName, programme, year)', async () => {
      const studentDb = testEnv.authenticatedContext(studentUid).firestore();
      await assertSucceeds(
        studentDb.collection('users').doc(studentUid).update({
          displayName: 'Sneha V.',
          programme: 'B.Tech AI',
          year: 4,
          updatedAt: new Date().toISOString(),
        })
      );
    });

    it('strictly denies student from tampering with verificationStatus or accountStatus', async () => {
      const studentDb = testEnv.authenticatedContext(studentUid).firestore();
      await assertFails(
        studentDb.collection('users').doc(studentUid).update({
          verificationStatus: 'verified',
        })
      );
      await assertFails(
        studentDb.collection('users').doc(studentUid).update({
          accountStatus: 'suspended',
        })
      );
    });
  });

  // ===========================================================================
  // 2. publicProfiles/{uid} Access Control & Suspended Account Enforcement
  // ===========================================================================
  describe('publicProfiles/{uid} Access Control', () => {
    const studentUid = 'student_pooja';
    const verifiedViewerUid = 'student_radha';
    const suspendedViewerUid = 'student_suspended';

    beforeEach(async () => {
      const adminDb = testEnv.authenticatedContext('admin_setup', { admin: true }).firestore();
      // Target public profile
      await adminDb.collection('publicProfiles').doc(studentUid).set({
        uid: studentUid,
        displayName: 'Pooja Rani',
        photoURL: null,
        verificationBadge: true,
        completedBorrowCount: 5,
        ratingSummary: { averageRating: 4.9, totalReviews: 8 },
      });

      // Active verified viewer profile
      await adminDb.collection('users').doc(verifiedViewerUid).set({
        uid: verifiedViewerUid,
        displayName: 'Radha Sharma',
        email: 'radha@igdtuw.ac.in',
        verificationStatus: 'verified',
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Suspended viewer profile (has stale verifiedStudent claim but accountStatus is suspended)
      await adminDb.collection('users').doc(suspendedViewerUid).set({
        uid: suspendedViewerUid,
        displayName: 'Suspended Student',
        email: 'suspended@igdtuw.ac.in',
        verificationStatus: 'suspended',
        accountStatus: 'suspended',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    it('allows active verified student to read public profile', async () => {
      const verifiedDb = testEnv
        .authenticatedContext(verifiedViewerUid, { verifiedStudent: true })
        .firestore();
      await assertSucceeds(verifiedDb.collection('publicProfiles').doc(studentUid).get());
    });

    it('denies unverified student from reading public profile', async () => {
      const unverifiedDb = testEnv.authenticatedContext('student_unverified').firestore();
      await assertFails(unverifiedDb.collection('publicProfiles').doc(studentUid).get());
    });

    it('denies suspended student with stale verifiedStudent claim from reading public profile', async () => {
      const suspendedDb = testEnv
        .authenticatedContext(suspendedViewerUid, { verifiedStudent: true })
        .firestore();
      await assertFails(suspendedDb.collection('publicProfiles').doc(studentUid).get());
    });

    it('denies student writes to public profiles', async () => {
      const studentDb = testEnv
        .authenticatedContext(verifiedViewerUid, { verifiedStudent: true })
        .firestore();
      await assertFails(
        studentDb.collection('publicProfiles').doc(studentUid).update({
          completedBorrowCount: 100,
        })
      );
    });
  });

  // ===========================================================================
  // 3. listings/{listingId} Strict Cloud-Function-Only Write Security
  // ===========================================================================
  describe('listings/{listingId} Access Control & Mutation Locking', () => {
    const ownerUid = 'lender_shreya';
    const borrowerUid = 'borrower_kavya';
    const suspendedUid = 'suspended_user';
    const listingId = 'listing_calc_001';

    const validListingData = {
      listingId,
      ownerUid,
      title: 'Scientific Calculator fx-991EX',
      description: 'Used for two semesters in MAE lab, fully working.',
      categoryId: 'electronics-calculators',
      condition: 'good',
      imagePaths: ['listing-images/lender_shreya/listing_calc_001/calc.jpg'],
      mode: 'rental',
      pricePerDay: 20,
      depositAmount: 400,
      minDays: 1,
      maxDays: 7,
      pickupZoneIds: ['admin-block-foyer'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    beforeEach(async () => {
      const adminDb = testEnv.authenticatedContext('admin_setup', { admin: true }).firestore();
      // Active verified owner
      await adminDb.collection('users').doc(ownerUid).set({
        uid: ownerUid,
        displayName: 'Shreya Patel',
        email: 'shreya@igdtuw.ac.in',
        verificationStatus: 'verified',
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Active verified borrower
      await adminDb.collection('users').doc(borrowerUid).set({
        uid: borrowerUid,
        displayName: 'Kavya Jain',
        email: 'kavya@igdtuw.ac.in',
        verificationStatus: 'verified',
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Suspended student
      await adminDb.collection('users').doc(suspendedUid).set({
        uid: suspendedUid,
        displayName: 'Suspended User',
        email: 'suspended@igdtuw.ac.in',
        verificationStatus: 'suspended',
        accountStatus: 'suspended',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Seed listing with security rules disabled (simulating Firebase Admin SDK Cloud Function write)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('listings').doc(listingId).set(validListingData);
      });
    });

    it('allows verified active student to read an active listing', async () => {
      const verifiedDb = testEnv
        .authenticatedContext(borrowerUid, { verifiedStudent: true })
        .firestore();
      await assertSucceeds(verifiedDb.collection('listings').doc(listingId).get());
    });

    it('denies unverified student from reading marketplace listings', async () => {
      const unverifiedDb = testEnv.authenticatedContext('unverified_student').firestore();
      await assertFails(unverifiedDb.collection('listings').doc(listingId).get());
    });

    it('denies suspended student with stale token claim from reading active listings', async () => {
      const suspendedDb = testEnv
        .authenticatedContext(suspendedUid, { verifiedStudent: true })
        .firestore();
      await assertFails(suspendedDb.collection('listings').doc(listingId).get());
    });

    it('allows listing owner to read their own listing even if inactive/paused', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('listings').doc(listingId).update({ status: 'paused' });
      });

      const ownerDb = testEnv.authenticatedContext(ownerUid).firestore();
      await assertSucceeds(ownerDb.collection('listings').doc(listingId).get());
    });

    it('strictly denies direct client-side listing creation (must use createListing function)', async () => {
      const ownerDb = testEnv
        .authenticatedContext(ownerUid, { verifiedStudent: true })
        .firestore();
      const newListingId = 'direct_client_listing';
      await assertFails(
        ownerDb.collection('listings').doc(newListingId).set({
          ...validListingData,
          listingId: newListingId,
        })
      );
    });

    it('strictly denies direct client-side listing update (must use updateListing function)', async () => {
      const ownerDb = testEnv
        .authenticatedContext(ownerUid, { verifiedStudent: true })
        .firestore();
      await assertFails(
        ownerDb.collection('listings').doc(listingId).update({
          pricePerDay: 50,
        })
      );
    });

    it('strictly denies direct client-side listing deletion (must use adminModerateListing)', async () => {
      const ownerDb = testEnv
        .authenticatedContext(ownerUid, { verifiedStudent: true })
        .firestore();
      await assertFails(ownerDb.collection('listings').doc(listingId).delete());
    });

    it('strictly denies direct client-side listing mutations even from administrator client SDK', async () => {
      const adminClientDb = testEnv.authenticatedContext('admin1', { admin: true }).firestore();
      await assertFails(
        adminClientDb.collection('listings').doc('admin_direct_listing').set({
          ...validListingData,
          listingId: 'admin_direct_listing',
        })
      );
    });
  });

  // ===========================================================================
  // 4. categories & pickupZones Access Control
  // ===========================================================================
  describe('categories & pickupZones Access Control', () => {
    const verifiedUid = 'verified_student_1';
    const suspendedUid = 'suspended_student_1';

    beforeEach(async () => {
      const adminDb = testEnv.authenticatedContext('admin_setup', { admin: true }).firestore();
      await adminDb.collection('categories').doc('academic-books').set({
        name: 'Academic & Books',
        active: true,
      });
      await adminDb.collection('pickupZones').doc('admin-block-foyer').set({
        label: 'Admin Block Foyer',
        active: false,
        approvalStatus: 'pending_review',
      });

      await adminDb.collection('users').doc(verifiedUid).set({
        uid: verifiedUid,
        displayName: 'Verified Student',
        email: 'v@igdtuw.ac.in',
        verificationStatus: 'verified',
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await adminDb.collection('users').doc(suspendedUid).set({
        uid: suspendedUid,
        displayName: 'Suspended Student',
        email: 's@igdtuw.ac.in',
        verificationStatus: 'suspended',
        accountStatus: 'suspended',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    it('allows authenticated users to read categories', async () => {
      const userDb = testEnv.authenticatedContext('any_student').firestore();
      await assertSucceeds(userDb.collection('categories').doc('academic-books').get());
    });

    it('denies students from creating or editing categories', async () => {
      const userDb = testEnv.authenticatedContext('any_student').firestore();
      await assertFails(
        userDb.collection('categories').doc('academic-books').update({ name: 'Hacked' })
      );
    });

    it('allows admin to manage categories', async () => {
      const adminDb = testEnv.authenticatedContext('admin_user', { admin: true }).firestore();
      await assertSucceeds(
        adminDb.collection('categories').doc('new-cat').set({
          name: 'New Category',
          active: true,
        })
      );
    });

    it('allows verified active student to read pickup zones', async () => {
      const verifiedDb = testEnv
        .authenticatedContext(verifiedUid, { verifiedStudent: true })
        .firestore();
      await assertSucceeds(verifiedDb.collection('pickupZones').doc('admin-block-foyer').get());
    });

    it('denies unverified student from reading pickup zones', async () => {
      const unverifiedDb = testEnv.authenticatedContext('student_unverified').firestore();
      await assertFails(unverifiedDb.collection('pickupZones').doc('admin-block-foyer').get());
    });

    it('denies suspended student from reading pickup zones', async () => {
      const suspendedDb = testEnv
        .authenticatedContext(suspendedUid, { verifiedStudent: true })
        .firestore();
      await assertFails(suspendedDb.collection('pickupZones').doc('admin-block-foyer').get());
    });
  });

  // ===========================================================================
  // 5. Default-Deny on Backend Dev 2 Collections
  // ===========================================================================
  describe('Backend Developer 2 Collections Default-Deny', () => {
    it('strictly denies client-side writes to bookingSlots', async () => {
      const userDb = testEnv.authenticatedContext('student1').firestore();
      await assertFails(
        userDb.collection('bookingSlots').doc('listing1_20261115').set({
          bookingId: 'b1',
          status: 'locked',
        })
      );
    });

    it('strictly denies client-side writes to bookings', async () => {
      const userDb = testEnv.authenticatedContext('student1').firestore();
      await assertFails(
        userDb.collection('bookings').doc('booking123').set({
          borrowerUid: 'student1',
          lenderUid: 'student2',
        })
      );
    });

    it('strictly denies regular students from reading auditLogs', async () => {
      const userDb = testEnv.authenticatedContext('student1').firestore();
      await assertFails(userDb.collection('auditLogs').doc('log1').get());
    });

    it('allows administrators to read auditLogs', async () => {
      const adminDb = testEnv.authenticatedContext('admin1', { admin: true }).firestore();
      await assertSucceeds(adminDb.collection('auditLogs').doc('log1').get());
    });
  });
});
