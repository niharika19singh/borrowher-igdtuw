/**
 * BorrowHer — Shared TypeScript Contracts & Domain Models
 *
 * This file serves as the canonical contract across Backend Developer 1 (Niharika Singh),
 * Frontend Developer 1 (Marketplace), Frontend Developer 2 (Workflows & Identity),
 * and Backend Developer 2 (Transactions & Concurrency).
 */

// =============================================================================
// AUTHENTICATION & CUSTOM CLAIMS
// =============================================================================

export interface CustomClaims {
  admin?: boolean;
  verifiedStudent?: boolean;
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export type AccountStatus = 'active' | 'suspended';

// =============================================================================
// USER PROFILES (Firestore: users/{uid} & publicProfiles/{uid})
// =============================================================================

/**
 * Private user profile document (Stored in `users/{uid}`).
 * Strictly accessible by document owner and administrators.
 * Security fields are managed server-side only.
 */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  verificationStatus: VerificationStatus;
  programme?: string; // e.g. "B.Tech CSE", "B.Tech ECE", "M.Tech AI"
  year?: number | string; // e.g. 1, 2, 3, 4
  accountStatus: AccountStatus;
  rejectionReason?: string;
  createdAt: string; // ISO 8601 or Timestamp representation
  updatedAt: string;
}

/**
 * Public profile document (Stored in `publicProfiles/{uid}`).
 * Visible to verified students.
 * NEVER contains sensitive data (email, phone, hostel room number, verification docs).
 */
export interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  verificationBadge: boolean;
  completedBorrowCount: number;
  ratingSummary: {
    averageRating: number;
    totalReviews: number;
  };
}

// =============================================================================
// MARKETPLACE & LISTINGS (Firestore: listings/{listingId})
// =============================================================================

export type ListingStatus = 'draft' | 'active' | 'paused' | 'unavailable' | 'removed';

export type ListingCondition = 'new' | 'like-new' | 'good' | 'fair';

export type ListingMode = 'free_peer' | 'rental';

export interface Listing {
  listingId: string;
  ownerUid: string;
  title: string;
  description: string;
  categoryId: string;
  condition: ListingCondition;
  imagePaths: string[];
  mode: ListingMode;
  pricePerDay: number; // In INR. 0 for 'free_peer'
  depositAmount: number; // Refundable/simulated deposit in INR
  minDays: number; // Minimum borrowing duration (>= 1)
  maxDays: number; // Maximum borrowing duration (<= 30)
  pickupZoneIds: string[]; // Reference to approved pickupZones
  status: ListingStatus;
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingInput {
  title: string;
  description: string;
  categoryId: string;
  condition: ListingCondition;
  imagePaths: string[];
  mode: ListingMode;
  pricePerDay: number;
  depositAmount: number;
  minDays: number;
  maxDays: number;
  pickupZoneIds: string[];
  status?: 'draft' | 'active';
}

export interface UpdateListingInput {
  listingId: string;
  title?: string;
  description?: string;
  categoryId?: string;
  condition?: ListingCondition;
  imagePaths?: string[];
  mode?: ListingMode;
  pricePerDay?: number;
  depositAmount?: number;
  minDays?: number;
  maxDays?: number;
  pickupZoneIds?: string[];
  status?: 'active' | 'paused' | 'draft';
}

// =============================================================================
// CATEGORIES & CATALOG (Firestore: categories/{categoryId})
// =============================================================================

export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  allowedFields?: string[];
  icon?: string;
  displayOrder?: number;
}

// =============================================================================
// PICKUP ZONES (Firestore: pickupZones/{zoneId})
// =============================================================================

export type PickupZoneApprovalStatus = 'pending_review' | 'approved' | 'rejected';

export interface PickupZone {
  zoneId: string;
  label: string;
  campusArea: string;
  active: boolean; // Must be false until validated by campus administrator
  approvalStatus: PickupZoneApprovalStatus; // Explicitly 'pending_review' until validated
  guidance: string; // Neutral, unverified campus guidance (no unverified opening hours or security claims)
  accessNote: string; // Safety guidance reminding students to observe campus and hostel boundaries
}

// =============================================================================
// CALLABLE FUNCTION REQUEST & RESPONSE CONTRACTS
// =============================================================================

export interface EnsureUserProfileResponse {
  user: UserProfile;
  publicProfile: PublicProfile;
  isNewUser: boolean;
}

export interface ApproveStudentInput {
  uid: string;
  status: 'verified' | 'rejected' | 'suspended';
  reason?: string;
}

export interface ApproveStudentResponse {
  success: boolean;
  uid: string;
  verificationStatus: VerificationStatus;
  claimsUpdated: boolean;
}

export interface SetAdminRoleInput {
  targetUid: string;
  admin: boolean;
}

export interface SetAdminRoleResponse {
  success: boolean;
  targetUid: string;
  admin: boolean;
}

export interface PauseListingInput {
  listingId: string;
  paused: boolean;
}

export interface AdminModerateListingInput {
  listingId: string;
  status: 'active' | 'removed';
  moderationReason: string;
}

export interface AdminManageCategoryInput {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  allowedFields?: string[];
}
