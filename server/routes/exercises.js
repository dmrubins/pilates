const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const { existsSync, unlinkSync } = require('fs');
const db = require('../db/connection');

const router = express.Router();

const IMAGES_DIR = process.env.IMAGES_DIR ||
  path.join(__dirname, '../../client/public/images');

const storage = multer.diskStorage({
  destination: IMAGES_DIR,
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// GET /api/exercises
router.get('/', (req, res) => {
  const { body_part, min_duration, max_duration, ease, difficulty } = req.query;
  let sql = 'SELECT * FROM exercises WHERE 1=1';
  const params = [];

  if (body_part) { sql += ' AND body_part = ?'; params.push(body_part); }
  if (min_duration) { sql += ' AND duration_minutes >= ?'; params.push(parseInt(min_duration, 10)); }
  if (max_duration) { sql += ' AND duration_minutes <= ?'; params.push(parseInt(max_duration, 10)); }
  if (ease) { sql += ' AND ease_level = ?'; params.push(parseInt(ease, 10)); }
  if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
  sql += ' ORDER BY card_number, name';

  try {
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/exercises/body-parts
router.get('/body-parts', (req, res) => {
  try {
    const rows = db.prepare(
      "SELECT DISTINCT body_part FROM exercises WHERE body_part IS NOT NULL ORDER BY body_part"
    ).all();
    res.json(rows.map(r => r.body_part));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/exercises/:id
router.get('/:id', (req, res) => {
  try {
    const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'Not found' });
    res.json(ex);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/exercises
router.post('/', upload.array('photos', 20), (req, res) => {
  const { name, body_part, difficulty, ease_level, duration_minutes,
          sets, reps, instructions, description } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });

  const uploadedFiles = (req.files || []).map(f => f.filename);

  try {
    const info = db.prepare(`
      INSERT INTO exercises
        (name, body_part, difficulty, ease_level, duration_minutes,
         sets, reps, instructions, description, photo_filenames)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      body_part || null,
      difficulty || null,
      parseInt(ease_level, 10) || 3,
      duration_minutes ? parseInt(duration_minutes, 10) : null,
      sets || null,
      reps || null,
      instructions || null,
      description || null,
      JSON.stringify(uploadedFiles)
    );
    const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(ex);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'An exercise with that name already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/exercises/:id
router.put('/:id', upload.array('photos', 20), (req, res) => {
  const existing = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { name, body_part, difficulty, ease_level, duration_minutes,
          sets, reps, instructions, description, remove_photos } = req.body;

  // Parse current photos, apply removals, append new uploads
  let photos = [];
  try { photos = JSON.parse(existing.photo_filenames || '[]'); } catch {}

  if (remove_photos) {
    const toRemove = JSON.parse(remove_photos);
    // Delete files from disk
    for (const filename of toRemove) {
      const fpath = path.join(IMAGES_DIR, filename);
      if (existsSync(fpath)) { try { unlinkSync(fpath); } catch {} }
    }
    photos = photos.filter(p => !toRemove.includes(p));
  }

  const newFiles = (req.files || []).map(f => f.filename);
  photos = [...photos, ...newFiles];

  try {
    db.prepare(`
      UPDATE exercises SET
        name = ?, body_part = ?, difficulty = ?, ease_level = ?,
        duration_minutes = ?, sets = ?, reps = ?, instructions = ?,
        description = ?, photo_filenames = ?
      WHERE id = ?
    `).run(
      name ?? existing.name,
      body_part !== undefined ? (body_part || null) : existing.body_part,
      difficulty !== undefined ? (difficulty || null) : existing.difficulty,
      ease_level ? parseInt(ease_level, 10) : existing.ease_level,
      duration_minutes !== undefined
        ? (duration_minutes ? parseInt(duration_minutes, 10) : null)
        : existing.duration_minutes,
      sets !== undefined ? (sets || null) : existing.sets,
      reps !== undefined ? (reps || null) : existing.reps,
      instructions !== undefined ? (instructions || null) : existing.instructions,
      description !== undefined ? (description || null) : existing.description,
      JSON.stringify(photos),
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'An exercise with that name already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/exercises/:id
router.delete('/:id', (req, res) => {
  try {
    const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'Not found' });

    // Delete photo files from disk
    let photos = [];
    try { photos = JSON.parse(ex.photo_filenames || '[]'); } catch {}
    for (const filename of photos) {
      const fpath = path.join(IMAGES_DIR, filename);
      if (existsSync(fpath)) { try { unlinkSync(fpath); } catch {} }
    }

    db.prepare('DELETE FROM exercises WHERE id = ?').run(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
