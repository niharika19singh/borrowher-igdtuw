/**
 * BorrowHer — Cloud Functions 2nd Generation Entrypoint
 *
 * Owned and implemented by Backend Developer 1 (Niharika Singh).
 * Provides trusted serverless APIs for Auth & Verification, Profiles,
 * Admin claims provisioning, and Marketplace Listing operations.
 *
 * Standard deployment region: asia-south1 (Mumbai)
 */

import { setGlobalOptions } from 'firebase-functions/v2';
import { FUNCTIONS_REGION } from './config/firebase';

// Enforce asia-south1 region globally across all 2nd Gen Cloud Functions
setGlobalOptions({
  region: FUNCTIONS_REGION,
  maxInstances: 10,
});

// Auth & User Profile Functions
export { ensureUserProfile } from './auth/ensureUserProfile';
export { updateUserProfile } from './users/updateUserProfile';

// Admin Operations
export { approveStudent } from './admin/approveStudent';
export { setAdminRole } from './admin/setAdminRole';
export { adminModerateListing } from './admin/adminModerateListing';
export { adminManageCategory } from './admin/adminManageCategory';

// Marketplace & Listing Operations
export { createListing } from './listings/createListing';
export { updateListing } from './listings/updateListing';
export { pauseListing } from './listings/pauseListing';
export { getListing } from './listings/getListing';
