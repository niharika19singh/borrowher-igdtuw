# BorrowHer — Backend Developer 1 Integration Contract

**Document Version:** 2.1 (Security Hardened & Region Pinned)  
**Backend Developer 1 (Niharika Singh):** Firebase Foundation, Auth, Verification, User Profiles, Marketplace Listings, Categories, Pickup Zones, Security Rules & Storage.  
**Audience:** Frontend Developer 1 (Marketplace), Frontend Developer 2 (Workflows & Identity), Backend Developer 2 (Transactions & Concurrency).

---

## 1. Scope Boundary Matrix

| Module | Owner | Status in this Delivery |
|---|---|---|
| Firebase Foundation & Region Configuration (`asia-south1`) | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Auth & Student Verification Lifecycle | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| User Profile & Public Profile Collections | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Secure Admin Bootstrap (`--confirm` & verified email) | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Marketplace Listings & Category Catalog | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Pickup Zones Model (`pending_review` & `active: false`) | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Firestore Rules (Mutation Lock on Listings & Suspended User Gate) | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Cloud Storage Rules (`booking-evidence` lockdown) | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Booking Concurrency, Slot Locks & State Machine | Backend Dev 2 | *Reserved (Not implemented in this scope)* |
| Handover & Return Bilateral Confirmations | Backend Dev 2 | *Reserved (Not implemented in this scope)* |
| Booking Evidence Participant Validation | Backend Dev 2 | *Reserved (Not implemented in this scope)* |
| Emergency Essentials Offers & Reminder Cron | Backend Dev 2 | *Reserved (Not implemented in this scope)* |
| Deposit Ledger & Simulated Demo Payments | Backend Dev 2 | *Reserved (Not implemented in this scope)* |
| Marketplace & Landing Page UI | Frontend Dev 1 | *Reserved (Not implemented in this scope)* |
| Auth, Dashboard, Booking Timeline & Admin UI | Frontend Dev 2 | *Reserved (Not implemented in this scope)* |

---

## 2. Firestore Collections & Security Rules

### 2.1 `users/{uid}` (Private User Profile)
- **Access Rule:** Read permitted only for authenticated document owner (`request.auth.uid == uid`) or platform admin (`token.admin == true`). Client creation/deletion forbidden.
- **Elective Profile Updates:** Students can update `displayName`, `programme`, and `year`. Security-critical fields (`verificationStatus`, `accountStatus`, `email`, `uid`) cannot be altered from the client.
- **TypeScript Interface:** `UserProfile`

```typescript
export interface UserProfile {
  uid: string;                         // Matches Firebase Auth UID
  displayName: string;                 // Student name
  email: string;                       // Student email address
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';
  programme?: string;                  // e.g. "B.Tech CSE", "B.Tech IT"
  year?: number | string;              // e.g. 1, 2, 3, 4
  accountStatus: 'active' | 'suspended';
  rejectionReason?: string;
  createdAt: string;                   // ISO 8601 string
  updatedAt: string;
}
```

### 2.2 `publicProfiles/{uid}` (Public Student Profile)
- **Access Rule:** Readable by verified IGDTUW students (`token.verifiedStudent == true` AND `users/{uid}.accountStatus == 'active'`) or admins. All client writes forbidden (`allow write: if isAdmin();`).
- **Privacy Guarantee:** NEVER contains phone numbers, email addresses, hostel room numbers, or verification documents.
- **Reputation Policy:** Initial accounts start with zero completed borrows and neutral rating (`averageRating: 0.0, totalReviews: 0`). Fabricated 5-star ratings are prohibited.
- **TypeScript Interface:** `PublicProfile`

```typescript
export interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  verificationBadge: boolean;          // true when student is approved
  completedBorrowCount: number;        // Incremented upon completed bookings
  ratingSummary: {
    averageRating: number;             // Neutral 0.0 on creation
    totalReviews: number;              // 0 on creation
  };
}
```

### 2.3 `listings/{listingId}` (Marketplace Items)
- **Read Access:** Active listings (`status == 'active'`) are readable by verified, active students (`isVerifiedStudent()`). Inactive/draft/paused listings are readable only by the listing owner or platform administrator.
- **Write Access (Critical Security Hardening):** Direct client-side listing creation, updating, and deletion are **strictly denied** (`allow create, update, delete: if false;`).
  - **All mutations MUST go through trusted Cloud Functions:** `createListing`, `updateListing`, `pauseListing`, `adminModerateListing`.
  - The Firebase Admin SDK in Cloud Functions bypasses client security rules while enforcing rigorous server-side validation and current account status checks.
- **TypeScript Interface:** `Listing`

