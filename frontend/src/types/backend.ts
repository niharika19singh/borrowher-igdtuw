// FE-facing subset of BE1's canonical contracts, revision e40f8e3.
// Source: functions/src/shared/types.ts on feat/niharika/firebase-foundation-marketplace.
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  verificationStatus: "pending" | "verified" | "rejected" | "suspended";
  programme?: string;
  year?: number | string;
  accountStatus: "active" | "suspended";
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
export interface ListingSummary {
  listingId: string;
  title: string;
  status: string;
  moderationReason?: string;
}
