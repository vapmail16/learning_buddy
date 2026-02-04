const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const coursesRouter = require('./routes/courses');
const sessionsRouter = require('./routes/sessions');
const uploadsRouter = require('./routes/uploads');
const notesRouter = require('./routes/notes');

// CORS: allow ALLOWED_ORIGINS (comma-separated) or FRONTEND_URL; dev allows localhost
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:5173', 'http://localhost:3000']);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalized = origin.toLowerCase().replace(/\/$/, '');
    const allowed = allowedOrigins.map((o) => o.toLowerCase().replace(/\/$/, ''));
    if (allowed.includes(normalized)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Mount all API routes under /api so proxy (frontend /api -> backend) works without path rewrite
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/notes', notesRouter);
// Legacy root paths for direct calls to backend (e.g. curl localhost:3000/health)
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/courses', coursesRouter);
app.use('/sessions', sessionsRouter);
app.use('/uploads', uploadsRouter);
app.use('/notes', notesRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.method + ' ' + req.path });
});

module.exports = app;
