import * as admin from 'firebase-admin';
import { PickupZone } from '../functions/src/shared/types';

export function resolveProjectId(args: string[] = process.argv.slice(2)): string {
  let projectId: string | undefined =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim();

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--project' || args[i] === '-p') && args[i + 1]) {
      projectId = args[i + 1].trim();
      break;
    }
  }

  if (!projectId) {
    throw new Error(
      'Firebase Project ID is required. Implicit default project selection is prohibited.\n' +
      'Please specify the project explicitly using:\n' +
      '  --project <projectId>\n' +
      'or by setting the FIREBASE_PROJECT_ID or GCLOUD_PROJECT environment variable.\n' +
      'Example: tsx scripts/seed-pickup-zones.ts --project demo-borrowher'
    );
  }

  return projectId;
}

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

export async function seedPickupZones(explicitProjectId?: string) {
  const projectId = explicitProjectId || resolveProjectId();
  const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  console.log(`\n======================================================`);
  console.log(`📍 BorrowHer — Campus Pickup Zones Seeding Procedure`);
  console.log(`🎯 Target Project:   ${projectId}`);
  console.log(`🔌 Execution Mode:   ${isEmulator ? `Local Firestore Emulator (${process.env.FIRESTORE_EMULATOR_HOST})` : 'LIVE CLOUD PROJECT'}`);
  console.log(`======================================================\n`);

  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId });
  }

  const db = admin.firestore();
  console.log(`Seeding proposed IGDTUW campus pickup zones (pending_review) into Firestore (Project: '${projectId}')...`);
  const batch = db.batch();

  for (const zone of INITIAL_PICKUP_ZONES) {
    const docRef = db.collection('pickupZones').doc(zone.zoneId);
    batch.set(docRef, zone, { merge: true });
    console.log(`  ✓ Prepared proposed pickup point: ${zone.label} (${zone.zoneId}) [pending_review]`);
  }

  await batch.commit();
  console.log(`✅ Successfully seeded ${INITIAL_PICKUP_ZONES.length} proposed campus pickup zones into '${projectId}' (all pending_review, active=false).\n`);
}

if (require.main === module || process.argv[1]?.endsWith('seed-pickup-zones.ts')) {
  seedPickupZones()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to seed pickup zones:', err.message || err);
      process.exit(1);
    });
}
