const express = require('express');
const db = require('../db/connection');

const router = express.Router();

// GET /api/collections
router.get('/', (req, res) => {
  try {
    const collections = db.prepare(`
      SELECT c.*, COUNT(ce.id) as exercise_count
      FROM collections c
      LEFT JOIN collection_exercises ce ON ce.collection_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();
    res.json(collections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/collections
router.post('/', (req, res) => {
  const { name, exercise_ids = [] } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const info = db.prepare('INSERT INTO collections (name) VALUES (?)').run(name.trim());
    const id = info.lastInsertRowid;
    if (exercise_ids.length) {
      const insert = db.prepare(
        'INSERT OR IGNORE INTO collection_exercises (collection_id, exercise_id, sort_order) VALUES (?, ?, ?)'
      );
      exercise_ids.forEach((eid, i) => insert.run(id, eid, i));
    }
    res.status(201).json(db.prepare('SELECT * FROM collections WHERE id = ?').get(id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/collections/:id
router.get('/:id', (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) return res.status(404).json({ error: 'Not found' });
    const exercises = db.prepare(`
      SELECT e.* FROM exercises e
      JOIN collection_exercises ce ON ce.exercise_id = e.id
      WHERE ce.collection_id = ?
      ORDER BY ce.sort_order, ce.id
    `).all(req.params.id);
    res.json({ ...collection, exercises });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/collections/:id  (rename)
router.put('/:id', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const result = db.prepare('UPDATE collections SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json(db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/collections/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/collections/:id/exercises  — add exercises
router.post('/:id/exercises', (req, res) => {
  const { exercise_ids = [] } = req.body;
  try {
    const collection = db.prepare('SELECT id FROM collections WHERE id = ?').get(req.params.id);
    if (!collection) return res.status(404).json({ error: 'Not found' });
    const maxRow = db.prepare(
      'SELECT MAX(sort_order) as m FROM collection_exercises WHERE collection_id = ?'
    ).get(req.params.id);
    const base = (maxRow.m ?? -1) + 1;
    const insert = db.prepare(
      'INSERT OR IGNORE INTO collection_exercises (collection_id, exercise_id, sort_order) VALUES (?, ?, ?)'
    );
    exercise_ids.forEach((eid, i) => insert.run(req.params.id, eid, base + i));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/collections/:id/exercises/:eid
router.delete('/:id/exercises/:eid', (req, res) => {
  try {
    db.prepare(
      'DELETE FROM collection_exercises WHERE collection_id = ? AND exercise_id = ?'
    ).run(req.params.id, req.params.eid);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
