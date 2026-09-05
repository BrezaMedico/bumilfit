import nodemailer, { type Transporter } from 'nodemailer';
import prisma from '../lib/prisma.js';
import { whatsappService } from './whatsapp.service.js';

export const sendEmailOtp = async (email: string, otpCode: string): Promise<boolean> => {
  const user = process.env.GOOGLE_APP_EMAIL || 'bumilfit@gmail.com';
  const rawPass = process.env.GOOGLE_APP_PASSKEY || '';
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) {
    console.warn(`⚠️ [Nodemailer] GOOGLE_APP_EMAIL atau GOOGLE_APP_PASSKEY belum dikonfigurasi.`);
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  try {
    const info = await transporter.sendMail({
      from: `"BUMILFIT" <${user}>`,
      to: email,
      subject: `${otpCode} adalah Kode Verifikasi OTP BUMILFIT Anda`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #194668; margin: 0; font-size: 24px; font-weight: bold;">BUMILFIT</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Pendamping Kesehatan Ibu Hamil & Buah Hati</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
            <p style="color: #475569; font-size: 14px; margin: 0 0 12px 0;">Gunakan kode OTP berikut untuk menyelesaikan proses verifikasi Anda:</p>
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #389D9C; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px dashed #cbd5e1; display: inline-block; margin: 8px 0;">
              ${otpCode}
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0 0;">⏱️ Kode ini berlaku selama <strong>5 menit</strong>. Jangan bagikan kode ini kepada siapa pun.</p>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
            Jika Anda tidak melakukan pendaftaran di BUMILFIT, Anda dapat mengabaikan email ini.
          </p>
        </div>
      `,
      text: `Kode verifikasi OTP BUMILFIT Anda adalah: ${otpCode}. Berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.`
    });
    console.log(`✅ [Nodemailer] Email OTP berhasil dikirim ke: ${email} (Response: ${info.response})`);
    return true;
  } catch (mailErr) {
    console.error(`❌ [Nodemailer] Gagal mengirim email OTP ke ${email}:`, mailErr);
    return false;
  }
};

// Fungsi pengiriman pesan di background (Email & WhatsApp)
const dispatchDelivery = async (
  otpCode: string,
  email: string,
  channel: 'email' | 'whatsapp',
  phone?: string
) => {
  if (channel === 'whatsapp') {
    let waDelivered = false;
    if (phone) {
      console.log(`📱 [OTP Service] Mengirim OTP WhatsApp ke: ${phone}...`);
      const waResult = await whatsappService.sendOtpMessage(phone, otpCode);
      if (!waResult.success) {
        console.warn(`⚠️ [OTP Service] WhatsApp belum terhubung atau gagal: ${waResult.message}`);
      } else {
        waDelivered = true;
      }
    } else {
      console.warn('⚠️ [OTP Service] Nomor WhatsApp tidak disertakan saat meminta OTP WhatsApp.');
    }

    console.log(`\n=========================================`);
    console.log(`📱 WHATSAPP OTP BUMILFIT KE: ${phone || 'Nomor WhatsApp'}`);
    console.log(`🔑 KODE OTP BUMILFIT: ${otpCode}`);
    console.log(`⏳ Berlaku selama 5 menit.`);
    console.log(`=========================================\n`);

    // Fallback otomatis: jika WhatsApp Gateway belum tersambung, otomatis kirimkan juga via Email
    if (!waDelivered && email) {
      console.log(`ℹ️ [OTP Service] WhatsApp gateway belum aktif, mengirimkan cadangan OTP ke email: ${email}`);
      await sendEmailOtp(email, otpCode);
    }
  } else {
    await sendEmailOtp(email, otpCode);

    console.log(`\n=========================================`);
    console.log(`📩 EMAIL OTP BUMILFIT TERKIRIM KE: ${email}`);
    console.log(`🔑 KODE OTP BUMILFIT: ${otpCode}`);
    console.log(`⏳ Berlaku selama 5 menit.`);
    console.log(`=========================================\n`);
  }
};

export const generateAndSendOtp = async (
  userId: string, 
  email: string, 
  channel: 'email' | 'whatsapp' = 'email',
  phone?: string
) => {
  // Generate 6 digit angka acak
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set kedaluwarsa 5 menit dari sekarang
  const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

  // Simpan atau update ke database (proses instan ~20-50ms)
  await prisma.otpVerification.upsert({
    where: { userId },
    update: {
      kode: otpCode,
      expiredAt,
      jumlahPercobaan: 0,
    },
    create: {
      userId,
      kode: otpCode,
      expiredAt,
    },
  });

  // DISPATCH ASINKRON DI BACKGROUND:
  // Jangan menahan respon HTTP saat mengirim email/WA ke Google/Baileys.
  // Ini menghilangkan 100% lag/delay di browser dan membuat proses registrasi terasa seketika (instant)!
  dispatchDelivery(otpCode, email, channel, phone).catch((err) => {
    console.error('⚠️ [OTP Service] Async dispatch error:', err);
  });

  return otpCode;
};

