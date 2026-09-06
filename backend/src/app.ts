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

// Request Logger Middleware
app.use((req, _res, next) => {
  console.log(`📡 [${req.method}] ${req.originalUrl || req.url}`);
  next();
});

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

// Endpoint pengujian kirim email langsung via browser: /api/health/test-email?to=emailanda@gmail.com
app.get('/api/health/test-email', async (req: express.Request, res: express.Response) => {
  const to = (req.query.to as string) || process.env.GOOGLE_APP_EMAIL || 'bumilfit@gmail.com';
  const rawUser = process.env.GOOGLE_APP_EMAIL || 'bumilfit@gmail.com';
  const user = rawUser.replace(/['"\s]+/g, '').trim();
  const rawPass = process.env.GOOGLE_APP_PASSKEY || '';
  const pass = rawPass.replace(/['"\s]+/g, '').trim();

  if (!pass) {
    return res.status(500).json({
      success: false,
      message: 'GOOGLE_APP_PASSKEY belum diisi di Environment Variables Render.',
    });
  }

  try {
    const transporter = (await import('nodemailer')).default.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `"BUMILFIT Test" <${user}>`,
      to,
      subject: 'Tes Pengiriman Email BumilFit Berhasil! 🎉',
      text: `Halo! Jika Anda membaca email ini, berarti sistem email bumilfit@gmail.com di server Render sudah berjalan 100% sempurna!`,
    });

    console.log(`✅ [Test Email] Email tes terkirim ke: ${to}`);
    return res.status(200).json({
      success: true,
      message: `Email tes berhasil dikirim ke: ${to}`,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error(`❌ [Test Email] Gagal mengirim:`, err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }
});

export default app;
