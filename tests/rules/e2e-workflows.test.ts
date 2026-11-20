import { describe, it, beforeAll, beforeEach, expect } from 'vitest';
import * as admin from 'firebase-admin';
import { ensureUserProfile } from '../../functions/src/auth/ensureUserProfile';
import { updateUserProfile } from '../../functions/src/users/updateUserProfile';
import { approveStudent } from '../../functions/src/admin/approveStudent';
import { setAdminRole } from '../../functions/src/admin/setAdminRole';
import { adminManageCategory } from '../../functions/src/admin/adminManageCategory';
import { adminModerateListing } from '../../functions/src/admin/adminModerateListing';
import { createListing } from '../../functions/src/listings/createListing';
import { getListing } from '../../functions/src/listings/getListing';
import { updateListing } from '../../functions/src/listings/updateListing';
import { pauseListing } from '../../functions/src/listings/pauseListing';

const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-borrowher';

describe('BorrowHer End-to-End 10-Function Workflow Integration Suite', () => {
  let db: admin.firestore.Firestore;
  let auth: admin.auth.Auth;

  const adminUid = 'e2e_admin_1';
  const studentUid = 'e2e_student_1';
  const otherStudentUid = 'e2e_student_2';
  const outsiderUid = 'e2e_outsider_1';
  const categoryId = 'e2e-electronics';
  const zoneId = 'e2e-admin-foyer';

  beforeAll(async () => {
    process.env.FIREBASE_PROJECT_ID = projectId;
    if (admin.apps.length === 0) {
      admin.initializeApp({ projectId });
    }
    db = admin.firestore();
    auth = admin.auth();
  });

  async function ensureAuthUser(uid: string, email: string, displayName: string, claims?: Record<string, any>) {
    try {
      await auth.deleteUser(uid);
    } catch {
      // Ignore if not present
    }
    await auth.createUser({
      uid,
      email,
      emailVerified: true,
      displayName,
      password: 'TestPassword123!',
    });
    if (claims) {
      await auth.setCustomUserClaims(uid, claims);
    }
  }

  beforeEach(async () => {
    await ensureAuthUser(adminUid, 'admin.e2e@igdtuw.ac.in', 'E2E Admin', {
      admin: true,
      verifiedStudent: true,
      accountStatus: 'active',
    });
    await ensureAuthUser(studentUid, 'ria.e2e@igdtuw.ac.in', 'Ria Sharma');
    await ensureAuthUser(otherStudentUid, 'meera.e2e@igdtuw.ac.in', 'Meera Joshi', {
      verifiedStudent: true,
      accountStatus: 'active',
    });
    await ensureAuthUser(outsiderUid, 'outsider@gmail.com', 'External User');

    const now = new Date().toISOString();
    await db.collection('users').doc(adminUid).set({
      uid: adminUid,
      displayName: 'E2E Admin',
      email: 'admin.e2e@igdtuw.ac.in',
      verificationStatus: 'verified',
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
    });
    await db.collection('users').doc(otherStudentUid).set({
      uid: otherStudentUid,
      displayName: 'Meera Joshi',
      email: 'meera.e2e@igdtuw.ac.in',
      verificationStatus: 'verified',
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
    });
    await db.collection('users').doc(studentUid).delete();
    await db.collection('publicProfiles').doc(studentUid).delete();

    await db.collection('pickupZones').doc(zoneId).set({
      zoneId,
      label: 'Admin Block Foyer',
      campusArea: 'Central Academic Lawn',
      active: true,
      approvalStatus: 'approved',
      guidance: 'Meet near noticeboard during daytime campus hours.',
      accessNote: 'Public zone.',
    });
  });

  it('rejects non-@igdtuw.ac.in accounts server-side in ensureUserProfile', async () => {
    await expect(
      (ensureUserProfile as any).run({
        auth: { uid: outsiderUid, token: { email: 'outsider@gmail.com' } },
        data: {},
      })
    ).rejects.toThrow('Only official @igdtuw.ac.in campus email addresses are permitted');
  });

  it('executes complete student + admin + marketplace + moderation + role lifecycle across all 10 functions', async () => {
    // 1. Register / initialize profile via ensureUserProfile (starts pending)
    const ensured = await (ensureUserProfile as any).run({
      auth: { uid: studentUid, token: { email: 'ria.e2e@igdtuw.ac.in' } },
      data: {},
    });
    expect(ensured.isNewUser).toBe(true);
    expect(ensured.user.verificationStatus).toBe('pending');
    expect(ensured.publicProfile.verificationBadge).toBe(false);

    // 2. Idempotent second call returns existing profile
    const ensuredAgain = await (ensureUserProfile as any).run({
      auth: { uid: studentUid, token: { email: 'ria.e2e@igdtuw.ac.in' } },
      data: {},
    });
    expect(ensuredAgain.isNewUser).toBe(false);

    // 3. Ordinary student cannot execute ANY admin function
    const studentAuth = { uid: studentUid, token: { email: 'ria.e2e@igdtuw.ac.in' } };
    await expect(
      (approveStudent as any).run({ auth: studentAuth, data: { uid: studentUid, status: 'verified' } })
    ).rejects.toThrow('Only designated administrators');
    await expect(
      (setAdminRole as any).run({ auth: studentAuth, data: { targetUid: studentUid, admin: true } })
    ).rejects.toThrow('Only existing administrators');
    await expect(
      (adminManageCategory as any).run({
        auth: studentAuth,
        data: { categoryId, name: 'Electronics', slug: categoryId, description: 'Campus electronics' },
      })
    ).rejects.toThrow('Only administrators');
    await expect(
      (adminModerateListing as any).run({
        auth: studentAuth,
        data: { listingId: 'any', status: 'removed', moderationReason: 'Unauthorized try' },
      })
    ).rejects.toThrow('Only administrators');

    // 4. Admin creates category via adminManageCategory
    const adminAuth = { uid: adminUid, token: { admin: true, email: 'admin.e2e@igdtuw.ac.in' } };
    const catRes = await (adminManageCategory as any).run({
      auth: adminAuth,
      data: {
        categoryId,
        name: 'Calculators & Electronics',
        slug: categoryId,
        description: 'Scientific calculators, chargers, and adapters for IGDTUW courses.',
        active: true,
      },
    });
    expect(catRes.success).toBe(true);
    expect(catRes.category.categoryId).toBe(categoryId);

    // 5. Pending student cannot create listing before approval
    await expect(
      (createListing as any).run({
        auth: studentAuth,
        data: {
          title: 'Casio Scientific Calculator',
          description: 'Clean calculator ready for semester exams.',
          categoryId,
          condition: 'like-new',
          imagePaths: [],
          mode: 'rental',
          pricePerDay: 20,
          depositAmount: 200,
          minDays: 1,
          maxDays: 7,
          pickupZoneIds: [zoneId],
        },
      })
    ).rejects.toThrow('Only verified IGDTUW students');

    // 6. Admin approves student via approveStudent
    const approval = await (approveStudent as any).run({
      auth: adminAuth,
      data: { uid: studentUid, status: 'verified' },
    });
    expect(approval.success).toBe(true);
    expect(approval.verificationStatus).toBe('verified');
    expect(approval.claimsUpdated).toBe(true);

    const updatedAuthUser = await auth.getUser(studentUid);
    expect(updatedAuthUser.customClaims?.verifiedStudent).toBe(true);

    // 7. Verified student updates profile via updateUserProfile (syncs users + publicProfiles)
    const verifiedStudentAuth = {
      uid: studentUid,
      token: { email: 'ria.e2e@igdtuw.ac.in', verifiedStudent: true, accountStatus: 'active' },
    };
    const profRes = await (updateUserProfile as any).run({
      auth: verifiedStudentAuth,
      data: { displayName: 'Ria Sharma (CSE)', programme: 'B.Tech CSE', year: 3 },
    });
    expect(profRes.success).toBe(true);
    const pubSnap = await db.collection('publicProfiles').doc(studentUid).get();
    expect(pubSnap.data()?.displayName).toBe('Ria Sharma (CSE)');
    expect(pubSnap.data()?.verificationBadge).toBe(true);

    // 8. Verified student creates listing via createListing
    const created = await (createListing as any).run({
      auth: verifiedStudentAuth,
      data: {
        title: 'Casio Scientific Calculator fx-991EX',
        description: 'Engineering calculator with protective cover for exams.',
        categoryId,
        condition: 'like-new',
        imagePaths: [`listing-images/${studentUid}/upload-1/calc.jpg`],
        mode: 'rental',
        pricePerDay: 25,
        depositAmount: 300,
        minDays: 2,
        maxDays: 7,
        pickupZoneIds: [zoneId],
      },
    });
    expect(created.ownerUid).toBe(studentUid);
    expect(created.status).toBe('active');

    // 9. Another verified student retrieves listing via getListing (including lenderProfile)
    const otherStudentAuth = {
      uid: otherStudentUid,
      token: { email: 'meera.e2e@igdtuw.ac.in', verifiedStudent: true, accountStatus: 'active' },
    };
    const fetched = await (getListing as any).run({
      auth: otherStudentAuth,
      data: { listingId: created.listingId },
    });
    expect(fetched.listing.title).toBe('Casio Scientific Calculator fx-991EX');
    expect(fetched.lenderProfile?.displayName).toBe('Ria Sharma (CSE)');

    // 10. IDOR Check: Other student cannot edit or pause owner's listing
    await expect(
      (updateListing as any).run({
        auth: otherStudentAuth,
        data: { listingId: created.listingId, title: 'Hijacked Title' },
      })
    ).rejects.toThrow('You do not have permission');
    await expect(
      (pauseListing as any).run({
        auth: otherStudentAuth,
        data: { listingId: created.listingId, paused: true },
      })
    ).rejects.toThrow('You do not have permission');

    // 11. Owner edits listing via atomic transactional updateListing
    const edited = await (updateListing as any).run({
      auth: verifiedStudentAuth,
      data: { listingId: created.listingId, pricePerDay: 15, minDays: 3 },
    });
    expect(edited.pricePerDay).toBe(15);
    expect(edited.minDays).toBe(3);

    // 12. Owner pauses and resumes listing via pauseListing
    const paused = await (pauseListing as any).run({
      auth: verifiedStudentAuth,
      data: { listingId: created.listingId, paused: true },
    });
    expect(paused.status).toBe('paused');

    // Paused listing hidden from other verified student
    await expect(
      (getListing as any).run({
        auth: otherStudentAuth,
        data: { listingId: created.listingId },
      })
    ).rejects.toThrow('not currently active');

    const resumed = await (pauseListing as any).run({
      auth: verifiedStudentAuth,
      data: { listingId: created.listingId, paused: false },
    });
    expect(resumed.status).toBe('active');

    // 13. Admin moderates listing (removes it) -> owner can no longer edit or resume
    const moderated = await (adminModerateListing as any).run({
      auth: adminAuth,
      data: {
        listingId: created.listingId,
        status: 'removed',
        moderationReason: 'Item policy verification review required.',
      },
    });
    expect(moderated.success).toBe(true);
    expect(moderated.status).toBe('removed');

    await expect(
      (updateListing as any).run({
        auth: verifiedStudentAuth,
        data: { listingId: created.listingId, title: 'Try restoring myself' },
      })
    ).rejects.toThrow('removed by moderation');

    // 14. Admin role assignment via setAdminRole (grant, revoke, and block self-demotion)
    await expect(
      (setAdminRole as any).run({
        auth: adminAuth,
        data: { targetUid: adminUid, admin: false },
      })
    ).rejects.toThrow('cannot revoke their own admin privilege');

    const granted = await (setAdminRole as any).run({
      auth: adminAuth,
      data: { targetUid: otherStudentUid, admin: true },
    });
    expect(granted.success).toBe(true);
    expect((await auth.getUser(otherStudentUid)).customClaims?.admin).toBe(true);

    const revoked = await (setAdminRole as any).run({
      auth: adminAuth,
      data: { targetUid: otherStudentUid, admin: false },
    });
    expect(revoked.success).toBe(true);
    expect((await auth.getUser(otherStudentUid)).customClaims?.admin).toBeUndefined();

    // 15. Admin suspends student -> student immediately blocked from updateUserProfile and listings
    const suspended = await (approveStudent as any).run({
      auth: adminAuth,
      data: { uid: studentUid, status: 'suspended', reason: 'Repeated no-show violation.' },
    });
    expect(suspended.verificationStatus).toBe('suspended');

    await expect(
      (updateUserProfile as any).run({
        auth: verifiedStudentAuth, // Stale JWT claims!
        data: { displayName: 'Should Fail' },
      })
    ).rejects.toThrow('Account is suspended');
  });
});