```typescript
export type ListingStatus = 'draft' | 'active' | 'paused' | 'unavailable' | 'removed';
export type ListingCondition = 'new' | 'like-new' | 'good' | 'fair';
export type ListingMode = 'free_peer' | 'rental';

export interface Listing {
  listingId: string;                   // Unique UUID / doc ID
  ownerUid: string;                    // Owner student UID
  title: string;                       // 3–100 chars
  description: string;                 // 10–2000 chars
  categoryId: string;                  // Valid categoryId from 'categories'
  condition: ListingCondition;
  imagePaths: string[];                // Up to 5 paths in Cloud Storage
  mode: ListingMode;                   // 'free_peer' or 'rental'
  pricePerDay: number;                 // INR. Must be 0 if mode is 'free_peer'
  depositAmount: number;               // Refundable simulated deposit in INR
  minDays: number;                     // Minimum borrow duration (>= 1)
  maxDays: number;                     // Maximum borrow duration (<= 30)
  pickupZoneIds: string[];             // Array of approved pickupZone IDs
  status: ListingStatus;
  moderationReason?: string;           // Set if taken down by administrator
  createdAt: string;
  updatedAt: string;
}
```

### 2.4 `categories/{categoryId}` (Catalog Taxonomy)
- **Access Rule:** Readable by all authenticated users. Modifiable only by administrators.
- **Active Categories:**
  1. `academic-books`: Academic & Books
  2. `electronics-calculators`: Electronics & Calculators
  3. `lab-project-equipment`: Lab & Project Equipment
  4. `clothing-interview`: Clothing & Interview Essentials
  5. `accessories`: Accessories
  6. `weather-daily`: Weather & Daily Essentials
  7. `other`: Other

### 2.5 `pickupZones/{zoneId}` (Campus Exchange Points)
- **Access Rule:** Readable by verified students. Modifiable only by administrators.
- **Approval & Safety Policy:**
  - All proposed campus points are initialized with `active: false` and `approvalStatus: 'pending_review'`.
  - Inactive locations **cannot** be used to publish listings. `createListing` checks that all selected pickup zones have `active === true && approvalStatus === 'approved'`.
  - University hostel room addresses and private residences are strictly prohibited.
  - Students must observe academic working hours and campus safety boundaries.

```typescript
export type PickupZoneApprovalStatus = 'pending_review' | 'approved' | 'rejected';

export interface PickupZone {
  zoneId: string;
  label: string;
  campusArea: string;
  active: boolean;                     // false until verified by administrator
  approvalStatus: PickupZoneApprovalStatus; // 'pending_review' | 'approved' | 'rejected'
  guidance: string;                    // Neutral safety guidance
  accessNote: string;                  // Campus boundary & hostel restriction notice
}
```

---

## 3. Firebase Cloud Functions (2nd Gen) API Contract

All backend Cloud Functions are configured for deployment to the **`asia-south1` (Mumbai)** region.  
*Note on Infrastructure:* Regional configuration in code defines target deployment routing. Physical resource residency depends on project creation and resource provisioning in the Google Cloud / Firebase Console.

