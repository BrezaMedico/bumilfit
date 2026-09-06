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
  const { sendAppEmail } = await import('./services/email.service.js');

  const result = await sendAppEmail({
    to,
    subject: 'Tes Pengiriman Email BumilFit Berhasil! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; border-radius: 16px; background: #ffffff; border: 1px solid #e2e8f0; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
        <h2 style="color: #194668; margin: 0 0 10px 0;">BUMILFIT Email Berhasil! 🚀</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: left;">Halo Bunda / Tim BumilFit! Jika Anda membaca pesan ini, berarti sistem pengiriman email <strong>bumilfit@gmail.com</strong> di server cloud Render sudah 100% aktif dan berjalan lancar!</p>
        <div style="padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #64748b; text-align: left;">
          ⚡ Pengiriman berhasil melewati firewall Render via Brevo HTTPS REST API (Port 443).
        </div>
      </div>
    `,
    text: `Halo! Sistem email BumilFit berhasil mengirim pesan ke ${to}!`,
  });

  if (result.success) {
    return res.status(200).json({
      success: true,
      message: `Email tes berhasil dikirim ke: ${to} 🚀`,
      provider: result.provider,
      messageId: result.messageId,
    });
  } else {
    return res.status(500).json({
      success: false,
      message: `Gagal mengirim email ke ${to}.`,
      provider: result.provider,
      error: result.error,
      hint: !process.env.BREVO_API_KEY ? 'BREVO_API_KEY belum diset di Environment Variables Render!' : undefined,
    });
  }
});

export default app;
