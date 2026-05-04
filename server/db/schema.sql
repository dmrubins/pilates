CREATE TABLE IF NOT EXISTS exercises (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  body_part       TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  ease_level      INTEGER NOT NULL CHECK (ease_level BETWEEN 1 AND 5),
  description     TEXT,
  photo_filename  TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session_exercises (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint          TEXT NOT NULL UNIQUE,
  subscription_json TEXT NOT NULL,
  schedule_days     TEXT NOT NULL DEFAULT '[]',
  schedule_time     TEXT NOT NULL DEFAULT '08:00',
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id);
