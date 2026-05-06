// Usage: node server/db/import-txt.js
// Clears all exercises and sessions, then imports from data/exercises.txt.
// Format expected:
//   EXERCISE TITLE (ALL CAPS)
//   body_part,reps,sets,difficulty
//   Step one sentence. Step two sentence. ...
//   (repeat per exercise, steps may span multiple lines)
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { readFileSync } = require('fs');
const { join } = require('path');
const db = require('./connection');

const TXT_PATH = join(__dirname, '../../data/exercises.txt');

function difficultyMap(diff) {
  switch ((diff || '').toLowerCase().trim()) {
    case 'easy':   return { difficulty: 'Easy',   ease_level: 2 };
    case 'medium': return { difficulty: 'Medium', ease_level: 3 };
    case 'hard':   return { difficulty: 'Hard',   ease_level: 4 };
    default:       return { difficulty: 'Medium', ease_level: 3 };
  }
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Detects an ALL-CAPS exercise title (letters, digits, spaces, hyphens, parens)
function isTitle(line) {
  return /^[A-Z][A-Z0-9 \-()/]+$/.test(line) && line.length >= 2;
}

function parseMetadata(line) {
  const parts = line.split(',').map(s => s.trim());
  const body_part = parts[0] || '';
  const reps = parts[1] || '';
  let sets = '';
  let diffStr = '';

  if (parts.length >= 4) {
    sets = parts[2];
    diffStr = parts[3];
  } else if (parts.length === 3) {
    // Handle merged sets+difficulty e.g. "3mhard" → sets=3, difficulty=hard
    const m = parts[2].match(/^(\d+)[^,]*(easy|medium|hard)/i);
    if (m) { sets = m[1]; diffStr = m[2]; }
    else    { sets = parts[2]; }
  }

  const { difficulty, ease_level } = difficultyMap(diffStr);
  return { body_part, reps, sets, difficulty, ease_level };
}

// Skip OCR commentary lines injected into the source file
function isArtifactLine(line) {
  return /^(This|Here)\s+(is|are)\s+/i.test(line);
}

// Join step lines and split on ". " to recover individual sentences as steps
function parseSteps(lines) {
  const joined = lines.join(' ').trim();
  if (!joined) return [];
  const segments = joined.split(/\.\s+/);
  return segments.map((s, i, arr) => {
    s = s.trim();
    if (!s) return null;
    return (i < arr.length - 1) ? s + '.' : (s.endsWith('.') ? s : s + '.');
  }).filter(Boolean);
}

let content;
try {
  content = readFileSync(TXT_PATH, 'utf8');
} catch {
  console.error('ERROR: Could not read data/exercises.txt');
  process.exit(1);
}

// Parse exercises
const exercises = [];
let current = null;
let state = 'idle'; // idle → got_title → in_steps

for (const rawLine of content.split('\n')) {
  const line = rawLine.trim();
  if (!line) continue;

  if (isTitle(line)) {
    if (current) exercises.push(current);
    current = { name: toTitleCase(line), stepLines: [] };
    state = 'got_title';
  } else if (state === 'got_title' && current) {
    Object.assign(current, parseMetadata(line));
    state = 'in_steps';
  } else if (state === 'in_steps' && current && !isArtifactLine(line)) {
    current.stepLines.push(line);
  }
}
if (current) exercises.push(current);

// Finalize step text
for (const ex of exercises) {
  ex.instructions = parseSteps(ex.stepLines).join('\n');
  delete ex.stepLines;
}

// Clear DB and import
const run = db.transaction(() => {
  db.prepare('DELETE FROM session_exercises').run();
  db.prepare('DELETE FROM sessions').run();
  db.prepare('DELETE FROM exercises').run();
  // Reset autoincrement counters
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('exercises', 'sessions', 'session_exercises')").run();

  const insert = db.prepare(`
    INSERT INTO exercises (name, body_part, difficulty, ease_level, sets, reps, instructions)
    VALUES (@name, @body_part, @difficulty, @ease_level, @sets, @reps, @instructions)
  `);

  let count = 0;
  for (const ex of exercises) {
    insert.run(ex);
    count++;
  }
  return count;
});

const count = run();
console.log(`Done. Imported ${count} exercises (all sessions cleared).`);
console.log('Add photos via the website — exercise IDs start from 1.');
