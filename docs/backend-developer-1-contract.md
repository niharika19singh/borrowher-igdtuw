# BorrowHer — Backend Developer 1 Integration Contract

**Document Version:** 2.0  
**Backend Developer 1 (Niharika Singh):** Firebase Foundation, Auth, Verification, User Profiles, Marketplace Listings, Categories, Pickup Zones, Rules & Storage.  
**Audience:** Frontend Developer 1 (Marketplace), Frontend Developer 2 (Workflows & Identity), Backend Developer 2 (Transactions & Concurrency).

---

## 1. Scope Boundary Matrix

| Module | Owner | Status in this Delivery |
|---|---|---|
| Firebase Project Foundation & Emulator Config | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Auth & Student Verification Lifecycle | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| User Profile & Public Profile Collections | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Admin Claims Provisioning & Bootstrap | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Marketplace Listings & Category Catalog | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Campus Pickup Zones Data Model | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Firestore & Storage Security Rules | **Backend Dev 1 (Niharika)** | **Implemented & Verified** |
| Booking Concurrency, Slot Locks & State Machine | Backend Dev 2 | *Reserved (Not implemented in this scope)* |
| Handover & Return Bilateral Confirmations | Backend Dev 2 | *Reserved (Not implemented in this scope)* |
| Emergency Essentials Offers & Reminder Cron | Backend Dev 2 | *Reserved (Not implemented in this scope)* |
| Deposit Ledger & Simulated Demo Payments | Backend Dev 2 | *Reserved (Not implemented in this scope)* |
| Marketplace & Landing Page UI | Frontend Dev 1 | *Reserved (Not implemented in this scope)* |
| Auth, Dashboard, Booking Timeline & Admin UI | Frontend Dev 2 | *Reserved (Not implemented in this scope)* |

---

## 2. Firestore Collections & Document Schemas

### 2.1 `users/{uid}` (Private User Profile)
- **Access Rule:** Read permitted only for authenticated document owner (`request.auth.uid == uid`) or platform admin (`token.admin == true`). Client direct create/delete is forbidden.
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
- **Access Rule:** Readable by verified IGDTUW students (`token.verifiedStudent == true`) or admins. Writes strictly forbidden from client.
- **Privacy Guarantee:** NEVER contains phone numbers, email addresses, hostel room numbers, or verification documents.
- **TypeScript Interface:** `PublicProfile`

```typescript
export interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  verificationBadge: boolean;          // true when student is approved
  completedBorrowCount: number;        // Incremented upon completed bookings
  ratingSummary: {
    averageRating: number;             // e.g. 4.8
    totalReviews: number;              // e.g. 12
  };
}
```

### 2.3 `listings/{listingId}` (Marketplace Items)
- **Access Rule:** Active listings readable by verified students. Inactive/draft listings readable only by listing owner or admin.
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
- **Initial Categories Seeded:**
  1. `academic-books`: Academic & Books
  2. `electronics-calculators`: Electronics & Calculators
  3. `lab-project-equipment`: Lab & Project Equipment
  4. `clothing-interview`: Clothing & Interview Essentials
  5. `accessories`: Accessories
  6. `weather-daily`: Weather & Daily Essentials
  7. `other`: Other

### 2.5 `pickupZones/{zoneId}` (Approved Campus Locations)
- **Access Rule:** Readable by verified students. Modifiable only by administrators.
- **Approved Public Points Seeded:**
  1. `admin-block-foyer`: Administrative Block Foyer (Central Campus)
  2. `central-library-entry`: Central Library Main Entrance (Academic Zone)
  3. `it-department-gf`: IT & CSE Block Ground Floor Lobby (Departmental)
  4. `main-gate-reception`: Kashmere Gate Main Entrance Security Booth (Perimeter)
  5. `mechanical-workshop-entry`: Mechanical Engineering Workshop Entrance
  6. `audi-plaza`: Auditorium Plaza & Open Lawn (Common Areas)

---

## 3. Firebase Cloud Functions (2nd Gen) API Contract

