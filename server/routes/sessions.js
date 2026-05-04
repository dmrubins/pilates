const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { date } = req.query;
    let sessions;

    if (date) {
      sessions = db.prepare('SELECT * FROM sessions WHERE date = ? ORDER BY created_at DESC').all(date);
    } else {
      sessions = db.prepare('SELECT * FROM sessions ORDER BY date DESC, created_at DESC').all();
    }

    // Attach exercises to each session
    const getExercises = db.prepare(`
      SELECT e.* FROM exercises e
      JOIN session_exercises se ON se.exercise_id = e.id
      WHERE se.session_id = ?
      ORDER BY e.name
    `);

    const result = sessions.map(s => ({
      ...s,
      exercises: getExercises.all(s.id),
    }));

    res.json(result);
  } catch (err) {
    console.error('Sessions query error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', (req, res) => {
  const { date, notes, exercise_ids } = req.body;

  if (!date) return res.status(400).json({ error: 'date is required' });
  if (!Array.isArray(exercise_ids) || exercise_ids.length === 0) {
    return res.status(400).json({ error: 'exercise_ids must be a non-empty array' });
  }

  const insertSession = db.prepare('INSERT INTO sessions (date, notes) VALUES (?, ?)');
  const insertLink = db.prepare('INSERT INTO session_exercises (session_id, exercise_id) VALUES (?, ?)');

  try {
    const createSession = db.transaction(() => {
      const info = insertSession.run(date, notes || null);
      const sessionId = info.lastInsertRowid;
      for (const eid of exercise_ids) {
        insertLink.run(sessionId, eid);
      }
      return sessionId;
    });

    const sessionId = createSession();
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    const exercises = db.prepare(`
      SELECT e.* FROM exercises e
      JOIN session_exercises se ON se.exercise_id = e.id
      WHERE se.session_id = ?
    `).all(sessionId);

    res.status(201).json({ ...session, exercises });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
