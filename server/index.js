// ============================================================
// Blood Donation Platform — Express Entry Point
// ============================================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');


const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const donorRoutes = require('./routes/donors');
const donationRoutes = require('./routes/donations');
const interactionRoutes = require('./routes/interactions');
const adminRoutes = require('./routes/admin');
const { authenticate } = require('./middleware/auth');
const supabase = require('./lib/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security ────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS ────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://127.0.0.1:5500,http://localhost:5500')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin(origin, cb) {
    // Allow all origins on Vercel (same-domain), restrict locally
    if (!origin || isProduction || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body parsing & logging ──────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// ── Public routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);

// Public locations endpoint
app.get('/api/locations', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'LOCATIONS_ERROR' });
  }
});

// ── Authenticated routes ────────────────────────────────────
app.use('/api/users', authenticate, userRoutes);
app.use('/api/donors', authenticate, donorRoutes);
app.use('/api/donations', authenticate, donationRoutes);
app.use('/api/interactions', authenticate, interactionRoutes);
app.use('/api/admin', authenticate, adminRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ── 404 catch-all ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' });
});

// ── Global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', code: 'INTERNAL_ERROR' });
});

// ── Start (only when not on Vercel) ─────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🩸 Blood Donation API running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
