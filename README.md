# BorrowHer — The IGDTUW Campus Sharing Economy

> **Course:** Cloud-Based Full Stack Application Development  
> **Academic Domain:** Education  
> **Target Users:** Verified students and administrators of Indira Gandhi Delhi Technical University for Women (IGDTUW)  
> **Architecture:** Cloud-native serverless architecture using React (Vite), Firebase (Auth, Firestore, Cloud Storage, Cloud Functions 2nd Gen), and Vercel hosting.

---

## 1. Problem Statement & Mission

IGDTUW students frequently require essential items for short academic or personal durations—including textbooks, scientific calculators, laboratory coats, umbrellas, formal clothing for interviews, and hardware/project accessories. However, buying each item individually leads to unnecessary expenditure and under-utilised campus resources.

**BorrowHer** is a campus-exclusive peer-to-peer sharing marketplace designed specifically for the IGDTUW university community. Verified students can list idle items, discover nearby campus availability, coordinate safe handovers at designated campus locations, and borrow items securely.

---

## 2. Cloud Architecture Overview

- **Frontend Delivery:** React + Vite + TypeScript + Tailwind CSS hosted on **Vercel**.
- **Identity & Authentication:** **Firebase Authentication** with email/password and custom claims for role-based access control (RBAC).
- **Primary Database:** **Cloud Firestore** for real-time data synchronisation, reactive query listeners, and transactional consistency.
- **Media Storage:** **Cloud Storage for Firebase** with granular security rules scoped by user UID and listing ID.
- **Backend Compute:** **Firebase Cloud Functions (2nd Gen)** running on Node.js and TypeScript for trusted business workflows, validation, and administrative privileges.
- **Access Control:** Layered defence combining Firestore Security Rules, Storage Security Rules, server-assigned custom claims, and Firebase App Check.

---

## 3. Repository Branching Strategy

| Branch | Description | Owner |
|---|---|---|
| `main` | Production-ready baseline and stable releases | Shared |
| `feat/niharika/firebase-foundation-marketplace` | Backend Developer 1: Firebase foundation, Auth, Profiles, Listings, Rules, Indexes, Contracts | Niharika Singh |

*Note: Frontend Developers (FE1, FE2) and Backend Developer 2 (BE2) will create their respective feature branches from `main` when beginning their implementation phases.*

---

## 4. Team Responsibilities

- **Frontend Developer 1:** Student-facing discovery and listing UI (Marketplace, Landing page, Search/Filter, Create/Edit listing UI).
- **Frontend Developer 2:** Authentication, user profiles, booking timeline, dashboard, emergency board, and admin UI.
- **Backend Developer 1 (Niharika Singh):** Firebase project foundation, Authentication, student verification workflow, User profiles, Marketplace listings and categories, Pickup zones, Firestore & Storage Security Rules, Firestore indexes, Shared TypeScript contracts, and Emulator test suite.
- **Backend Developer 2:** Transaction workflows, Booking lifecycle, atomic date-slot locking, Handover & Return confirmation, Emergency Essentials offer conversion, Scheduled due-date reminders, disputes, and simulated deposit ledger.

---

## 5. Getting Started (Local Development)

### Prerequisites
- Node.js (v20+ recommended; v25 supported)
- Java 21+ (required for Firebase Emulator Suite)
- Firebase CLI (`npm install -g firebase-tools` or `npx firebase-tools`)

Detailed setup, environment configuration, and emulator instructions are documented in the respective feature branches and documentation guides.
