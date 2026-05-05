require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { readFileSync, copyFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const { parse } = require('csv-parse/sync');
const db = require('./connection');

const CSV_PATH   = join(__dirname, '../../data/exercises.csv');
const PHOTOS_SRC = join(__dirname, '../../data/photos');
const IMAGES_DIR = process.env.IMAGES_DIR || join(__dirname, '../../client/public/images');

// Ensure images directory exists
mkdirSync(IMAGES_DIR, { recursive: true });

// Map difficulty text → ease_level number
function difficultyToEase(diff) {
  switch ((diff || '').toLowerCase()) {
    case 'easy':    return 2;
    case 'medium':  return 3;
    case 'hard':    return 4;
    default:        return 3;
  }
}

// Parse semicolon-separated photo filenames
function parsePhotos(raw) {
  if (!raw) return [];
  return raw.split(';').map(s => s.trim()).filter(Boolean);
}

// Copy photos from data/photos/ to images directory
function copyPhotos(filenames) {
  for (const filename of filenames) {
    const src  = join(PHOTOS_SRC, filename);
    const dest = join(IMAGES_DIR, filename);
    if (existsSync(src) && !existsSync(dest)) {
      copyFileSync(src, dest);
    }
  }
}

let content;
try {
  content = readFileSync(CSV_PATH, 'utf8');
} catch {
  console.error('No exercises.csv found at data/exercises.csv — skipping seed.');
  process.exit(0);
}

const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });

const upsert = db.prepare(`
  INSERT INTO exercises
    (card_number, name, difficulty, ease_level, sets, reps, instructions, photo_filenames)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(name) DO UPDATE SET
    card_number    = excluded.card_number,
    difficulty     = excluded.difficulty,
    ease_level     = excluded.ease_level,
    sets           = excluded.sets,
    reps           = excluded.reps,
    instructions   = excluded.instructions,
    photo_filenames = excluded.photo_filenames
`);

const seedAll = db.transaction((rows) => {
  let count = 0;
  for (const row of rows) {
    const photos = parsePhotos(row['Photo Filenames']);
    copyPhotos(photos);

    upsert.run(
      row['Card Number'] ? parseInt(row['Card Number'], 10) : null,
      row['Name'],
      row['Difficulty'] || null,
      difficultyToEase(row['Difficulty']),
      row['Sets'] || null,
      row['Reps'] || null,
      row['Instructions'] || null,
      JSON.stringify(photos)
    );
    count++;
  }
  return count;
});

const count = seedAll(rows);
console.log(`Seeded ${count} exercises, photos copied to ${IMAGES_DIR}`);
