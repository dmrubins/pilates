const express = require('express');
const webpush = require('web-push');
const db = require('../db/connection');

const router = express.Router();

router.post('/subscribe', (req, res) => {
  const { subscription, schedule_days, schedule_time } = req.body;

  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  try {
    db.prepare(`
      INSERT INTO push_subscriptions (endpoint, subscription_json, schedule_days, schedule_time)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        subscription_json = excluded.subscription_json,
        schedule_days = excluded.schedule_days,
        schedule_time = excluded.schedule_time
    `).run(
      subscription.endpoint,
      JSON.stringify(subscription),
      JSON.stringify(schedule_days || []),
      schedule_time || '08:00'
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/subscribe', (req, res) => {
  const { endpoint, schedule_days, schedule_time } = req.body;

  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });

  try {
    const info = db.prepare(`
      UPDATE push_subscriptions SET schedule_days = ?, schedule_time = ?
      WHERE endpoint = ?
    `).run(JSON.stringify(schedule_days || []), schedule_time || '08:00', endpoint);

    if (info.changes === 0) return res.status(404).json({ error: 'Subscription not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/subscribe', (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });

  try {
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/test', async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });

  const row = db.prepare('SELECT * FROM push_subscriptions WHERE endpoint = ?').get(endpoint);
  if (!row) return res.status(404).json({ error: 'Subscription not found' });

  try {
    await webpush.sendNotification(
      JSON.parse(row.subscription_json),
      JSON.stringify({
        title: 'Torque & Tension',
        body: 'Test notification — reminders are working!',
        url: '/',
      })
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Test push error:', err);
    res.status(500).json({ error: 'Push failed', detail: err.message });
  }
});

module.exports = router;
