// Canonical BE1 contracts synced with functions/src/shared/types.ts (main @ 3134c24).

export type VerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";
export type AccountStatus = "active" | "suspended";
export type ListingCondition = "new" | "like-new" | "good" | "fair";
export type ListingMode = "free_peer" | "rental";
export type ListingStatus =
  | "draft"
  | "active"
  | "paused"
  | "unavailable"
  | "removed";
export type PickupZoneApprovalStatus =
  | "pending_review"
  | "approved"
  | "rejected";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  verificationStatus: VerificationStatus;
  programme?: string;
  year?: number | string;
  accountStatus: AccountStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  verificationBadge: boolean;
  completedBorrowCount: number;
  ratingSummary: { averageRating: number; totalReviews: number };
}

export interface Listing {
  listingId: string;
  ownerUid: string;
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
  status: ListingStatus;
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  allowedFields?: string[];
}

export interface PickupZone {
  zoneId: string;
  label: string;
  campusArea: string;
  active: boolean;
  approvalStatus: PickupZoneApprovalStatus;
  guidance: string;
  accessNote: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface EnsureUserProfileResponse {
  user: UserProfile;
  publicProfile: PublicProfile;
  isNewUser: boolean;
}

export interface ApproveStudentInput {
  uid: string;
  status: "verified" | "rejected" | "suspended";
  reason?: string;
}

export interface ApproveStudentResponse {
  success: boolean;
  uid: string;
  verificationStatus: UserProfile["verificationStatus"];
  claimsUpdated: boolean;
}

export interface AdminModerateListingInput {
  listingId: string;
  status: "active" | "removed";
  moderationReason: string;
}

export interface AdminManageCategoryInput {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  active?: boolean;
  allowedFields?: string[];
}

export interface AdminManageCategoryResponse {
  success: boolean;
  category: Category;
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
  status?: "draft" | "active";
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
  status?: "draft" | "active" | "paused";
}

export interface PauseListingInput {
  listingId: string;
  paused: boolean;
}

export interface PauseListingResponse {
  success: boolean;
  listingId: string;
  status: "paused" | "active";
}

export interface GetListingResponse {
  listing: Listing;
  lenderProfile: PublicProfile | null;
}

export interface ListingSummary {
  listingId: string;
  title: string;
  status: string;
  moderationReason?: string;
}
