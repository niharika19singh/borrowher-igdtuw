import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { handleCallableError } from '../shared/errors';
import { adminManageCategorySchema } from '../shared/validators';
import { Category } from '../shared/types';

/**
 * Admin action to create or update marketplace categories.
 */
export const adminManageCategory = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Admin authentication required');
  }

  if (request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Only administrators can manage marketplace categories');
  }

  try {
    const data = adminManageCategorySchema.parse(request.data);

    const categoryRef = db.collection('categories').doc(data.categoryId);
    const categoryDoc = await categoryRef.get();

    const categoryData: Category = {
      categoryId: data.categoryId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      active: data.active,
      allowedFields: data.allowedFields || [],
    };

    const batch = db.batch();
    batch.set(categoryRef, categoryData, { merge: true });

    const auditRef = db.collection('auditLogs').doc();
    batch.set(auditRef, {
      logId: auditRef.id,
      actorUid: request.auth.uid,
      action: categoryDoc.exists ? 'UPDATE_CATEGORY' : 'CREATE_CATEGORY',
      targetType: 'category',
      targetId: data.categoryId,
      metadata: categoryData,
      timestamp: new Date().toISOString(),
    });

    await batch.commit();

    return {
      success: true,
      category: categoryData,
    };
  } catch (error) {
    return handleCallableError(error);
  }
});
