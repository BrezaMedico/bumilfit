import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes.js';
import chatAiRoutes from './routes/chat-ai.routes.js';
import komunitasRoutes from './routes/komunitas.routes.js';
import giziRoutes from './routes/gizi.routes.js';
import todoRoutes from './routes/todo.routes.js';

const app = express();

// Konfigurasi CORS agar frontend React bisa membaca cookie sesi
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/chat-ai', chatAiRoutes);
app.use('/api/komunitas', komunitasRoutes);
app.use('/api/gizi', giziRoutes);
app.use('/api/todo', todoRoutes);

// Endpoint pengujian healthcheck
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'BumilFit Backend Sehat! 🚀' });
});

export default app;
