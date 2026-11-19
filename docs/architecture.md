# BorrowHer — System Architecture & Course Alignment (V2.0)

> **Platform:** React + Vite | Firebase 2nd Gen | Vercel  
> **Course:** Cloud-Based Full Stack Application Development  
> **Domain:** Education (IGDTUW Campus Resource Sharing Economy)

---

## 1. Domain Framing: Education
BorrowHer is built for the higher-education domain. Its core purpose is solving short-term access deficits for university students:
- Textbooks, semester reference books, lab manuals
- Scientific calculators (Casio fx-991EX), lab coats, safety gear
- Microcontroller boards (Arduino, Raspberry Pi), multimeters, project sensors
- Formal attire for university placement interviews and presentations
- Seasonal emergency items (umbrellas during sudden monsoon downpours)

---

## 2. Cloud-Based Architecture Justification

1. **Managed Serverless Scaling:** Student campus demand fluctuates drastically based on the academic calendar (semester examinations, practical lab weeks, placement season, monsoon rains). Serverless functions (Cloud Functions 2nd Gen) pinned to Node.js 22 runtime and configured for `asia-south1` (Mumbai) along with fully managed Cloud Firestore automatically scale to zero during idle periods and absorb concurrent spikes without manual server administration.
2. **Regional Configuration Alignment:** The backend codebase explicitly configures `region: 'asia-south1'` across all Cloud Functions 2nd Gen exports. Frontend callers initialize the Functions SDK with `getFunctions(app, 'asia-south1')`. Note that regional configuration in code specifies target routing; actual physical resource location depends on Google Cloud / Firebase project provisioning.
3. **Real-Time Data Synchronisation:** Item availability and booking state transitions must remain in immediate synchronization across borrower and lender devices. Firestore snapshot listeners eliminate manual polling and stale state.
4. **Decoupled Edge Deployment:** Frontend assets are delivered via Vercel's global CDN edge network to optimize distribution across student devices, completely independent from backend database operations.
5. **Resilient Object Storage:** Media assets (item photographs and condition proofs) are stored in Cloud Storage with strict byte limits and MIME validation rather than embedding binary data in database records.

---

## 3. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|   Mobile & Desktop Browsers (Verified IGDTUW Students & Administrators) |
+-------------------------------------------------------------------------+
                                    │
                                    │ HTTPS / CDN
                                    ▼
+-------------------------------------------------------------------------+
|                         PRESENTATION DELIVERY                           |
|         Vercel Edge Platform (React + Vite + TypeScript + Tailwind)     |
+-------------------------------------------------------------------------+
            │                                    │
            │ Direct Reads & Snapshots           │ Trusted Operations
            ▼                                    ▼
+-----------------------+              +----------------------------------+
|    CLOUD FIRESTORE    |              |   FIREBASE CLOUD FUNCTIONS V2    |
| - users               |              | - ensureUserProfile              |
| - publicProfiles      |              | - approveStudent                 |
| - listings            |◀─────────────| - setAdminRole                   |
| - categories          | Admin SDK    | - createListing / updateListing  |
| - pickupZones         | Writes       | - pauseListing / getListing      |
| - bookingSlots (BE2)  |              | - adminModerateListing           |
| - bookings (BE2)      |              +----------------------------------+
+-----------------------+                                │
            │                                            │
            ▼                                            ▼
