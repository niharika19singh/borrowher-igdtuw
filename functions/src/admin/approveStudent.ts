import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth, FUNCTIONS_REGION } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { approveStudentSchema } from '../shared/validators';
import { ApproveStudentResponse } from '../shared/types';

/**
 * Admin-only operation to review and set student verification status.
 *
 * Enforces:
 * - Caller must possess active `admin: true` custom claim.
 * - Sets `verifiedStudent` custom claim appropriately.
 * - On suspension: revokes active refresh tokens immediately to terminate existing sessions.
 * - Updates `users/{uid}` and `publicProfiles/{uid}` atomically.
 */
export const approveStudent = onCall(
  { region: FUNCTIONS_REGION },
  async (request): Promise<ApproveStudentResponse> => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Admin authentication required');
  }

  if (request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Only designated administrators can approve student verifications');
  }

  try {
    const { uid, status, reason } = approveStudentSchema.parse(request.data);

    const userDocRef = db.collection('users').doc(uid);
    const publicDocRef = db.collection('publicProfiles').doc(uid);

    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', `Student record for UID ${uid} does not exist`);
    }

    const isVerified = status === 'verified';
    const isSuspended = status === 'suspended';
    const now = new Date().toISOString();

    // 1. Update Auth Custom Claims
    const currentClaims = (await auth.getUser(uid)).customClaims || {};
    await auth.setCustomUserClaims(uid, {
      ...currentClaims,
      verifiedStudent: isVerified,
      accountStatus: isSuspended ? 'suspended' : 'active',
    });

    // 2. If suspending account, immediately revoke all active refresh tokens
    if (isSuspended) {
      await auth.revokeRefreshTokens(uid);
    }

    // 3. Update Firestore documents
    const batch = db.batch();
    batch.update(userDocRef, {
      verificationStatus: status,
      accountStatus: isSuspended ? 'suspended' : 'active',
      rejectionReason: status === 'rejected' ? (reason || 'Documentation did not meet criteria') : null,
      updatedAt: now,
    });

    batch.update(publicDocRef, {
      verificationBadge: isVerified,
    });

    // 3. Record audit log
    const auditLogRef = db.collection('auditLogs').doc();
    batch.set(auditLogRef, {
      logId: auditLogRef.id,
      actorUid: request.auth.uid,
      action: 'APPROVE_STUDENT_STATUS',
      targetType: 'user',
      targetId: uid,
      metadata: {
        newStatus: status,
        reason: reason || null,
      },
      timestamp: now,
    });

    await batch.commit();

    return {
      success: true,
      uid,
      verificationStatus: status,
      claimsUpdated: true,
    };
  } catch (error) {
    return handleCallableError(error);
  }
});
