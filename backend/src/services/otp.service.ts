import prisma from '../lib/prisma.js';

export const generateAndSendOtp = async (userId: string, email: string) => {
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

  // Simulasi pengiriman email (menggantikan Nodemailer untuk sementara agar ringan)
  console.log(`\n=========================================`);
  console.log(`📩 SIMULASI EMAIL TERKIRIM KE: ${email}`);
  console.log(`🔑 KODE OTP BUMILFIT ANDA: ${otpCode}`);
  console.log(`⏳ Berlaku selama 5 menit.`);
  console.log(`=========================================\n`);
};
