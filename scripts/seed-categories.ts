import * as admin from 'firebase-admin';
import { Category } from '../functions/src/shared/types';

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
      'Example: tsx scripts/seed-categories.ts --project demo-borrowher'
    );
  }

  return projectId;
}

export const INITIAL_CATEGORIES: Category[] = [
  {
    categoryId: 'academic-books',
    name: 'Academic & Books',
    slug: 'academic-books',
    description: 'Engineering textbooks, semester reference books, lab manuals, and competitive exam study materials.',
    active: true,
    displayOrder: 1,
    icon: 'book-open',
    allowedFields: ['edition', 'author', 'courseCode'],
  },
  {
    categoryId: 'electronics-calculators',
    name: 'Electronics & Calculators',
    slug: 'electronics-calculators',
    description: 'Scientific calculators (fx-991EX/MS), multimeters, Arduino/Raspberry Pi boards, sensors, and cables.',
    active: true,
    displayOrder: 2,
    icon: 'cpu',
    allowedFields: ['model', 'brand', 'accessoriesIncluded'],
  },
  {
    categoryId: 'lab-project-equipment',
    name: 'Lab & Project Equipment',
    slug: 'lab-project-equipment',
    description: 'White lab coats, safety goggles, chemistry lab glassware kits, drawing drafters, and breadboards.',
    active: true,
    displayOrder: 3,
    icon: 'flask',
    allowedFields: ['size', 'department'],
  },
  {
    categoryId: 'clothing-interview',
    name: 'Clothing & Interview Essentials',
    slug: 'clothing-interview',
    description: 'Formal blazers, placement drive interview attire, convocation accessories, and presentation outfits.',
    active: true,
    displayOrder: 4,
    icon: 'shirt',
    allowedFields: ['size', 'colour', 'dryCleanRequired'],
  },
  {
    categoryId: 'accessories',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Laptop chargers, HDMI/VGA presentation adapters, power banks, camera gear, and scientific equipment cases.',
    active: true,
    displayOrder: 5,
    icon: 'plug',
    allowedFields: ['compatibility', 'portType'],
  },
  {
    categoryId: 'weather-daily',
    name: 'Weather & Daily Essentials',
    slug: 'weather-daily',
    description: 'Umbrellas for sudden monsoon rains, campus backpacks, portable desk lamps, and seasonal essentials.',
    active: true,
    displayOrder: 6,
    icon: 'umbrella',
    allowedFields: [],
  },
  {
    categoryId: 'other',
    name: 'Other',
    slug: 'other',
    description: 'Miscellaneous campus supplies, permitted event gear, and student essentials.',
    active: true,
    displayOrder: 7,
    icon: 'package',
    allowedFields: [],
  },
];

export async function seedCategories(explicitProjectId?: string) {
  const projectId = explicitProjectId || resolveProjectId();
  const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  console.log(`\n======================================================`);
  console.log(`🌱 BorrowHer — Category Catalog Seeding Procedure`);
  console.log(`🎯 Target Project:   ${projectId}`);
  console.log(`🔌 Execution Mode:   ${isEmulator ? `Local Firestore Emulator (${process.env.FIRESTORE_EMULATOR_HOST})` : 'LIVE CLOUD PROJECT'}`);
  console.log(`======================================================\n`);

  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId });
  }

  const db = admin.firestore();
  console.log(`Seeding BorrowHer categories into Firestore (Project: '${projectId}')...`);
  const batch = db.batch();

  for (const cat of INITIAL_CATEGORIES) {
    const docRef = db.collection('categories').doc(cat.categoryId);
    batch.set(docRef, cat, { merge: true });
    console.log(`  ✓ Prepared category: ${cat.name} (${cat.categoryId})`);
  }

  await batch.commit();
  console.log(`✅ Successfully seeded ${INITIAL_CATEGORIES.length} categories into '${projectId}'.\n`);
}

// Execute if run directly from CLI
if (require.main === module || process.argv[1]?.endsWith('seed-categories.ts')) {
  seedCategories()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to seed categories:', err.message || err);
      process.exit(1);
    });
}
