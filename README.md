# BorrowHer — The IGDTUW Campus Sharing Economy

> **Course:** Cloud-Based Full Stack Application Development  
> **Academic Domain:** Education  
> **Target Users:** Verified students and designated administrators of Indira Gandhi Delhi Technical University for Women (IGDTUW)  
> **Architecture Version:** 2.0  
> **Frontend Hosting:** Vercel (React + Vite + TypeScript + Tailwind CSS)  
> **Cloud Backend:** Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions 2nd Gen (Node.js + TypeScript)  
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

## 5. Directory Structure

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
- **Node.js:** v20+ (tested on Node v25.5.0)
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
```

### Running Tests
BorrowHer includes 58 automated unit and rules integration tests:

```bash
# Run unit tests (Zod validators, domain models, error handling)
npm run test

# Run Firestore and Storage security rules tests against local emulators
npm run test:rules

# Run all test suites in sequence
npm run test:all
```

### Building & Linting
```bash
# Build Cloud Functions TypeScript
npm run build

# Typecheck and lint Functions
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
- Functions: `localhost:5001`

### Seeding Catalog & Approved Campus Pickup Zones
With emulators running (or connected to a test project):
```bash
# Seed initial 7 marketplace categories
npm run seed:categories

# Seed approved IGDTUW campus exchange points
npm run seed:pickup-zones

# Provision root administrator account with admin claims
npm run bootstrap:admin
```

---

## 7. Cloud Deployment Checklist

When preparing for live staging or production deployment:

1. **Create Firebase Project:** In the [Firebase Console](https://console.firebase.google.com), create a new project (e.g. `borrowher-igdtuw-prod`).
2. **Select Database Region:** Choose a supported Indian cloud region close to IGDTUW (e.g. `asia-south1` Mumbai). *Note: Region selection is permanent.*
3. **Enable Services:**
   - **Authentication:** Enable Email/Password provider.
   - **Cloud Firestore:** Initialize in Production Mode.
   - **Cloud Storage:** Create default bucket.
   - **Cloud Functions:** Ensure Blaze plan is enabled for 2nd Gen functions.
4. **Deploy Security Rules & Indexes:**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
5. **Deploy Cloud Functions:**
   ```bash
   firebase deploy --only functions
   ```
6. **Bootstrap Administrator:** Run `npm run bootstrap:admin` with service account credentials to provision the root platform administrator safely.
7. **Configure Vercel:** Set environment variables from `.env.example` (`VITE_FIREBASE_*`) in the Vercel dashboard.

---

## 8. Integration Instructions for Team Members

- **Frontend Developer 1:** Consult [`docs/backend-developer-1-contract.md`](docs/backend-developer-1-contract.md) for listing fields, status enums, and required Firestore composite query structures.
- **Frontend Developer 2:** Use callable function contracts (`ensureUserProfile`, `approveStudent`, `setAdminRole`, `adminModerateListing`) and shared models in `functions/src/shared/types.ts`.
- **Backend Developer 2:** Date-slot reservation locks (`bookingSlots`), booking lifecycle (`bookings`), handover confirmations, and deposit simulation integrate seamlessly with the existing security foundation. All `bookingSlots` and `bookings` paths are configured with secure default-deny rules awaiting your Cloud Functions triggers.

---

## 9. Security & Privacy Guarantees

- **No Student Data Leaks:** Public profiles strictly omit student email addresses, phone numbers, hostel room numbers, and verification documents.
- **Approved Public Points Only:** Pickup zones are restricted to officially designated public campus locations (Library, Admin Foyer, CSE Block Lobby). Private residence and room addresses are prohibited.
- **Client Elevation Prevented:** Custom claims (`admin`, `verifiedStudent`) and user verification status are protected by server-side verification and can never be modified through client-side writes.
