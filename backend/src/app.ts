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

app.use('/api/auth', authRoutes);
app.use('/api/chat-ai', chatAiRoutes);
app.use('/api/komunitas', komunitasRoutes);
app.use('/api/gizi', giziRoutes);
app.use('/api/todo', todoRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Endpoint pengujian healthcheck
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'BumilFit Backend Sehat! 🚀' });
});

export default app;
