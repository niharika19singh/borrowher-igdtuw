# Frontend Developer 2 handoff

This branch adds BorrowHer’s authentication and user-workflow frontend, using the supplied blush, cream and burgundy visual reference. It starts from `main` and does not merge or change the backend developer’s branch.

## Run and review

```sh
cd frontend
npm ci
npm run dev
npm test
npm run build
```

Open `/demo/dashboard` to explore a clearly labelled, isolated sample session. Demo changes live in memory and reset when leaving the demo or refreshing. All sample identities, borrowing history, pickup zones and dates are fictional. The sample snapshot is 15 November 2026, 12:00 IST.

Open `/auth/register` for sign-up and `/auth/login` for sign-in. Without Firebase configuration, live forms explain that sign-in is being set up and provide a design preview link. They do not create a fake authenticated session.

Copy `frontend/.env.example` to `frontend/.env.local`, fill in the team’s Firebase **web** configuration, and deploy BE1’s functions/rules to a staging project. Functions use the documented `asia-south1` region. Optional App Check configuration uses a reCAPTCHA Enterprise site key. Never place Admin SDK or service-account credentials in frontend variables.

For emulators, set `VITE_USE_EMULATORS=true` only in local development and start the team’s Auth (9099), Firestore (8080), and Functions (5001) emulators separately.

## Routes and ownership

| Route                        | Behavior                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/auth/register`             | Exact `@igdtuw.ac.in` email validation, password confirmation, Firebase account creation, verification email, server profile initialization           |
| `/auth/login`, `/auth/reset` | Firebase sign-in and password reset                                                                                                                   |
| `/auth/verify`               | Email verification, pending/rejected/suspended states, verification resend cooldown, profile initialization retry and forced token refresh            |
| `/dashboard`, `/bookings`    | Borrowing/lending tabs, search, overview, upcoming exchanges                                                                                          |
| `/bookings/:bookingId`       | Timeline, terms, exact IST due time, separate simulated deposit, pickup/return UI                                                                     |
| `/emergency`                 | Request filters/search, request dialog, expiry filtering and local sample offers                                                                      |
| `/notifications`             | All/unread filter and local sample read-state controls                                                                                                |
| `/profile/:uid`              | Live public profile listener; own private details; editable name/programme/year via `updateUserProfile`                                               |
| `/admin`                     | Server-claim route gate; live student, listing and pickup-zone lists; `approveStudent` and `adminModerateListing`; admin-rule-protected zone approval |
| `/help`                      | Campus care and handover guidance                                                                                                                     |

Equivalent `/demo/...` routes use only sample data and never call Firebase. A visible demo strip and admin-preview labels distinguish these screens from live operations. Demo controls can simulate the second participant; production never uses the local state machine.

`/` currently forwards to sign-in. `/marketplace` is an explicit FE1 integration placeholder. FE1 should replace these entries with their landing and discovery routes and may reuse the shell, design variables and `ItemArt` components. No marketplace or listing implementation is claimed by this branch.

## Confirmed BE1 integration

Read contract revision `e40f8e3b1904b419b571efa95f174a565ab489b2` on `feat/niharika/firebase-foundation-marketplace`, including `docs/backend-developer-1-contract.md` and `functions/src/shared/types.ts`.

`src/types/backend.ts` is a small, attributed FE-facing subset. Once shared types are integrated into `main`, replace that subset with the agreed shared package/import path. No client writes are made to student verification fields, public profiles or listings.

Private profiles subscribe only to the signed-in UID. Public profile views never read another student’s private `users` document. Profile listeners unsubscribe on account changes and sign-out. Student access requires all of: exact college domain, verified email, trusted `verifiedStudent` claim, live profile `verificationStatus: verified`, and `accountStatus: active`. Admin access requires a trusted admin claim, verified email and active account. UI gates supplement backend authorization.

Admin lists are capped at 50 records and clearly disclose that search filters the loaded records. Add pagination when campus volumes require it. Zone activation is available only after an explicit review form; locations remain disabled while pending or rejected.

## Required backend work before release

1. **College-only sign-up is not enforceable by the browser alone.** The user confirmed `igdtuw.ac.in` as the only allowed domain. BE1’s current `ensureUserProfile` accepts arbitrary authenticated email domains. BE1 must add trusted domain validation in account/profile provisioning, verification approval, sensitive callables and Security Rules. To reject non-campus account creation itself, configure a Firebase Authentication blocking `beforeUserCreated` function (with the required Identity Platform configuration) or another trusted registration flow. App Check and client-side validation do not replace this. Review domain policy for any existing accounts before release.
2. **Email verification remains separate from student approval.** The existing backend starts profiles as `pending` and requires admin approval; that contract is preserved. The frontend never grants `verifiedStudent` or admin claims.
3. **BE2 contracts are not published yet.** `src/types/workflows.ts` contains presentation-only models, not an agreed Firestore schema. Agree collection fields, enums, participant queries, callable request/response types, bilateral handovers, disputes, expiry, idempotency and notification read permissions before enabling live booking/emergency/notification data. Those production pages currently display honest service-pending states rather than guessing writable contracts.
4. **Reports and transaction evidence** still need BE2 authorization and workflows. Admin report UI explains this dependency. Optional evidence upload and dispute submission must wait for participant-protected Storage Rules and function contracts.
5. **Deploy and test** against staging Firebase with two real test accounts and an authorized admin. Confirm email delivery, email verification, token refresh after approval, suspension, public/private profile isolation and callable errors. Live Firebase behavior cannot be verified without the team’s project configuration.

## Verification evidence

- 27 unit cases cover college-domain lookalikes, non-campus and malformed emails, stale claims/suspended profiles, and bilateral demo pickup/return confirmations.
- Production compilation passes.
- Browser review covers the dashboard, navigation and sample pickup/return journey, including waiting for each participant separately; additional checks are recorded in the review notes delivered with this branch.
- This is frontend review readiness, not evidence of a deployed backend or end-to-end production completion.

## Pull request and deployment

Owner: Palak Batra (`PalakBatra22`). Branch: `feat/palak/frontend-2-workflows`. Keep all work off `main` and open a PR for the team lead’s review. Do not merge or enable automatic merging until reviewed and approved. The repository owner should configure branch protection to require an approving review if it is not already enabled.

This branch is submitted through PalakBatra22 for team review. Backend integration remains pending as described above. The FE1 implementation is on the separate `nancy` branch (reviewed at `a7ec3a7e86793849d51482dfbeae007cf537c55b`), where the app lives at the repository root. Agree a single app root, router, shared logo, typography and design tokens when integrating FE1 and FE2; this PR preserves FE1 ownership and does not merge that branch.

For Vercel, set the project root to `frontend`, build command to `npm run build`, output directory to `dist`, and use separate staging/production web config values. `frontend/vercel.json` supplies SPA route rewrites.
