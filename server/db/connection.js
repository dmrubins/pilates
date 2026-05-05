const Database = require('better-sqlite3');
const { readFileSync } = require('fs');
const { join } = require('path');

const DB_PATH = join(__dirname, '../../data/torque.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Migrate exercises table if it's missing new columns
const cols = db.pragma('table_info(exercises)').map(c => c.name);
if (cols.length > 0 && !cols.includes('card_number')) {
  db.exec('DROP TABLE IF EXISTS exercises;');
}

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
