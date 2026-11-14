import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { setAdminRoleSchema } from '../shared/validators';
import { SetAdminRoleResponse } from '../shared/types';

/**
 * Callable endpoint to grant or revoke administrator privilege.
 *
 * Security:
 * - Restricted exclusively to existing administrators (`token.admin === true`).
 * - For initial bootstrap of the first admin, use `scripts/bootstrap-admin.ts` instead.
 */
export const setAdminRole = onCall(async (request): Promise<SetAdminRoleResponse> => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Admin authentication required');
  }

  if (request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Only existing administrators can assign admin privileges');
  }

  try {
    const { targetUid, admin: makeAdmin } = setAdminRoleSchema.parse(request.data);

    // Prevent accidental self-demotion
    if (request.auth.uid === targetUid && !makeAdmin) {
      throw new HttpsError('failed-precondition', 'Administrators cannot revoke their own admin privilege directly');
    }

    const user = await auth.getUser(targetUid);
    const existingClaims = user.customClaims || {};

    const updatedClaims: Record<string, any> = {
      ...existingClaims,
    };

    if (makeAdmin) {
      updatedClaims.admin = true;
    } else {
      delete updatedClaims.admin;
    }

    await auth.setCustomUserClaims(targetUid, updatedClaims);

    const now = new Date().toISOString();
    // Audit log
    await db.collection('auditLogs').add({
      actorUid: request.auth.uid,
      action: makeAdmin ? 'GRANT_ADMIN_ROLE' : 'REVOKE_ADMIN_ROLE',
      targetType: 'user',
      targetId: targetUid,
      metadata: { targetEmail: user.email },
      timestamp: now,
    });

    return {
      success: true,
      targetUid,
      admin: makeAdmin,
    };
  } catch (error) {
    return handleCallableError(error);
  }
});
