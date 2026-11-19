# BorrowHer — The IGDTUW Campus Sharing Economy

> **Course:** Cloud-Based Full Stack Application Development  
> **Academic Domain:** Education  
> **Target Users:** Verified students and designated administrators of Indira Gandhi Delhi Technical University for Women (IGDTUW)  
> **Architecture Version:** 2.0  
> **Frontend Hosting:** Vercel (React + Vite + TypeScript + Tailwind CSS)  
> **Cloud Backend:** Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions 2nd Gen (Node.js 22 + TypeScript, region: asia-south1)  
> **Repository:** [https://github.com/niharika19singh/borrowher-igdtuw](https://github.com/niharika19singh/borrowher-igdtuw)

---

## 1. Project Overview & Mission

IGDTUW students frequently require essential academic and campus items for brief periods:
- **Academic Essentials:** Semester textbooks, course reference guides, lab manuals.
- **Electronics & Lab Gear:** Scientific calculators (Casio fx-991EX), laboratory coats, safety goggles, drafting drafters, multimeters, and microcontrollers (Arduino, Raspberry Pi).
- **Placement & Interview Attire:** Formal blazers, presentation accessories, and interview clothing.
- **Daily & Weather Supplies:** Umbrellas for sudden monsoon rains, power banks, presentation adapters (HDMI/VGA).

Purchasing every item individually imposes unnecessary financial burdens. **BorrowHer** provides a campus-exclusive peer-to-peer sharing marketplace where verified IGDTUW students can list under-utilised resources, discover nearby availability, coordinate safe handovers at approved campus locations, and build reputation through successful borrowing transactions.

---

## 2. Cloud Architecture

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
| - bookings (BE2)      |              | - adminManageCategory            |
+-----------------------+              +----------------------------------+
            │                                    │
            ▼                                    ▼
+-----------------------+              +----------------------------------+
|     CLOUD STORAGE     |              |     FIREBASE AUTHENTICATION      |
| listing-images/       |              | Email/Password + Custom Claims   |
| booking-evidence/     |              | { admin, verifiedStudent }       |
+-----------------------+              +----------------------------------+
```

### Why a Cloud Backend?
1. **Serverless Autoscale:** Handles dramatic campus traffic fluctuations (examination weeks, practical labs, monsoon spikes) without managing server infrastructure.
2. **Real-Time Synchronisation:** Firestore snapshot listeners update listing availability and booking states instantaneously across borrower and lender devices.
3. **Defense-in-Depth Security:** Granular Firestore and Storage Security Rules prevent unverified students from accessing restricted marketplace features and protect private user records.
4. **Resilient Object Storage:** High-resolution item photos are stored in Cloud Storage with strict file-size (<5MB) and MIME-type restrictions.

---

## 3. Repository Branching Strategy

| Branch | Description | Assigned Owner |
|---|---|---|
| `main` | Production-ready baseline and stable release branch | Shared |
| `feat/niharika/firebase-foundation-marketplace` | **Backend Developer 1 implementation:** Firebase project foundation, Auth & verification, user profiles, marketplace listings, categories, pickup zones, security rules, indexes, contracts, and tests | Niharika Singh |

*Note: Frontend Developers (FE1, FE2) and Backend Developer 2 (BE2) will branch directly from `main` to implement their modules independently.*

---

## 4. Four-Person Development Responsibility Matrix

| Role | Developer | Assigned Ownership | Status |
|---|---|---|---|
| **Backend Developer 1** | **Niharika Singh** | Firebase setup, Auth, verification lifecycle, user profiles, marketplace listings, categories, pickup zones, Firestore/Storage rules, indexes, shared contracts, emulator tests | **Complete & Verified** |
| **Frontend Developer 1** | Team Member | Landing page, marketplace search & filters, category chips, item detail, create/edit listing UI, photo upload | Future Feature Branch |
| **Frontend Developer 2** | Team Member | Auth forms, borrower/lender dashboard, booking timeline, emergency board, notifications, public profile, admin console | Future Feature Branch |
| **Backend Developer 2** | Team Member | Booking lifecycle, atomic date-slot locking, handover/return bilateral confirmation, Emergency offers, due-date reminder cron, simulated deposit ledger | Future Feature Branch |

---

## 5. Directory  Structure

```
borrowher-igdtuw/
├── .firebaserc.example        # Firebase project alias template
├── .env.example               # Frontend and backend environment variables template
├── .gitignore                 # Excludes secrets, credentials, logs, and build artifacts
├── firebase.json              # Firebase Emulators, Firestore, Storage & Functions configuration
├── firestore.rules            # Granular Firestore security rules with helper functions
├── firestore.indexes.json     # Composite query indexes for marketplace browsing & filtering
├── storage.rules              # Cloud Storage access rules (MIME, size, ownership checks)
├── package.json               # Root scripts, Vitest test suites, and admin dependencies
├── tsconfig.json              # Root TypeScript compiler options
├── README.md                  # Comprehensive project documentation
│
├── docs/
│   ├── architecture.md                     # Architecture Version 2.0 system specifications
│   └── backend-developer-1-contract.md     # Integration contract for FE1, FE2, and BE2
│
├── frontend/
│   └── README.md              # Frontend team integration guide and route specifications
│
├── functions/
│   ├── package.json           # Cloud Functions dependencies (Firebase Admin, Functions v2, Zod)
│   ├── tsconfig.json          # Functions TypeScript compiler configuration (ES2022 / CommonJS)
│   └── src/
│       ├── index.ts           # Cloud Functions v2 export entrypoint
│       ├── config/
│       │   └── firebase.ts    # Firebase Admin SDK initialization and service instances
│       ├── shared/
│       │   ├── types.ts       # Canonical TypeScript domain models and contracts
│       │   ├── validators.ts  # Zod validation schemas for listings, profiles, and admin ops
│       │   └── errors.ts      # Structured HttpsError factories and exception handlers
│       ├── auth/
│       │   └── ensureUserProfile.ts # Idempotent profile initialization function
│       ├── users/
│       │   └── updateUserProfile.ts # Safe elective student profile update function
│       ├── admin/
│       │   ├── approveStudent.ts    # Admin verification approval and custom claims assignment
│       │   ├── setAdminRole.ts      # Controlled admin role elevation with audit logging
│       │   ├── adminModerateListing.ts # Admin listing takedown and moderation
│       │   └── adminManageCategory.ts  # Admin catalog category management
│       └── listings/
│           ├── createListing.ts # Validated listing creation function
│           ├── updateListing.ts # Owner listing update function
│           ├── pauseListing.ts  # Owner pause/resume availability function
│           └── getListing.ts    # Detailed listing query with lender reputation
│
├── scripts/
│   ├── seed-categories.ts     # Seeds the 7 approved academic and campus categories
│   ├── seed-pickup-zones.ts   # Seeds approved IGDTUW public campus exchange points
│   └── bootstrap-admin.ts     # CLI tool to securely bootstrap the root administrator
│
└── tests/
    ├── unit/
    │   ├── validators.test.ts      # Unit tests for listing and admin validation schemas
    │   └── functions-logic.test.ts # Unit tests for error handling and profile invariants
    └── rules/
        ├── firestore.rules.test.ts # Security rules tests for users, listings, categories, zones
        └── storage.rules.test.ts   # Storage rules tests for image upload, MIME, size, cross-user
```

---

## 6. Local Setup & Testing Guide

### Prerequisites
- **Node.js:** v20+ for local development; Cloud Functions runtime is pinned to **Node.js 22** (`engines: { "node": "22" }`)
- **Java:** JDK 21+ (required for Firebase Emulator Suite)
- **Firebase CLI:** Included locally via project dependencies

### Installation
```bash
# Clone the repository
git clone https://github.com/niharika19singh/borrowher-igdtuw.git
cd borrowher-igdtuw

# Checkout Backend Developer 1 feature branch
git checkout feat/niharika/firebase-foundation-marketplace

# Install root dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..

# Install Frontend (React + Vite + TypeScript) dependencies
cd frontend && npm ci && cd ..
```

### Running Tests
BorrowHer includes 151 automated backend, frontend, security rules, and integration tests:

```bash
# Run backend (44 tests) + frontend (37 tests) unit test suites - 81 tests
npm run test

# Run Firestore and Storage security rules, transaction concurrency, and bootstrap tests against local emulators - 70 tests
npm run test:rules

# Run all test suites in sequence (151 tests total)
npm run test:all
```

### Building & Linting
```bash
# Build Cloud Functions TypeScript + Frontend Vite production bundle
npm run build

# Typecheck and lint Backend + Frontend
npm run lint
```

### Running Local Firebase Emulators
```bash
# Start Auth, Firestore, Storage, and Functions emulators with UI
npm run emulators:start
```
- Emulator UI: `http://localhost:4000`
- Firestore: `localhost:8080`
- Auth: `localhost:9099`
- Storage: `localhost:9199`
- Functions: `localhost:5001` (configured for region `asia-south1`)

### Seeding Catalog & Campus Pickup Zones
All administrative scripts require an explicit Firebase Project ID via `--project <projectId>` or `FIREBASE_PROJECT_ID` (implicit default project selection is strictly prohibited):
```bash
# Seed initial 7 marketplace categories
npm run seed:categories -- --project demo-borrowher

# Seed proposed IGDTUW campus exchange points (seeded as pending_review, active: false)
npm run seed:pickup-zones -- --project demo-borrowher

# Securely elevate an existing verified account to platform administrator
npm run bootstrap:admin -- --project demo-borrowher --email verified-admin@igdtuw.ac.in --confirm
```

---

## 7. Cloud Deployment Checklist

When preparing for live staging or production deployment:

1. **Create Firebase Project:** In the [Firebase Console](https://console.firebase.google.com), create a new project (e.g. `borrowher-igdtuw-prod`).
2. **Select Database & Functions Region:** Choose `asia-south1` (Mumbai). All Cloud Functions 2nd Gen and Cloud Firestore databases should be provisioned in `asia-south1` to align with the client configuration `getFunctions(app, 'asia-south1')`. *Note: Code configuration specifies deployment target routing; actual resource residency depends on project creation settings in the console.*
3. **Enable Services:**
   - **Authentication:** Enable Email/Password provider.
   - **Cloud Firestore:** Initialize in Production Mode (`asia-south1`).
   - **Cloud Storage:** Create default bucket.
   - **Cloud Functions:** Ensure Blaze plan is enabled for 2nd Gen functions on Node.js 22.
4. **Deploy Security Rules & Indexes:**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
5. **Deploy Cloud Functions:**
   ```bash
   firebase deploy --only functions
   ```
6. **Bootstrap Administrator:** Run `npm run bootstrap:admin -- --project <project_id> --email <authorized_admin_email> --confirm` with service account credentials to safely provision the platform administrator (requires pre-registered account with verified email).
7. **Configure Vercel:** Set environment variables from `.env.example` (`VITE_FIREBASE_*`) in the Vercel dashboard.

---

## 8. Integration Instructions for Team Members

- **Frontend Developer 1:** Consult [`docs/backend-developer-1-contract.md`](docs/backend-developer-1-contract.md) for listing fields, status enums, and required Firestore composite query structures.
  - **Listing Mutations:** Note that direct client-side listing creation/updates/deletions are denied by security rules (`allow create, update, delete: if false;`). Use callable Cloud Functions `createListing`, `updateListing`, and `pauseListing` in region `asia-south1`. Strict active account verification is enforced: callers must have `accountStatus === 'active'` and `verificationStatus === 'verified'`.
  - **Pickup Zones:** Only active and approved pickup zones (`active: true`, `approvalStatus: 'approved'`) are accepted by `createListing`.
  - **Item Details (`getListing`):** Validates caller's live Firestore account state (`accountStatus === 'active'` and `verificationStatus === 'verified'`). Listing ownership does not bypass this verification gate.
- **Frontend Developer 2:** Use callable function contracts (`ensureUserProfile`, `approveStudent`, `setAdminRole`, `adminModerateListing`) and shared models in `functions/src/shared/types.ts`.
  - Always initialize Functions with: `getFunctions(app, 'asia-south1')`.
- **Backend Developer 2:** Date-slot reservation locks (`bookingSlots`), booking lifecycle (`bookings`), handover confirmations, and deposit simulation integrate seamlessly with the existing security foundation:
  - All `bookingSlots` and `bookings` paths are configured with secure default-deny rules awaiting your Cloud Functions triggers.
  - The `booking-evidence/{bookingId}/{uid}/{fileName}` Storage path is currently locked down (`allow read, write: if false;`) until your bilateral borrower/lender participant validation is implemented.

---

## 9. Security & Privacy Guarantees

- **No Student Data Leaks:** Public profiles strictly omit student email addresses, phone numbers, hostel room numbers, and verification documents.
- **Direct Listing Mutation Lockdown:** Direct client writes to `listings` are completely blocked; all mutations must pass server-side Zod validation and strict account status verification (`accountStatus === 'active'` and `verificationStatus === 'verified'`).
- **Live Account Status Enforcement:** `getListing` authoritatively verifies caller's live Firestore profile; suspended or rejected students cannot access marketplace item details, even for listings they own.
- **Cross-Service Storage Rules:** Cloud Storage security rules evaluate live Firestore user profiles via `firestore.exists` and `firestore.get`. A student with a stale `verifiedStudent` JWT claim is strictly denied from uploading or reading protected listing images if their account is suspended or unverified.
- **Explicit Project Selection:** All administrative scripts require explicit project identification (`--project` or `FIREBASE_PROJECT_ID`), display execution targets prominently, and prevent accidental execution against live production databases.
- **Real-Time Suspended-Account Enforcement:** Suspended or rejected students are immediately blocked from marketplace reads/writes via real-time Firestore rule checks and instant Auth refresh token revocation.
- **Approved Public Points Only:** Pickup zones must be formally approved (`approvalStatus: 'approved'`, `active: true`) by an administrator. Unverified opening times or monitoring claims are removed. Private residence and room addresses are prohibited.
- **Client Elevation Prevented:** Custom claims (`admin`, `verifiedStudent`) and user verification status are protected by server-side verification and can never be modified through client-side writes.
