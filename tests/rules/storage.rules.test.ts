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

const PROJECT_ID = 'demo-borrowher';
const STORAGE_RULES_PATH = path.resolve(__dirname, '../../storage.rules');
const FIRESTORE_RULES_PATH = path.resolve(__dirname, '../../firestore.rules');

describe('Storage Security Rules Test Suite', () => {
  beforeAll(async () => {
    const storageRules = fs.readFileSync(STORAGE_RULES_PATH, 'utf8');
    const firestoreRules = fs.readFileSync(FIRESTORE_RULES_PATH, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: firestoreRules,
        host: process.env.FIRESTORE_EMULATOR_HOST
          ? process.env.FIRESTORE_EMULATOR_HOST.split(':')[0]
          : '127.0.0.1',
        port: process.env.FIRESTORE_EMULATOR_HOST
          ? Number(process.env.FIRESTORE_EMULATOR_HOST.split(':')[1])
          : 8080,
      },
      storage: {
        rules: storageRules,
        host: process.env.FIREBASE_STORAGE_EMULATOR_HOST
          ? process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(':')[0]
          : '127.0.0.1',
        port: process.env.FIREBASE_STORAGE_EMULATOR_HOST
          ? Number(process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(':')[1])
          : 9199,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  const studentUid = 'student_radhika';
  const otherStudentUid = 'student_tanvi';
  const suspendedUid = 'student_suspended';
  const rejectedUid = 'student_rejected';
  const missingDocUid = 'student_missing_doc';
  const listingId = 'list_drafter_001';

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearStorage();
      await testEnv.clearFirestore();

      // Seed user profiles in Firestore for cross-service Storage security rules verification
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        // 1. Active and verified student
        await db.collection('users').doc(studentUid).set({
          uid: studentUid,
          email: 'radhika@igdtuw.ac.in',
          displayName: 'Radhika Sharma',
          accountStatus: 'active',
          verificationStatus: 'verified',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 2. Another active and verified student
        await db.collection('users').doc(otherStudentUid).set({
          uid: otherStudentUid,
          email: 'tanvi@igdtuw.ac.in',
          displayName: 'Tanvi Verma',
          accountStatus: 'active',
          verificationStatus: 'verified',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 3. Suspended student with stale verifiedStudent JWT claim
        await db.collection('users').doc(suspendedUid).set({
          uid: suspendedUid,
          email: 'suspended@igdtuw.ac.in',
          displayName: 'Suspended Student',
          accountStatus: 'suspended',
          verificationStatus: 'verified',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 4. Rejected student with stale verifiedStudent JWT claim
        await db.collection('users').doc(rejectedUid).set({
          uid: rejectedUid,
          email: 'rejected@igdtuw.ac.in',
          displayName: 'Rejected Student',
          accountStatus: 'active',
          verificationStatus: 'rejected',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    }
  });

  it('allows verified, active student to upload a valid JPEG image to their own folder', async () => {
    const storage = testEnv
      .authenticatedContext(studentUid, { verifiedStudent: true })
      .storage();

    const fileRef = storage.ref(`listing-images/${studentUid}/${listingId}/photo1.jpg`);
    const smallJpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

    await assertSucceeds(
      Promise.resolve(fileRef.put(smallJpgBytes, { contentType: 'image/jpeg' }))
    );
  });

  it('denies suspended student with stale verifiedStudent claim from uploading images', async () => {
    const storage = testEnv
      .authenticatedContext(suspendedUid, { verifiedStudent: true })
      .storage();

    const fileRef = storage.ref(`listing-images/${suspendedUid}/${listingId}/photo1.jpg`);
    const smallJpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

    await assertFails(
      Promise.resolve(fileRef.put(smallJpgBytes, { contentType: 'image/jpeg' }))
    );
  });

  it('denies rejected student with stale verifiedStudent claim from uploading images', async () => {
    const storage = testEnv
      .authenticatedContext(rejectedUid, { verifiedStudent: true })
      .storage();

    const fileRef = storage.ref(`listing-images/${rejectedUid}/${listingId}/photo1.jpg`);
    const smallJpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

    await assertFails(
      Promise.resolve(fileRef.put(smallJpgBytes, { contentType: 'image/jpeg' }))
    );
  });

  it('denies user with missing Firestore profile from uploading even with verifiedStudent claim', async () => {
    const storage = testEnv
      .authenticatedContext(missingDocUid, { verifiedStudent: true })
      .storage();

    const fileRef = storage.ref(`listing-images/${missingDocUid}/${listingId}/photo1.jpg`);
    const smallJpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

    await assertFails(
      Promise.resolve(fileRef.put(smallJpgBytes, { contentType: 'image/jpeg' }))
    );
  });

  it('denies suspended student with stale verifiedStudent claim from reading listing images', async () => {
    // First upload an image with active verified student
    const activeStorage = testEnv
      .authenticatedContext(studentUid, { verifiedStudent: true })
      .storage();
    const activeRef = activeStorage.ref(`listing-images/${studentUid}/${listingId}/photo1.jpg`);
    await activeRef.put(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), { contentType: 'image/jpeg' });

    // Now attempt read with suspended student having stale claim
    const suspendedStorage = testEnv
      .authenticatedContext(suspendedUid, { verifiedStudent: true })
      .storage();
    const readRef = suspendedStorage.ref(`listing-images/${studentUid}/${listingId}/photo1.jpg`);

    await assertFails(readRef.getDownloadURL());
  });

  it('allows active verified student to read listing images', async () => {
    // Upload image
    const ownerStorage = testEnv
      .authenticatedContext(studentUid, { verifiedStudent: true })
      .storage();
    const uploadRef = ownerStorage.ref(`listing-images/${studentUid}/${listingId}/photo1.jpg`);
    await uploadRef.put(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), { contentType: 'image/jpeg' });

    // Read by another active verified student
    const readerStorage = testEnv
      .authenticatedContext(otherStudentUid, { verifiedStudent: true })
      .storage();
    const readRef = readerStorage.ref(`listing-images/${studentUid}/${listingId}/photo1.jpg`);

    await assertSucceeds(readRef.getDownloadURL());
  });

  it('allows platform administrator to read listing images', async () => {
    const ownerStorage = testEnv
      .authenticatedContext(studentUid, { verifiedStudent: true })
      .storage();
    const uploadRef = ownerStorage.ref(`listing-images/${studentUid}/${listingId}/photo1.jpg`);
    await uploadRef.put(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), { contentType: 'image/jpeg' });

    const adminStorage = testEnv
      .authenticatedContext('admin_user', { admin: true })
      .storage();
    const readRef = adminStorage.ref(`listing-images/${studentUid}/${listingId}/photo1.jpg`);

    await assertSucceeds(readRef.getDownloadURL());
  });

  it('denies unverified student from uploading listing images', async () => {
    const storage = testEnv
      .authenticatedContext(studentUid) // missing verifiedStudent claim
      .storage();

    const fileRef = storage.ref(`listing-images/${studentUid}/${listingId}/photo1.jpg`);
    const smallJpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

    await assertFails(
      Promise.resolve(fileRef.put(smallJpgBytes, { contentType: 'image/jpeg' }))
    );
  });

  it('denies a student from uploading into another student folder', async () => {
    const storage = testEnv
      .authenticatedContext(otherStudentUid, { verifiedStudent: true })
      .storage();

    const fileRef = storage.ref(`listing-images/${studentUid}/${listingId}/hacked.jpg`);
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

    await assertFails(
      Promise.resolve(fileRef.put(bytes, { contentType: 'image/jpeg' }))
    );
  });

  it('denies uploading invalid MIME types (e.g. PDF or executable)', async () => {
    const storage = testEnv
      .authenticatedContext(studentUid, { verifiedStudent: true })
      .storage();

    const fileRef = storage.ref(`listing-images/${studentUid}/${listingId}/document.pdf`);
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

    await assertFails(
      Promise.resolve(fileRef.put(bytes, { contentType: 'application/pdf' }))
    );
  });

  it('denies unauthenticated read or write to storage', async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    const fileRef = storage.ref(`listing-images/${studentUid}/${listingId}/test.jpg`);
    await assertFails(fileRef.getDownloadURL());
  });

  // =========================================================================
  // Booking Evidence Path Lockdown (Reserved for Backend Developer 2)
  // =========================================================================
  it('strictly denies client uploads to booking-evidence path pending Backend Dev 2 participant authorization', async () => {
    const storage = testEnv
      .authenticatedContext(studentUid, { verifiedStudent: true })
      .storage();

    const evidenceRef = storage.ref(`booking-evidence/booking_123/${studentUid}/proof.jpg`);
    const smallJpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

    await assertFails(
      Promise.resolve(evidenceRef.put(smallJpgBytes, { contentType: 'image/jpeg' }))
    );
  });

  it('strictly denies client reads from booking-evidence path', async () => {
    const storage = testEnv
      .authenticatedContext(studentUid, { verifiedStudent: true })
      .storage();

    const evidenceRef = storage.ref(`booking-evidence/booking_123/${studentUid}/proof.jpg`);
    await assertFails(evidenceRef.getDownloadURL());
  });
});
