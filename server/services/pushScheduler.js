const cron = require('node-cron');
const webpush = require('web-push');
const db = require('../db/connection');

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function initPushScheduler() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not set — push notifications disabled.');
    return;
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  cron.schedule('* * * * *', () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = DAY_NAMES[now.getDay()];

    const subs = db
      .prepare('SELECT * FROM push_subscriptions WHERE schedule_time = ?')
      .all(currentTime);

    for (const sub of subs) {
      let days;
      try {
        days = JSON.parse(sub.schedule_days);
      } catch {
        days = [];
      }

      if (!days.includes(currentDay)) continue;

      const subscription = JSON.parse(sub.subscription_json);
      const payload = JSON.stringify({
        title: "Time for Pilates!",
        body: "Your Torque & Tension workout is ready. Let's move!",
        url: '/',
      });

      webpush.sendNotification(subscription, payload).catch((err) => {
        if (err.statusCode === 410) {
          // Subscription expired — clean up
          db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
          console.log(`Removed expired subscription: ${sub.endpoint.slice(0, 40)}...`);
        } else {
          console.error('Push send error:', err.message);
        }
      });
    }
  });

  console.log('Push scheduler started.');
}

module.exports = { initPushScheduler };
