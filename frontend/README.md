# BorrowHer — Frontend Placeholder

This directory is designated for the React + Vite + TypeScript frontend application.

## Frontend Responsibilities Overview

- **Frontend Developer 1 (Marketplace & Discovery):**
  - Landing page (`/`)
  - Marketplace search and filtering (`/marketplace`)
  - Item detail & availability preview (`/items/:listingId`)
  - Create and edit item listing forms (`/listings/new`, `/listings/:id/edit`)
  - Photo upload components integrated with Firebase Storage

- **Frontend Developer 2 (Workflows & Identity):**
  - Authentication UI (`/auth/register`, `/auth/login`, `/auth/verify`)
  - Borrower & Lender dashboards (`/dashboard`)
  - Booking timeline and handover actions (`/bookings/:bookingId`)
  - Emergency Essentials board (`/emergency`)
  - Notification centre (`/notifications`)
  - Student public profiles (`/profile/:uid`)
  - Admin moderation console (`/admin`)

## Integration Contracts
Before building client views, refer to the shared contracts provided by Backend Developer 1:
- `docs/backend-developer-1-contract.md`
- Shared TypeScript interfaces in `functions/src/shared/types.ts`
