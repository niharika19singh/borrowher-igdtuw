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

const PROJECT_ID = 'borrowher-storage-rules-test';
const STORAGE_RULES_PATH = path.resolve(__dirname, '../../storage.rules');

describe('Storage Security Rules Test Suite', () => {
  beforeAll(async () => {
    const rules = fs.readFileSync(STORAGE_RULES_PATH, 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      storage: {
        rules,
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

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearStorage();
    }
  });

  const studentUid = 'student_radhika';
  const otherStudentUid = 'student_tanvi';
  const listingId = 'list_drafter_001';

  it('allows verified student to upload a valid JPEG image to their own folder', async () => {
    const storage = testEnv
      .authenticatedContext(studentUid, { verifiedStudent: true })
      .storage();

    const fileRef = storage.ref(`listing-images/${studentUid}/${listingId}/photo1.jpg`);
    const smallJpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

    await assertSucceeds(
      Promise.resolve(fileRef.put(smallJpgBytes, { contentType: 'image/jpeg' }))
    );
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
});