+-----------------------+              +----------------------------------+
|     CLOUD STORAGE     |              |     FIREBASE AUTHENTICATION      |
| listing-images/       |              | Email/Password + Custom Claims   |
| booking-evidence/     |              | { admin, verifiedStudent }       |
+-----------------------+              +----------------------------------+
```

---

## 4. Multi-Layer Access Control Model

| Layer | Responsibility | Mechanism |
|---|---|---|
| **Identity & Authentication** | Email/Password credentials, verification state | Firebase Authentication |
| **Coarse Privileges** | Administrative privilege, campus student verification | Firebase Custom Claims (`admin`, `verifiedStudent`) |
| **Client Storage & DB Rules** | Guard direct reads/writes, file types, sizes, ownership | `firestore.rules` and `storage.rules` |
| **Server-Side Validation** | Enforce business invariants, category existence, zones | Zod Schemas & Cloud Functions 2nd Gen |
| **Audit Trail** | System traceability for privileged actions | Server-append only `auditLogs` collection |

---

## 5. Security Architecture Hardening (V2.1 Hardening Pass)

### 5.1 Direct Listing Mutation Lockdown
In accordance with defense-in-depth principles:
- Direct client-side listing creation, updating, and deletion are explicitly denied in `firestore.rules`:
  ```
  match /listings/{listingId} {
    allow read: if isVerifiedStudent() && (resource.data.status == 'active' || resource.data.lenderId == request.auth.uid || isAdmin());
    allow create, update, delete: if false; // All mutations must go through trusted Cloud Functions
  }
  ```
- All marketplace write operations must execute through trusted Cloud Functions 2nd Gen (`createListing`, `updateListing`, `pauseListing`, `adminModerateListing`).
- Bypassing rules is safely handled via the Firebase Admin SDK within the Cloud Functions environment after thorough Zod payload validation and business rule checks.

### 5.2 Real-Time Suspended-Account Enforcement
To eliminate the token expiration window (up to 60 minutes) when an account is suspended:
1. **Firestore Rule Verification:** The `isVerifiedStudent()` helper function queries the user's live Firestore profile `users/$(request.auth.uid)` to ensure `accountStatus == 'active'` and `verificationStatus == 'verified'`.
2. **Cloud Functions Dual Check:** All listing callable functions (`createListing`, `updateListing`, `pauseListing`) verify that the caller's Firestore account is active prior to processing.
3. **Immediate Token Revocation:** When an administrator suspends or rejects an account in `approveStudent`, the Firebase Auth refresh tokens are immediately revoked (`auth.revokeRefreshTokens(uid)`).

### 5.3 Storage Access Boundaries & Backend 2 Handover
- **Listing Images:** Client uploads directly to `listing-images/{uid}/{imageId}` subject to strict validation: authentication, ownership check (`request.auth.uid == uid`), MIME-type restriction (`image/jpeg`, `image/png`, `image/webp`), and file size constraint (< 5 MB).
- **Booking Evidence Lockdown:** Direct client read and write access to `booking-evidence/{bookingId}/{uid}/{fileName}` is denied (`allow read, write: if false;`). This path is reserved for Backend Developer 2, who will implement bilateral borrower/lender participant checks when booking handover and condition verification workflows are introduced.

### 5.4 Campus Pickup Zone Governance
- To uphold safety and avoid unsupported claims of university monitoring or round-the-clock availability, all seeded pickup locations start with `active: false` and `approvalStatus: 'pending_review'`.
- Locations require formal administrator review and activation before they can be selected in `createListing`.
- Listings referencing unapproved or inactive zones are rejected during creation and updates.
- Physical campus rules, building operating hours, and hostel visitor boundaries must be strictly observed.

### 5.5 Secure Administrator Bootstrap Protocol
The administrator bootstrap script (`scripts/bootstrap-admin.ts`) enforces strict security safeguards:
- **No Hardcoded Credentials:** Eliminates default emails and passwords.
- **Pre-existing Verified Account Required:** The targeted user account must already be registered in Firebase Auth and have `emailVerified: true`.
- **Explicit CLI Confirmation:** Requires passing the `--confirm` flag alongside `--email <email>` or `--uid <uid>`.
- **Neutral Baseline Metrics:** Initializes user profiles with a neutral 0.0 rating and 0 reviews (no fabricated ratings).
- **Immutable Audit Logging:** Records a timestamped entry in the `auditLogs` collection documenting the bootstrap action.
