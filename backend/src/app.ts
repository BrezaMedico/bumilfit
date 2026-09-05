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
import subscriptionRoutes from './routes/subscription.routes.js';
import orderRoutes from './routes/order.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';

const app = express();

// Konfigurasi CORS agar frontend React di Vercel dan lokal bisa mengakses API
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Daftarkan route untuk prefix '/api' dan juga langsung di root (kompatibilitas jika frontend memanggil tanpa /api)
const registerRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/chat-ai`, chatAiRoutes);
  app.use(`${prefix}/komunitas`, komunitasRoutes);
  app.use(`${prefix}/gizi`, giziRoutes);
  app.use(`${prefix}/todo`, todoRoutes);
  app.use(`${prefix}/subscription`, subscriptionRoutes);
  app.use(`${prefix}/orders`, orderRoutes);
  app.use(`${prefix}/whatsapp`, whatsappRoutes);
};

registerRoutes('/api');
registerRoutes('');

// Endpoint pengujian healthcheck
app.get(['/api/health', '/health'], (_req, res) => {
  res.status(200).json({ status: 'BumilFit Backend Sehat! 🚀' });
});

export default app;
