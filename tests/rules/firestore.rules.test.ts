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
      // Seed user doc using admin context
      const adminDb = testEnv.authenticatedContext('admin_setup', { admin: true }).firestore();
      await adminDb.collection('users').doc(studentUid).set({
        uid: studentUid,
        displayName: 'Sneha Verma',
        email: 'sneha@igdtuw.ac.in',
        verificationStatus: 'pending', // Starts pending
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
  // 2. publicProfiles/{uid} Access Control
  // ===========================================================================
  describe('publicProfiles/{uid} Access Control', () => {
    const studentUid = 'student_pooja';

    beforeEach(async () => {
      const adminDb = testEnv.authenticatedContext('admin_setup', { admin: true }).firestore();
      await adminDb.collection('publicProfiles').doc(studentUid).set({
        uid: studentUid,
        displayName: 'Pooja Rani',
        photoURL: null,
        verificationBadge: true,
        completedBorrowCount: 5,
        ratingSummary: { averageRating: 4.9, totalReviews: 8 },
      });
    });

    it('allows verified student to read public profile', async () => {
      const verifiedDb = testEnv.authenticatedContext('student_radha', { verifiedStudent: true }).firestore();
      await assertSucceeds(verifiedDb.collection('publicProfiles').doc(studentUid).get());
    });

    it('denies unverified student from reading public profile', async () => {
      const unverifiedDb = testEnv.authenticatedContext('student_unverified').firestore();
      await assertFails(unverifiedDb.collection('publicProfiles').doc(studentUid).get());
    });

    it('denies student writes to public profiles', async () => {
      const studentDb = testEnv.authenticatedContext(studentUid, { verifiedStudent: true }).firestore();
      await assertFails(
        studentDb.collection('publicProfiles').doc(studentUid).update({
          completedBorrowCount: 100,
        })
      );
    });
  });

  // ===========================================================================
  // 3. listings/{listingId} Access Control
  // ===========================================================================
  describe('listings/{listingId} Access Control', () => {
    const ownerUid = 'lender_shreya';
    const borrowerUid = 'borrower_kavya';
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
      await adminDb.collection('listings').doc(listingId).set(validListingData);
    });

    it('allows verified student to read an active listing', async () => {
      const verifiedDb = testEnv.authenticatedContext(borrowerUid, { verifiedStudent: true }).firestore();
      await assertSucceeds(verifiedDb.collection('listings').doc(listingId).get());
    });

    it('denies unverified student from reading marketplace listings', async () => {
      const unverifiedDb = testEnv.authenticatedContext('unverified_student').firestore();
      await assertFails(unverifiedDb.collection('listings').doc(listingId).get());
    });

    it('allows verified owner to create a valid listing matching their UID', async () => {
      const ownerDb = testEnv.authenticatedContext(ownerUid, { verifiedStudent: true }).firestore();
      const newListingId = 'listing_new_002';
      await assertSucceeds(
        ownerDb.collection('listings').doc(newListingId).set({
          ...validListingData,
          listingId: newListingId,
        })
      );
    });

    it('denies unverified student from creating a listing', async () => {
      const unverifiedDb = testEnv.authenticatedContext(ownerUid).firestore();
      await assertFails(
        unverifiedDb.collection('listings').doc('listing_fail').set({
          ...validListingData,
          listingId: 'listing_fail',
        })
      );
    });

    it('denies creating a listing with someone else UID as ownerUid', async () => {
      const hackerDb = testEnv.authenticatedContext('hacker_uid', { verifiedStudent: true }).firestore();
      await assertFails(
        hackerDb.collection('listings').doc('listing_spoof').set({
          ...validListingData,
          ownerUid: 'innocent_uid',
        })
      );
    });

    it('allows owner to update their own listing', async () => {
      const ownerDb = testEnv.authenticatedContext(ownerUid, { verifiedStudent: true }).firestore();
      await assertSucceeds(
        ownerDb.collection('listings').doc(listingId).update({
          pricePerDay: 25,
          status: 'paused',
        })
      );
    });

    it('denies another student from modifying someone else listing', async () => {
      const nonOwnerDb = testEnv.authenticatedContext(borrowerUid, { verifiedStudent: true }).firestore();
      await assertFails(
        nonOwnerDb.collection('listings').doc(listingId).update({
          pricePerDay: 5,
        })
      );
    });

    it('denies client setting status to removed (moderation only)', async () => {
      const ownerDb = testEnv.authenticatedContext(ownerUid, { verifiedStudent: true }).firestore();
      await assertFails(
        ownerDb.collection('listings').doc(listingId).update({
          status: 'removed',
        })
      );
    });
  });

  // ===========================================================================
  // 4. categories & pickupZones Access Control
  // ===========================================================================
  describe('categories & pickupZones Access Control', () => {
    beforeEach(async () => {
      const adminDb = testEnv.authenticatedContext('admin_setup', { admin: true }).firestore();
      await adminDb.collection('categories').doc('academic-books').set({
        name: 'Academic & Books',
        active: true,
      });
      await adminDb.collection('pickupZones').doc('admin-block-foyer').set({
        label: 'Admin Block Foyer',
        active: true,
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

    it('allows verified student to read approved pickup zones', async () => {
      const verifiedDb = testEnv.authenticatedContext('student_verified', { verifiedStudent: true }).firestore();
      await assertSucceeds(verifiedDb.collection('pickupZones').doc('admin-block-foyer').get());
    });

    it('denies unverified student from reading pickup zones', async () => {
      const unverifiedDb = testEnv.authenticatedContext('student_unverified').firestore();
      await assertFails(unverifiedDb.collection('pickupZones').doc('admin-block-foyer').get());
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