All backend functions are callable via the Firebase Client SDK:
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions(app, 'asia-south1'); // or local emulator origin
```

### 3.1 `ensureUserProfile`
- **Purpose:** Idempotently initializes private `users/{uid}` and public `publicProfiles/{uid}` documents upon sign-up or first app launch.
- **Auth Required:** Yes (Authenticated user).
- **Parameters:** None (UID extracted from auth token).
- **Response:**
```typescript
{
  user: UserProfile;
  publicProfile: PublicProfile;
  isNewUser: boolean;
}
```

### 3.2 `updateUserProfile`
- **Purpose:** Allows a student to update elective academic details without exposing administrative fields.
- **Auth Required:** Yes.
- **Parameters:**
```typescript
{
  displayName?: string; // 2–100 chars
  programme?: string;   // e.g. "B.Tech CSE"
  year?: number | string; // e.g. 2
}
```
- **Response:** `{ success: true, uid: string, updates: Partial<UserProfile> }`

### 3.3 `createListing`
- **Purpose:** Creates and publishes a new marketplace item.
- **Auth Required:** Yes, caller MUST be a **verified student** (`token.verifiedStudent === true` or verified in database).
- **Parameters:**
```typescript
{
  title: string;              // 3–100 chars
  description: string;        // 10–2000 chars
  categoryId: string;         // Must be active category
  condition: 'new' | 'like-new' | 'good' | 'fair';
  imagePaths: string[];       // Max 5 paths
  mode: 'free_peer' | 'rental';
  pricePerDay: number;        // Must be 0 if mode === 'free_peer'
  depositAmount: number;      // >= 0
  minDays: number;            // >= 1
  maxDays: number;            // >= minDays and <= 30
  pickupZoneIds: string[];    // Array of approved pickup zone IDs
  status?: 'active' | 'draft';
}
```
- **Response:** Created `Listing` object.

### 3.4 `updateListing`
- **Purpose:** Modifies an existing listing owned by the caller.
- **Auth Required:** Yes, caller MUST be the listing owner.
- **Parameters:** `UpdateListingInput` (includes `listingId`).
- **Response:** Updated `Listing` object.

### 3.5 `pauseListing`
- **Purpose:** Toggles listing between active and paused states.
- **Auth Required:** Yes, caller MUST be owner or admin.
- **Parameters:** `{ listingId: string, paused: boolean }`
- **Response:** `{ success: true, listingId: string, status: 'paused' | 'active' }`

### 3.6 `getListing`
- **Purpose:** Retrieves complete listing details along with lender public reputation.
- **Auth Required:** Yes.
- **Parameters:** `{ listingId: string }`
- **Response:**
```typescript
{
  listing: Listing;
  lenderProfile: PublicProfile | null;
}
```

### 3.7 `approveStudent` (Admin Only)
- **Purpose:** Approves or rejects student verification requests and manages custom claims.
- **Auth Required:** Admin (`token.admin === true`).
- **Parameters:**
```typescript
{
  uid: string;
  status: 'verified' | 'rejected' | 'suspended';
  reason?: string;
}
```
- **Response:** `{ success: true, uid: string, verificationStatus: string, claimsUpdated: boolean }`

### 3.8 `setAdminRole` (Admin Only)
- **Purpose:** Promotes or demotes platform administrators.
- **Auth Required:** Admin (`token.admin === true`).
- **Parameters:** `{ targetUid: string, admin: boolean }`
- **Response:** `{ success: true, targetUid: string, admin: boolean }`

### 3.9 `adminModerateListing` (Admin Only)
- **Purpose:** Moderates/removes inappropriate item listings and writes audit log.
- **Auth Required:** Admin (`token.admin === true`).
- **Parameters:** `{ listingId: string, status: 'removed' | 'active', moderationReason: string }`
- **Response:** `{ success: true, listingId: string, status: string }`

---

## 4. Cloud Storage Conventions

| Media Type | Storage Path Pattern | Max Size | Allowed MIME Types | Access Rules |
|---|---|---|---|---|
| Listing Images | `listing-images/{uid}/{listingId}/{fileName}` | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Upload: Verified owner only. Read: Verified students. |
| Transaction Evidence | `booking-evidence/{bookingId}/{uid}/{fileName}` | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Upload: Participant only. Read: Participants & Admin. |

---

## 5. Client Queries & Firestore Composite Indexes

Frontend Developer 1 should use the following Firestore queries for the marketplace view:

1. **Browse All Active Listings:**
   ```typescript
   query(collection(db, 'listings'), where('status', '==', 'active'), orderBy('createdAt', 'desc'))
   ```
2. **Filter by Category:**
   ```typescript
   query(collection(db, 'listings'), where('status', '==', 'active'), where('categoryId', '==', selectedCat), orderBy('createdAt', 'desc'))
   ```
3. **Filter by Condition:**
   ```typescript
   query(collection(db, 'listings'), where('status', '==', 'active'), where('condition', '==', selectedCond), orderBy('createdAt', 'desc'))
   ```
4. **Filter by Mode:**
   ```typescript
   query(collection(db, 'listings'), where('status', '==', 'active'), where('mode', '==', selectedMode), orderBy('createdAt', 'desc'))
   ```
5. **Filter by Pickup Zone:**
   ```typescript
   query(collection(db, 'listings'), where('status', '==', 'active'), where('pickupZoneIds', 'array-contains', selectedZone), orderBy('createdAt', 'desc'))
   ```
6. **Owner's Listings (Lender Dashboard):**
   ```typescript
   query(collection(db, 'listings'), where('ownerUid', '==', currentUid), orderBy('createdAt', 'desc'))
   ```

*Note: All corresponding composite indexes are already declared in `firestore.indexes.json`.*
