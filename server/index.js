require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const exercisesRoutes = require('./routes/exercises');
const sessionsRoutes = require('./routes/sessions');
const pushRoutes = require('./routes/push');
const collectionsRoutes = require('./routes/collections');
const { initPushScheduler } = require('./services/pushScheduler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Public
app.use('/api/auth', authRoutes);

// Protected
app.use('/api/exercises', authMiddleware, exercisesRoutes);
app.use('/api/sessions', authMiddleware, sessionsRoutes);
app.use('/api/push', authMiddleware, pushRoutes);
app.use('/api/collections', authMiddleware, collectionsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initPushScheduler();
});
