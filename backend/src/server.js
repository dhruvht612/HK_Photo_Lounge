import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CLIENT_ORIGIN, PORT, UPLOAD_DIR } from './config/env.js';
import { initSchema, db } from './db/database.js';

import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import portfolioRoutes from './routes/portfolio.js';
import servicesRoutes from './routes/services.js';
import testimonialsRoutes from './routes/testimonials.js';
import inquiriesRoutes from './routes/inquiries.js';
import settingsRoutes from './routes/settings.js';
import homeRoutes from './routes/home.js';
import uploadsRoutes from './routes/uploads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.isAbsolute(UPLOAD_DIR) ? UPLOAD_DIR : path.join(__dirname, '../', UPLOAD_DIR);
fs.mkdirSync(uploadRoot, { recursive: true });

initSchema();

const app = express();
app.use(
  cors({
    origin: CLIENT_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.use('/uploads', express.static(uploadRoot));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: !!db });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/uploads', uploadsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`HK Photo Lounge API listening on http://localhost:${PORT}`);
});
