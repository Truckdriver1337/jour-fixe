import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: in production, set ALLOWED_ORIGINS env var to your GitHub Pages URL
// e.g. ALLOWED_ORIGINS=https://yourname.github.io
// Multiple origins allowed: comma-separated
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',').map((s) => s.trim());

app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  credentials: false,
}));
app.use(express.json({ limit: '5mb' }));

// in-memory store: Map<key, jsonString>
const store = new Map();
const accessTimes = new Map();

app.get('/api/health', (req, res) => {
  res.json({ ok: true, sessions: store.size, uptime: process.uptime() });
});

app.get('/api/storage/:key', (req, res) => {
  const value = store.get(req.params.key);
  if (value === undefined) return res.status(404).json({ error: 'not found' });
  accessTimes.set(req.params.key, Date.now());
  res.json({ key: req.params.key, value });
});

app.put('/api/storage/:key', (req, res) => {
  const { value } = req.body || {};
  if (typeof value !== 'string') return res.status(400).json({ error: 'value must be a string' });
  if (value.length > 5 * 1024 * 1024) return res.status(413).json({ error: 'value too large' });
  store.set(req.params.key, value);
  accessTimes.set(req.params.key, Date.now());
  res.json({ key: req.params.key, value });
});

app.delete('/api/storage/:key', (req, res) => {
  store.delete(req.params.key);
  accessTimes.delete(req.params.key);
  res.json({ key: req.params.key, deleted: true });
});

// auto-cleanup: remove sessions inactive for 24h
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, ts] of accessTimes.entries()) {
    if (ts < cutoff) { store.delete(key); accessTimes.delete(key); }
  }
}, 60 * 60 * 1000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`jour fixe backend listening on http://0.0.0.0:${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
});