Frontend developers **MUST** initialize the Firebase Functions SDK with this explicit region:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions(app, 'asia-south1');
```

### 3.1 `ensureUserProfile`
- **Region:** `asia-south1`
- **Purpose:** Idempotently initializes private `users/{uid}` and public `publicProfiles/{uid}` documents upon sign-up or first app launch.
- **Auth Required:** Authenticated student.
- **Response:** `{ user: UserProfile, publicProfile: PublicProfile, isNewUser: boolean }`

### 3.2 `updateUserProfile`
- **Region:** `asia-south1`
- **Purpose:** Allows student to update elective academic details without exposing administrative fields.
- **Auth Required:** Authenticated student with `accountStatus === 'active'` and `verificationStatus === 'verified'`.
- **Parameters:** `{ displayName?: string, programme?: string, year?: number | string }`
- **Response:** `{ success: true, uid: string, updates: Partial<UserProfile> }`

### 3.3 `createListing`
- **Region:** `asia-south1`
- **Purpose:** Creates and publishes a new marketplace item. Direct client writes to `listings` are blocked by security rules.
- **Auth Required:** Verified active student. Enforces strict check against live Firestore user profile: `accountStatus === 'active'` and `verificationStatus === 'verified'`. Rejects missing, undefined, or malformed account states.
- **Validation:** Enforces active category and verified pickup zones (`approvalStatus === 'approved' && active === true`).
- **Parameters:** `CreateListingInput`
- **Response:** Created `Listing` object.

### 3.4 `updateListing`
- **Region:** `asia-south1`
- **Purpose:** Modifies an existing listing owned by caller. Direct client writes are blocked by security rules. Combines incoming fields with the existing listing and authoritatively validates the complete resulting state (enforcing `maxDays >= minDays`, `free_peer` mode requires `pricePerDay === 0`, and `rental` mode requires valid non-negative pricing).
- **Auth Required:** Listing owner with `accountStatus === 'active'` and `verificationStatus === 'verified'` (or authorized administrator). Rejects missing, undefined, or malformed account states.
- **Parameters:** `UpdateListingInput` (includes `listingId`).
- **Response:** Updated `Listing` object.

### 3.5 `pauseListing`
- **Region:** `asia-south1`
- **Purpose:** Toggles listing between active and paused states. Direct client writes are blocked by security rules.
- **Auth Required:** Listing owner with `accountStatus === 'active'` and `verificationStatus === 'verified'` (or authorized administrator). Rejects missing, undefined, or malformed account states.
- **Parameters:** `{ listingId: string, paused: boolean }`
- **Response:** `{ success: true, listingId: string, status: 'paused' | 'active' }`

### 3.6 `getListing`
- **Region:** `asia-south1`
- **Purpose:** Retrieves complete listing details along with lender public reputation.
- **Auth Required:** Live Firestore user document verification: requires `accountStatus === 'active'` AND `verificationStatus === 'verified'`. Stale `verifiedStudent` token claims are rejected. Listing ownership does NOT bypass this verification gate. Administrators retain authorized moderation access without requiring student verification.
- **Parameters:** `{ listingId: string }`
- **Response:** `{ listing: Listing, lenderProfile: PublicProfile | null }`

### 3.7 `approveStudent` (Admin Only)
- **Region:** `asia-south1`
- **Purpose:** Approves, rejects, or suspends student verification.
- **Auth Required:** Admin (`token.admin === true`).
- **Session Revocation:** When an account is suspended (`status === 'suspended'`), the function immediately calls `auth.revokeRefreshTokens(uid)` to invalidate all active sessions.
- **Parameters:** `{ uid: string, status: 'verified' | 'rejected' | 'suspended', reason?: string }`
- **Response:** `{ success: true, uid: string, verificationStatus: string, claimsUpdated: boolean }`

### 3.8 `setAdminRole` (Admin Only)
- **Region:** `asia-south1`
- **Purpose:** Promotes or demotes platform administrators. Self-demotion is blocked.
- **Auth Required:** Admin (`token.admin === true`).
- **Parameters:** `{ targetUid: string, admin: boolean }`
- **Response:** `{ success: true, targetUid: string, admin: boolean }`

### 3.9 `adminModerateListing` (Admin Only)
- **Region:** `asia-south1`
- **Purpose:** Moderates/removes inappropriate item listings and writes an audit log.
- **Auth Required:** Admin (`token.admin === true`).
- **Parameters:** `{ listingId: string, status: 'removed' | 'active', moderationReason: string }`
- **Response:** `{ success: true, listingId: string, status: string }`

---

## 4. Cloud Storage Conventions

| Media Type | Storage Path Pattern | Max Size | Allowed MIME Types | Access Rules |
|---|---|---|---|---|
| Listing Images | `listing-images/{uid}/{listingId}/{fileName}` | 5 MB | `image/jpeg`, `image/png`, `image/webp` | **Upload:** Owner UID check + cross-service Firestore verification (`accountStatus === 'active'` and `verificationStatus === 'verified'`). **Read:** Cross-service verified active students or platform admins. |
| Transaction Evidence | `booking-evidence/{bookingId}/{uid}/{fileName}` | 5 MB | N/A | **Locked down (`allow read, write: if false;`).** Reserved for Backend Dev 2 participant authorization. |

### 4.1 Cross-Service Rule Accounting & Resource Limits
- Cloud Storage Security Rules evaluate `firestore.exists(/databases/(default)/documents/users/$(request.auth.uid))` and `firestore.get(...)` to prevent students with stale JWT claims from reading or uploading images if suspended.
- Each cross-service evaluation incurs 1 Firestore document read operation.
- Storage security rules enforce a maximum limit of 10 Firestore read calls per rule evaluation.
- Calls are short-circuited: unauthenticated requests or requests without `verifiedStudent` claims never query Firestore, avoiding unnecessary billable operations.

---

## 5. Administrator Provisioning & Administrative Scripts

To prevent accidental modifications to live infrastructure, all administrative scripts (`bootstrap-admin.ts`, `seed-categories.ts`, `seed-pickup-zones.ts`) require explicit project selection:

```bash
# Explicit project ID is required via CLI flag or environment variable (implicit defaults are prohibited):
npm run bootstrap:admin -- --project demo-borrowher --email faculty-admin@igdtuw.ac.in --confirm

# Seeding proposed categories and pickup zones:
npm run seed:categories -- --project demo-borrowher
npm run seed:pickup-zones -- --project demo-borrowher
```

**Security Safeguards Enforced:**
1. **Explicit Project Selection:** Rejects execution if `--project <projectId>` or `FIREBASE_PROJECT_ID` is missing.
2. **Environment Prominence:** Prints target project ID and execution mode (`Local Firebase Emulator` vs `LIVE / PRODUCTION CLOUD`) before executing.
3. **Pre-existing Verified Account:** Candidate account **MUST** already be registered in Firebase Authentication with `emailVerified === true`.
4. **Mandatory Confirmation:** Confirmation flag (`--confirm` or `CONFIRM_BOOTSTRAP=true`) is strictly required.
5. **Neutral Baseline:** Initial public profile rating is neutral (`averageRating: 0.0, totalReviews: 0`).
6. **Immutable Audit Logging:** Audit event (`BOOTSTRAP_INITIAL_ADMIN`) is written to `auditLogs`.
