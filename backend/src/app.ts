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

import { whatsappService } from './services/whatsapp.service.js';

// Endpoint pengujian healthcheck
app.get(['/api/health', '/health'], (_req, res) => {
  const user = process.env.GOOGLE_APP_EMAIL || '';
  const pass = (process.env.GOOGLE_APP_PASSKEY || '').replace(/\s+/g, '');
  res.status(200).json({
    status: 'BumilFit Backend Sehat! 🚀',
    mailConfigured: Boolean(user && pass && pass.length === 16),
    mailSender: user || 'belum_diset',
    whatsappConnected: whatsappService.getStatus().isConnected,
    whatsappStatus: whatsappService.getStatus().status
  });
});

import dns from 'dns';
import nodemailer from 'nodemailer';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

// Endpoint diagnostik pengujian kirim email SMTP live
app.all(['/api/test-email', '/test-email'], async (req, res) => {
  const targetEmail = (req.query.email as string) || req.body?.email || 'brezamedico08@gmail.com';
  const forcePort = req.query.port ? Number(req.query.port) : undefined;
  try {
    const user = process.env.GOOGLE_APP_EMAIL || 'bumilfit@gmail.com';
    const pass = (process.env.GOOGLE_APP_PASSKEY || '').replace(/\s+/g, '');

    const createTransporter = (port: number) => {
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      } as any);
    };

    const portsToTry = forcePort ? [forcePort] : [587, 465];
    let lastError: any = null;
    let result: any = null;
    let usedPort = 587;

    for (const p of portsToTry) {
      try {
        usedPort = p;
        const transporter = createTransporter(p);
        result = await transporter.sendMail({
          from: `"BUMILFIT" <${user}>`,
          to: targetEmail,
          subject: `[Uji Coba Port ${p}] Sistem Pengiriman Email BUMILFIT`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #389D9C;">Pengujian Email Berhasil! ✅</h2>
              <p>Email ini dikirim dari server Render menggunakan port <strong>${p}</strong> (IPv4).</p>
              <p>Sistem pengiriman email dan kode OTP Anda sekarang 100% aktif dan berjalan normal.</p>
            </div>
          `,
          text: `Pengujian Email BUMILFIT Berhasil via Port ${p}!`,
        });
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!result) {
      throw lastError || new Error('Gagal mengirim email via semua port');
    }

    return res.status(200).json({
      success: true,
      portUsed: usedPort,
      message: `Email uji coba berhasil dikirim ke ${targetEmail} via port ${usedPort}`,
      response: result.response,
      messageId: result.messageId,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Gagal mengirim email uji coba',
      errorDetails: String(error),
    });
  }
});

export default app;
