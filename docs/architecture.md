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

1. **Managed Serverless Scaling:** Student campus demand fluctuates drastically based on the academic calendar (semester examinations, practical lab weeks, placement season, monsoon rains). Serverless functions (Cloud Functions 2nd Gen) and fully managed Firestore automatically scale to zero during idle periods and absorb concurrent spikes without manual server administration.
2. **Real-Time Data Synchronisation:** Item availability and booking state transitions must remain in immediate synchronization across borrower and lender devices. Firestore snapshot listeners eliminate manual polling and stale state.
3. **Decoupled Edge Deployment:** Frontend assets are delivered via Vercel's global CDN edge network, ensuring sub-100ms load times on student mobile devices, completely independent from backend database operations.
4. **Resilient Object Storage:** Media assets (item photographs and condition proofs) are stored in Cloud Storage with strict byte limits and MIME validation rather than embedding binary data in database records.

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
