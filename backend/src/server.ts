import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import app from './app.js';
import prisma from './lib/prisma.js';
import { whatsappService } from './services/whatsapp.service.js';
import { initReminderCron } from './services/reminder.service.js';

process.on('unhandledRejection', (reason: any) => {
  console.warn('⚠️ [Unhandled Rejection ditangani]:', reason?.message || reason);
});

process.on('uncaughtException', (error: any) => {
  console.error('⚠️ [Uncaught Exception ditangani]:', error?.message || error);
});

const PORT = process.env.PORT || 5000;

async function seedWhatsAppAdmin() {
  const adminEmail = (process.env.WHATSAPP_ADMIN_EMAIL || 'bumilfit@gmail.com').toLowerCase().trim();
  const adminPassword = process.env.WHATSAPP_ADMIN_PASSWORD || 'Allahswt_123';

  try {
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (!existing) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'WHATSAPP_ADMIN',
          isVerified: true,
          authProvider: 'LOCAL',
        },
      });
      console.log(`✅ [Admin Seed] Akun WhatsApp Admin (${adminEmail}) berhasil diinisialisasi.`);
    } else {
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: 'WHATSAPP_ADMIN',
          password: hashedPassword,
          isVerified: true,
          authProvider: 'LOCAL',
        },
      });
      console.log(`✅ [Admin Seed] Akun WhatsApp Admin (${adminEmail}) telah sinkron sebagai WHATSAPP_ADMIN.`);
    }
  } catch (error) {
    console.error('⚠️ [Admin Seed] Gagal sinkronisasi akun WhatsApp Admin:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Backend BumilFit bersiap di port ${PORT} 🚀`);

  // Inisialisasi akun WhatsApp Admin & layanan WhatsApp Gateway
  await seedWhatsAppAdmin();
  whatsappService.init().catch((err) => {
    console.error('⚠️ Gagal auto-init WhatsApp Service saat startup:', err);
  });

  // Inisialisasi Cron Job Pengingat To-Do List Harian (08:00 & 20:00 WIB)
  initReminderCron();
});
