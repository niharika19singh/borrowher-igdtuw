import * as admin from 'firebase-admin';
import { UserProfile, PublicProfile } from '../functions/src/shared/types';

/**
 * BorrowHer — First Administrator Secure Bootstrap Script
 *
 * Security Principles:
 * 1. Admin privileges must NEVER be self-assigned through a client-exposed endpoint.
 * 2. The account MUST already exist in Firebase Auth (pre-registered by the candidate).
 * 3. The candidate's email address MUST already be verified (emailVerified === true).
 * 4. The target email/UID must be explicitly provided (no hardcoded/default admin email).
 * 5. Explicit confirmation flag (--confirm) is strictly required to prevent accidental elevation.
 * 6. Fabricated ratings or reviews are prohibited; initial public profile rating is neutral (0.0).
 * 7. Passwords or credentials must never be accepted, generated, or printed by this script.
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

function parseArgs() {
  const args = process.argv.slice(2);
  let targetEmail: string | undefined = process.env.ADMIN_EMAIL;
  let targetUid: string | undefined = process.env.ADMIN_UID;
  let confirmed: boolean = process.env.CONFIRM_BOOTSTRAP === 'true';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      targetEmail = args[i + 1].trim();
      i++;
    } else if (args[i] === '--uid' && args[i + 1]) {
      targetUid = args[i + 1].trim();
      i++;
    } else if (args[i] === '--confirm') {
      confirmed = true;
    }
  }

  return { targetEmail, targetUid, confirmed };
}

export async function bootstrapAdmin(options?: {
  targetEmail?: string;
  targetUid?: string;
  confirmed?: boolean;
}) {
  const opts = options || parseArgs();
  const { targetEmail, targetUid, confirmed } = opts;

  // 1. Enforce explicit target identifier
  if (!targetEmail && !targetUid) {
    throw new Error(
      'Administrator target identifier is required.\n' +
      'Usage: tsx scripts/bootstrap-admin.ts --email <candidate-email> --confirm\n' +
      '   or: tsx scripts/bootstrap-admin.ts --uid <candidate-uid> --confirm\n' +
      '   or set environment variables: ADMIN_EMAIL=<email> CONFIRM_BOOTSTRAP=true'
    );
  }

  // 2. Enforce explicit confirmation
  if (!confirmed) {
    throw new Error(
      'Elevation confirmation is missing. You must provide the --confirm flag or set CONFIRM_BOOTSTRAP=true\n' +
      'to authorize granting administrator privileges.'
    );
  }

  console.log(`\n======================================================`);
  console.log(`🔐 BorrowHer — Secure Administrator Bootstrap Procedure`);
  console.log(`Target: ${targetEmail ? `Email: ${targetEmail}` : `UID: ${targetUid}`}`);
  console.log(`======================================================\n`);

  // 3. Look up existing Auth account
  let userRecord: admin.auth.UserRecord;
  try {
    if (targetUid) {
      userRecord = await auth.getUser(targetUid);
    } else {
      userRecord = await auth.getUserByEmail(targetEmail!);
    }
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error(
        `Firebase Auth account not found for target ${targetEmail || targetUid}.\n` +
        'Security policy requires that the administrator account must already be registered before elevation.'
      );
    }
    throw error;
  }

  const uid = userRecord.uid;
  console.log(`✓ Existing Firebase Auth account located (UID: ${uid})`);

  // 4. Verify email verification status
  if (!userRecord.emailVerified) {
    throw new Error(
      `Cannot elevate account '${userRecord.email}'. The candidate's email address has not been verified.\n` +
      'The candidate must complete standard email verification before receiving administrative claims.'
    );
  }
  console.log(`✓ Email verification status verified (emailVerified: true)`);

  // 5. Assign Custom Claims
  const existingClaims = userRecord.customClaims || {};
  const updatedClaims = {
    ...existingClaims,
    admin: true,
    verifiedStudent: true,
    accountStatus: 'active',
  };
  await auth.setCustomUserClaims(uid, updatedClaims);
  console.log(`✓ Custom claims granted: admin=true, verifiedStudent=true, accountStatus=active`);

  // 6. Safely initialize / update Firestore profile
  const now = new Date().toISOString();
  const userDocRef = db.collection('users').doc(uid);
  const publicDocRef = db.collection('publicProfiles').doc(uid);

  const existingUserDoc = await userDocRef.get();
  const existingUserData = existingUserDoc.exists ? (existingUserDoc.data() as UserProfile) : null;

  const adminUserProfile: UserProfile = {
    uid,
    displayName: userRecord.displayName || existingUserData?.displayName || 'BorrowHer Administrator',
    email: userRecord.email || '',
    verificationStatus: 'verified',
    accountStatus: 'active',
    programme: existingUserData?.programme || 'Administration',
    year: existingUserData?.year || 'Staff',
    createdAt: existingUserData?.createdAt || now,
    updatedAt: now,
  };

  // Neutral reputation summary: zero completed borrows, zero reviews, neutral 0.0 rating
  const adminPublicProfile: PublicProfile = {
    uid,
    displayName: adminUserProfile.displayName,
    photoURL: userRecord.photoURL || null,
    verificationBadge: true,
    completedBorrowCount: existingUserData ? (await publicDocRef.get()).data()?.completedBorrowCount || 0 : 0,
    ratingSummary: {
      averageRating: 0.0, // Neutral initial rating (no fabricated 5.0)
      totalReviews: 0,
    },
  };

  const batch = db.batch();
  batch.set(userDocRef, adminUserProfile, { merge: true });
  batch.set(publicDocRef, adminPublicProfile, { merge: true });

  // 7. Record immutable audit log
  const auditRef = db.collection('auditLogs').doc();
  batch.set(auditRef, {
    logId: auditRef.id,
    actorUid: 'SYSTEM_BOOTSTRAP_CLI',
    action: 'BOOTSTRAP_INITIAL_ADMIN',
    targetType: 'user',
    targetId: uid,
    metadata: {
      email: userRecord.email,
      claimsGranted: updatedClaims,
      timestamp: now,
    },
    timestamp: now,
  });

  await batch.commit();

  console.log(`✓ Private user profile synchronized ('users/${uid}')`);
  console.log(`✓ Public profile synchronized with neutral rating summary ('publicProfiles/${uid}')`);
  console.log(`✓ Administrative elevation audit event logged ('auditLogs/${auditRef.id}')`);
  console.log(`\n🎉 Success! Administrator account (${userRecord.email}) successfully provisioned.\n`);

  return { uid, email: userRecord.email, claims: updatedClaims };
}

if (require.main === module || process.argv[1]?.endsWith('bootstrap-admin.ts')) {
  bootstrapAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`\n❌ Bootstrap Aborted: ${err.message}\n`);
      process.exit(1);
    });
}
