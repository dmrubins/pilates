require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { readFileSync } = require('fs');
const { join } = require('path');
const { parse } = require('csv-parse/sync');
const db = require('./connection');

const csvPath = join(__dirname, '../../data/exercises.csv');

let content;
try {
  content = readFileSync(csvPath, 'utf8');
} catch {
  console.error('No exercises.csv found at data/exercises.csv — skipping seed.');
  process.exit(0);
}

const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });

const upsert = db.prepare(`
  INSERT INTO exercises (name, body_part, duration_minutes, ease_level, description, photo_filename)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(name) DO UPDATE SET
    body_part = excluded.body_part,
    duration_minutes = excluded.duration_minutes,
    ease_level = excluded.ease_level,
    description = excluded.description,
    photo_filename = excluded.photo_filename
`);

const seedAll = db.transaction((rows) => {
  let count = 0;
  for (const row of rows) {
    upsert.run(
      row.name,
      row.body_part,
      parseInt(row.duration_minutes, 10),
      parseInt(row.ease_level, 10),
      row.description || null,
      row.photo_filename || null
    );
    count++;
  }
  return count;
});

const count = seedAll(rows);
console.log(`Seeded ${count} exercises.`);
