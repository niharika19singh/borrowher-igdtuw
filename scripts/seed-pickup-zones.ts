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

export const INITIAL_PICKUP_ZONES: PickupZone[] = [
  {
    zoneId: 'admin-block-foyer',
    label: 'Administrative Block Foyer',
    campusArea: 'Central Campus',
    active: true,
    guidance: 'Meet near the ground floor visitor inquiry desk inside the Admin building. Well-lit and monitored public area.',
    accessNote: 'Open during regular academic hours (9:00 AM – 5:30 PM, Monday to Friday).',
  },
  {
    zoneId: 'central-library-entry',
    label: 'Central Library Main Entrance',
    campusArea: 'Academic Zone',
    active: true,
    guidance: 'Meet near the main glass entrance / outdoor benches facing the library lawn. Ideal for book and calculator exchanges.',
    accessNote: 'Accessible during library operational hours (8:30 AM – 7:00 PM).',
  },
  {
    zoneId: 'it-department-gf',
    label: 'IT & CSE Block Ground Floor Lobby',
    campusArea: 'Departmental Buildings',
    active: true,
    guidance: 'Near the department notice boards on the ground floor foyer. Suitable for lab coats and hardware/microcontroller handovers.',
    accessNote: 'Open during lab and class schedules.',
  },
  {
    zoneId: 'main-gate-reception',
    label: 'Kashmere Gate Main Entrance Reception',
    campusArea: 'Campus Perimeter & Security',
    active: true,
    guidance: 'Meet near the security reception booth inside the main campus gate. Suitable for day scholars arriving or leaving campus.',
    accessNote: 'Monitored 24/7 security area; day access recommended for exchanges.',
  },
  {
    zoneId: 'mechanical-workshop-entry',
    label: 'Mechanical Engineering Workshop Entrance',
    campusArea: 'Workshop & Laboratory Area',
    active: true,
    guidance: 'Outside the main roller shutter entrance of the workshop complex. Recommended for drafting drafters and heavy project tools.',
    accessNote: 'Accessible during workshop and practical hours.',
  },
  {
    zoneId: 'audi-plaza',
    label: 'Auditorium Plaza & Open Lawn',
    campusArea: 'Student Common Areas',
    active: true,
    guidance: 'Open seating area in front of the campus auditorium. Open public space suitable for general item handovers.',
    accessNote: 'Daytime access during college working days.',
  },
];

export async function seedPickupZones() {
  console.log('Seeding approved IGDTUW campus pickup zones into Firestore...');
  const batch = db.batch();

  for (const zone of INITIAL_PICKUP_ZONES) {
    const docRef = db.collection('pickupZones').doc(zone.zoneId);
    batch.set(docRef, zone, { merge: true });
    console.log(`  ✓ Prepared pickup point: ${zone.label} (${zone.zoneId})`);
  }

  await batch.commit();
  console.log(`✅ Successfully seeded ${INITIAL_PICKUP_ZONES.length} approved campus pickup zones.`);
}

if (require.main === module || process.argv[1]?.endsWith('seed-pickup-zones.ts')) {
  seedPickupZones()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to seed pickup zones:', err);
      process.exit(1);
    });
}
