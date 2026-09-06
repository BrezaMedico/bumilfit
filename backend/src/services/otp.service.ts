import prisma from '../lib/prisma.js';
import { whatsappService } from './whatsapp.service.js';
import { sendAppEmail } from './email.service.js';

const sendEmail = async (email: string, otpCode: string) => {
  return sendAppEmail({
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
};

const dispatchDelivery = async (
  otpCode: string,
  email: string,
  channel: 'email' | 'whatsapp',
  phone?: string
) => {
  console.log(`\n=========================================`);
  console.log(`🔑 KODE OTP BUMILFIT: ${otpCode}`);
  console.log(`📩 EMAIL TUJUAN: ${email}`);
  if (phone) console.log(`📱 WHATSAPP TUJUAN: ${phone}`);
  console.log(`⏳ Berlaku selama 5 menit.`);
  console.log(`=========================================\n`);

  if (channel === 'whatsapp') {
    let waDelivered = false;
    if (phone) {
      console.log(`📱 [OTP Service] Mengirim OTP WhatsApp ke: ${phone}...`);
      const waResult = await whatsappService.sendOtpMessage(phone, otpCode);
      if (waResult.success) {
        waDelivered = true;
        console.log(`✅ [OTP Service] WhatsApp OTP terkirim ke: ${phone}`);
      } else {
        console.warn(`⚠️ [OTP Service] WhatsApp belum terhubung: ${waResult.message}`);
      }
    }

    // Jaring pengaman: Jika WhatsApp belum tersambung, otomatis kirimkan juga via Email!
    if (!waDelivered && email) {
      console.log(`ℹ️ [OTP Service] Mengirim cadangan OTP ke Email: ${email}`);
      await sendEmail(email, otpCode);
    }
  } else {
    await sendEmail(email, otpCode);
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

  // Simpan atau update ke database
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

  // Pengiriman asinkron di background agar respon ke frontend instan (<30ms) tanpa lag!
  dispatchDelivery(otpCode, email, channel, phone).catch((err) => {
    console.error('⚠️ [OTP Service] Error background dispatch:', err);
  });

  return otpCode;
};

