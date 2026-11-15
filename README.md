# BorrowHer Frontend — FE1 (Marketplace & Discovery)

React + Vite + TypeScript + Tailwind CSS implementation of **Frontend Developer 1** responsibilities for BorrowHer (IGDTUW Campus Sharing Economy).

## Architecture alignment

Follows *BorrowHer Cloud-Based Full-Stack Application Architecture* (Version 2.0).

### FE1 routes (implemented)
| Route | Description |
|-------|-------------|
| `/` | Landing page (Hero, categories, trending, How it Works) |
| `/marketplace` | Search, category filters, sort, listing cards |
| `/items/:listingId` | Item detail, pricing, deposit, request-to-borrow form |
| `/listings/new` | Create listing form with validation |
| `/listings/:id/edit` | Edit listing (pre-populated) |

### Explicitly out of scope (FE2)
Auth, dashboard, bookings timeline, Emergency Essentials board implementation, notifications, profiles, admin.

Emergency Essentials **navigation entry** is retained as specified.

## Removed / not present
- Favourites module
- Community module
- Standalone “My Listings” nav destination (listings are managed via create/edit routes)

## Tech
- React 19 + Vite
- TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- React Router 7
- Lucide React icons

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build   # production build → dist/
```

Mock listing data lives in `src/data/mockListings.ts`. Replace with Firestore listeners when Backend Developer 1 contracts are available.

## Design
Preserves the established soft blush / dusty rose / cream palette, serif + script typography, card styles and overall aesthetic from the reference UI. No redesign was performed.
