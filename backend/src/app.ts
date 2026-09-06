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

// Konfigurasi CORS: mendukung beberapa domain sekaligus (pisah koma di FRONTEND_URL)
// Contoh: FRONTEND_URL=https://bumilfit.vercel.app,http://localhost:5173
const rawFrontendUrls = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawFrontendUrls.split(',').map((url) => url.trim()).filter(Boolean);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Izinkan request tanpa origin (misal curl, server-to-server, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin '${origin}' tidak diizinkan.`));
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
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'BumilFit Backend Sehat! 🚀' });
});

export default app;
