const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/', (req, res) => {
  const { body_part, min_duration, max_duration, ease } = req.query;

  let sql = 'SELECT * FROM exercises WHERE 1=1';
  const params = [];

  if (body_part) {
    sql += ' AND body_part = ?';
    params.push(body_part);
  }
  if (min_duration) {
    sql += ' AND duration_minutes >= ?';
    params.push(parseInt(min_duration, 10));
  }
  if (max_duration) {
    sql += ' AND duration_minutes <= ?';
    params.push(parseInt(max_duration, 10));
  }
  if (ease) {
    sql += ' AND ease_level = ?';
    params.push(parseInt(ease, 10));
  }

  sql += ' ORDER BY name';

  try {
    const exercises = db.prepare(sql).all(...params);
    res.json(exercises);
  } catch (err) {
    console.error('Exercises query error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/body-parts', (req, res) => {
  try {
    const rows = db.prepare('SELECT DISTINCT body_part FROM exercises ORDER BY body_part').all();
    res.json(rows.map(r => r.body_part));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Not found' });
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
