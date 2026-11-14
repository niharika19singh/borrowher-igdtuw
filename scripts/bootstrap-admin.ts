import * as admin from 'firebase-admin';
import { UserProfile, PublicProfile } from '../functions/src/shared/types';

/**
 * BorrowHer — First Administrator Secure Bootstrap Script
 *
 * Security Principle:
 * Admin privileges must NEVER be self-assigned through a client-exposed endpoint.
 * This standalone administrative CLI script uses the Firebase Admin SDK directly
 * to provision the root administrator account with verified status and admin claims.
 */

const projectId = process.env.FIREBASE_PROJECT_ID || 'borrowher-igdtuw';
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`[Admin Bootstrap] Connecting to Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.log(`[Admin Bootstrap] Connecting to Auth Emulator at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
}

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId });
}

const auth = admin.auth();
const db = admin.firestore();

async function bootstrapFirstAdmin() {
  const targetEmail = process.env.FIRST_ADMIN_EMAIL || process.argv[2] || 'admin@igdtuw.ac.in';
  const targetDisplayName = process.env.FIRST_ADMIN_DISPLAY_NAME || 'IGDTUW System Administrator';
  const temporaryPassword = process.env.FIRST_ADMIN_PASSWORD || 'AdminPass123!IGDTUW';

  console.log(`\n======================================================`);
  console.log(`🔐 BorrowHer — Provisioning Initial Administrator`);
  console.log(`Target Email: ${targetEmail}`);
  console.log(`======================================================\n`);

  let userRecord: admin.auth.UserRecord;

  try {
    userRecord = await auth.getUserByEmail(targetEmail);
    console.log(`✓ Existing Auth account located with UID: ${userRecord.uid}`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`Creating new administrator account in Firebase Auth...`);
      userRecord = await auth.createUser({
        email: targetEmail,
        emailVerified: true,
        displayName: targetDisplayName,
        password: temporaryPassword,
      });
      console.log(`✓ Created new Auth account with UID: ${userRecord.uid}`);
    } else {
      throw error;
    }
  }

  const uid = userRecord.uid;

  // 1. Assign Admin and Verified Student Custom Claims
  const claims = {
    admin: true,
    verifiedStudent: true,
  };
  await auth.setCustomUserClaims(uid, claims);
  console.log(`✓ Custom claims set: admin=true, verifiedStudent=true`);

  // 2. Initialize / Update Firestore User Profile
  const now = new Date().toISOString();
  const userDocRef = db.collection('users').doc(uid);
  const publicDocRef = db.collection('publicProfiles').doc(uid);

  const adminUserProfile: UserProfile = {
    uid,
    displayName: targetDisplayName,
    email: targetEmail,
    verificationStatus: 'verified',
    accountStatus: 'active',
    programme: 'Administration',
    year: 'Staff',
    createdAt: now,
    updatedAt: now,
  };

  const adminPublicProfile: PublicProfile = {
    uid,
    displayName: targetDisplayName,
    photoURL: userRecord.photoURL || null,
    verificationBadge: true,
    completedBorrowCount: 0,
    ratingSummary: {
      averageRating: 5.0,
      totalReviews: 0,
    },
  };

  const batch = db.batch();
  batch.set(userDocRef, adminUserProfile, { merge: true });
  batch.set(publicDocRef, adminPublicProfile, { merge: true });

  // 3. Write Audit Log
  const auditRef = db.collection('auditLogs').doc();
  batch.set(auditRef, {
    logId: auditRef.id,
    actorUid: 'SYSTEM_BOOTSTRAP_CLI',
    action: 'BOOTSTRAP_INITIAL_ADMIN',
    targetType: 'user',
    targetId: uid,
    metadata: {
      email: targetEmail,
      claimsGranted: claims,
    },
    timestamp: now,
  });

  await batch.commit();

  console.log(`✓ Private user record provisioned in 'users/${uid}'`);
  console.log(`✓ Public profile provisioned in 'publicProfiles/${uid}'`);
  console.log(`✓ Audit log recorded in 'auditLogs/${auditRef.id}'`);
  console.log(`\n🎉 Success! First administrator account is active and fully provisioned.\n`);
}

if (require.main === module || process.argv[1]?.endsWith('bootstrap-admin.ts')) {
  bootstrapFirstAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Bootstrap failed:', err);
      process.exit(1);
    });
}
