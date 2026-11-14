import * as admin from 'firebase-admin';
import { PickupZone } from '../functions/src/shared/types';

const projectId = process.env.FIREBASE_PROJECT_ID || 'borrowher-igdtuw';
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`[Seed Pickup Zones] Connecting to Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

/**
 * Proposed initial campus pickup locations for BorrowHer IGDTUW.
 *
 * Governance & Safety Policy:
 * - All proposed locations are initialized with `active: false` and `approvalStatus: 'pending_review'`.
 * - Locations must NOT be represented as officially confirmed or university-monitored without administrative validation.
 * - Free-form hostel room addresses and unverified private residences are strictly prohibited.
 * - Students must observe campus rules; university hostel access rules must be strictly respected.
 */
export const INITIAL_PICKUP_ZONES: PickupZone[] = [
  {
    zoneId: 'admin-block-foyer',
    label: 'Administrative Block Foyer',
    campusArea: 'Central Campus',
    active: false, // Inactive until administrative validation
    approvalStatus: 'pending_review',
    guidance: 'Proposed central public handover spot inside the Admin building ground floor foyer.',
    accessNote: 'Must be scheduled during regular college working hours. Private offices and restricted zones are off-limits.',
  },
  {
    zoneId: 'central-library-entry',
    label: 'Central Library Main Entrance',
    campusArea: 'Academic Zone',
    active: false,
    approvalStatus: 'pending_review',
    guidance: 'Proposed public exchange point outside the main library glass entrance facing the lawn.',
    accessNote: 'Subject to standard campus library premises guidelines. Maintain academic quiet zones.',
  },
  {
    zoneId: 'it-department-gf',
    label: 'IT & CSE Block Ground Floor Lobby',
    campusArea: 'Departmental Buildings',
    active: false,
    approvalStatus: 'pending_review',
    guidance: 'Proposed departmental pickup area in the ground floor lobby near public notice boards.',
    accessNote: 'Valid only during scheduled class/lab hours. Lab interior spaces cannot be used as exchange points.',
  },
  {
    zoneId: 'main-gate-reception',
    label: 'Kashmere Gate Campus Main Gate Area',
    campusArea: 'Campus Perimeter',
    active: false,
    approvalStatus: 'pending_review',
    guidance: 'Proposed daytime exchange location near the main gate visitor waiting area.',
    accessNote: 'Daytime student access only. Must not obstruct campus security or vehicle entry.',
  },
  {
    zoneId: 'mechanical-workshop-entry',
    label: 'Mechanical Workshop Building Entrance',
    campusArea: 'Workshop & Laboratory Area',
    active: false,
    approvalStatus: 'pending_review',
    guidance: 'Proposed outdoor area adjacent to the mechanical workshop main entrance.',
    accessNote: 'Must be scheduled during operational workshop hours. Strictly observe lab safety boundaries.',
  },
  {
    zoneId: 'audi-plaza',
    label: 'Auditorium Plaza Open Lawn',
    campusArea: 'Student Common Areas',
    active: false,
    approvalStatus: 'pending_review',
    guidance: 'Proposed open public common area in the outdoor plaza in front of the auditorium.',
    accessNote: 'Outdoor public space; recommended for daytime handover during working college days.',
  },
];

export async function seedPickupZones() {
  console.log('Seeding proposed IGDTUW campus pickup zones (pending_review) into Firestore...');
  const batch = db.batch();

  for (const zone of INITIAL_PICKUP_ZONES) {
    const docRef = db.collection('pickupZones').doc(zone.zoneId);
    batch.set(docRef, zone, { merge: true });
    console.log(`  ✓ Prepared proposed pickup point: ${zone.label} (${zone.zoneId}) [pending_review]`);
  }

  await batch.commit();
  console.log(`✅ Successfully seeded ${INITIAL_PICKUP_ZONES.length} proposed campus pickup zones (all pending_review, active=false).`);
}

if (require.main === module || process.argv[1]?.endsWith('seed-pickup-zones.ts')) {
  seedPickupZones()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to seed pickup zones:', err);
      process.exit(1);
    });
}
