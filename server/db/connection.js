const Database = require('better-sqlite3');
const { readFileSync } = require('fs');
const { join } = require('path');

const DB_PATH = join(__dirname, '../../data/torque.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
