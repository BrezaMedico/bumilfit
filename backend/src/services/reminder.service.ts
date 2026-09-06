import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { whatsappService } from './whatsapp.service.js';
import { sendAppEmail } from './email.service.js';

// Helper konversi usia kehamilan minggu ke bulan (1 s.d. 9)
function getPregnancyMonth(weeks: number): number {
  if (weeks <= 4) return 1;
  if (weeks <= 8) return 2;
  if (weeks <= 12) return 3;
  if (weeks <= 16) return 4;
  if (weeks <= 20) return 5;
  if (weeks <= 24) return 6;
  if (weeks <= 28) return 7;
  if (weeks <= 32) return 8;
  return 9;
}

function getRiskCategoryEnum(val: string | null | undefined): 'RENDAH' | 'SEDANG' | 'TINGGI' {
  if (!val) return 'RENDAH';
  const norm = val.toLowerCase();
  if (norm.includes('tinggi')) return 'TINGGI';
  if (norm.includes('sedang')) return 'SEDANG';
  return 'RENDAH';
}

/**
 * Kirim Pengingat To-Do List via WhatsApp
 */
export const sendReminderWhatsApp = async (
  phone: string,
  namaIbu: string,
  pendingTasks: string[],
  type: 'morning' | 'evening'
): Promise<boolean> => {
  try {
    const isMorning = type === 'morning';
    const headerTitle = isMorning ? `🌅 *Selamat Pagi Bunda ${namaIbu}!* 🌸` : `🌙 *Selamat Malam Bunda ${namaIbu}!* ✨`;
    const introText = isMorning
      ? `Awali hari ini dengan penuh semangat dan cinta untuk si Kecil dalam kandungan. Jangan lupa menyelesaikan to-do list harian Bunda ya:`
      : `Hari ini hampir usai! Luangkan waktu 2 menit sebelum beristirahat untuk melengkapi to-do list kehamilan Bunda agar catatan kesehatan tetap optimal:`;

    const taskListFormatted = pendingTasks
      .map((task, idx) => `  ${idx + 1}. 📋 ${task}`)
      .join('\n');

    const closingText = isMorning
      ? `Yuk langsung buka dan centang kegiatan yang sudah selesai di website BUMILFIT:\n👉 ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n\nSemoga hari Bunda menyenangkan dan selalu sehat! 💖\n*BUMILFIT*`
      : `Buka website BUMILFIT untuk menyelesaikan to-do hari ini:\n👉 ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n\nSelamat beristirahat dengan nyenyak bersama buah hati! 💤\n*BUMILFIT*`;

    const message = `${headerTitle}\n\n${introText}\n\n*Tugas yang Perlu Dilakukan:*\n${taskListFormatted}\n\n${closingText}`;

    const res = await whatsappService.sendMessage(phone, message);
    return res.success;
  } catch (error) {
    console.error(`❌ [Reminder WhatsApp] Gagal kirim pengingat ke ${phone}:`, error);
    return false;
  }
};

/**
 * Kirim Pengingat To-Do List via Email (Nodemailer)
 */
export const sendReminderEmail = async (
  email: string,
  namaIbu: string,
  pendingTasks: string[],
  type: 'morning' | 'evening'
): Promise<boolean> => {
  const isMorning = type === 'morning';
  const subject = isMorning 
    ? `🌅 Selamat Pagi Bunda ${namaIbu}! Yuk Lengkapi To-Do List Harian Bunda di BUMILFIT`
    : `🌙 Pengingat Malam: Lengkapi To-Do List Kehamilan Bunda Hari Ini di BUMILFIT`;

  const webUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const taskListHtml = pendingTasks
    .map((task, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 14px; color: #194668; font-weight: 700; width: 32px; vertical-align: top;">${idx + 1}.</td>
        <td style="padding: 10px 14px; color: #334155; font-size: 14px; line-height: 1.5;">${task}</td>
      </tr>
    `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
          .header { background: linear-gradient(135deg, #194668, #389D9C); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
          .content { padding: 28px 24px; }
          .greeting { font-size: 16px; font-weight: bold; color: #194668; margin-bottom: 12px; }
          .desc { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px; }
          .task-table { width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 24px; }
          .cta-btn { display: inline-block; background: #389D9C; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; margin: 12px 0 20px 0; }
          .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BUMILFIT</h1>
            <p>Pendamping Kesehatan Ibu Hamil & Buah Hati</p>
          </div>
          <div class="content">
            <div class="greeting">
              ${isMorning ? '🌅 Selamat Pagi, Bunda ' + namaIbu + '!' : '🌙 Selamat Malam, Bunda ' + namaIbu + '!'}
            </div>
            <p class="desc">
              ${isMorning 
                ? 'Semoga Bunda selalu sehat dan berenergi. Berikut adalah to-do list harian yang direkomendasikan untuk perkembangan si Kecil hari ini:'
                : 'Hari ini hampir berakhir. Yuk pastikan seluruh aktivitas to-do list harian Bunda sudah tercatat sebelum beristirahat:'}
            </p>

            <table class="task-table">
              <thead>
                <tr style="background: #e6f4f4; text-align: left;">
                  <th style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #194668; width: 32px;">No</th>
                  <th style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #194668;">Kegiatan Hari Ini</th>
                </tr>
              </thead>
              <tbody>
                ${taskListHtml}
              </tbody>
            </table>

            <div style="text-align: center;">
              <a href="${webUrl}" class="cta-btn">Buka & Centang To-Do List</a>
            </div>

            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; text-align: center;">
              *Pengingat ini dikirim otomatis untuk mendukung kesehatan kehamilan Bunda. Jika to-do list sudah diselesaikan seluruhnya, pengingat tidak akan dikirim kembali hari ini.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} BumilFit. Seluruh hak cipta dilindungi.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendAppEmail({
    to: email,
    subject,
    html,
    text: `${isMorning ? 'Selamat pagi' : 'Selamat malam'} Bunda ${namaIbu}!\n\nJangan lupa kegiatan to-do list kehamilan Anda hari ini:\n${pendingTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nBuka BUMILFIT: ${webUrl}`
  });
};

/**
 * Eksekusi pengiriman pengingat harian ke seluruh ibu hamil aktif
 */
export const sendDailyReminders = async (type: 'morning' | 'evening'): Promise<{
  totalProcessed: number;
  remindersSent: number;
  pausedUsers: number;
  skippedCompleted: number;
}> => {
  console.log(`\n⏰ [Reminder Service] Memulai pengiriman pengingat (${type.toUpperCase()}) pada ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB...`);

  let totalProcessed = 0;
  let remindersSent = 0;
  let pausedUsers = 0;
  let skippedCompleted = 0;

  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'IBU_HAMIL',
        isVerified: true,
        profilIbu: { isNot: null }
      },
      include: {
        profilIbu: true
      }
    });

    const now = new Date();

    for (const user of users) {
      totalProcessed++;
      const profile = user.profilIbu!;

      // 1. ATURAN 7 HARI TIDAK AKTIF (DORMANCY CHECK)
      const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : new Date(user.createdAt);
      const inactiveDiffMs = now.getTime() - lastActive.getTime();
      const inactiveDays = Math.floor(inactiveDiffMs / (1000 * 60 * 60 * 24));

      if (inactiveDays >= 7) {
        if (!user.reminderAutoPaused) {
          await prisma.user.update({
            where: { id: user.id },
            data: { reminderAutoPaused: true }
          });
          console.log(`⏸️ [Reminder Service] Pengingat untuk ${user.email} di-pause otomatis (tidak aktif ${inactiveDays} hari berturut-turut).`);
        }
        pausedUsers++;
        continue;
      }

      // Jika user saat ini sedang di-pause, lewati
      if (user.reminderAutoPaused) {
        pausedUsers++;
        continue;
      }

      // 2. HITUNG TO-DO LIST HARI INI
      const lastUpdate = new Date(profile.usiaKehamilanUpdatedAt);
      const lastUpdateDateOnly = Date.UTC(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate());
      const nowDateOnly = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.max(0, Math.floor((nowDateOnly - lastUpdateDateOnly) / (1000 * 60 * 60 * 24)));

      const totalDays = (profile.usiaKehamilanMinggu * 7) + profile.usiaKehamilanHari + diffDays;
      const currentWeek = Math.floor(totalDays / 7);
      const pregnancyMonth = getPregnancyMonth(currentWeek);
      const dayOfCycle = (totalDays % 7) + 1; // 1 s.d. 7
      const riskCategory = getRiskCategoryEnum(profile.kategoriSkrining);

      const masterTodos = await prisma.masterTodo.findMany({
        where: {
          bulan: pregnancyMonth,
          kategoriRisiko: riskCategory,
          hariKe: dayOfCycle
        },
        orderBy: { noTugas: 'asc' }
      });

      if (masterTodos.length === 0) {
        continue;
      }

      // 3. CEK PENYELESAIAN HARI INI
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

      const completedTodosToday = await prisma.userTodo.findMany({
        where: {
          userId: user.id,
          tanggal: {
            gte: startOfToday,
            lt: endOfToday
          },
          isCompleted: true
        }
      });

      const completedMasterIds = new Set(completedTodosToday.map(ut => ut.masterTodoId));
      const pendingTasks = masterTodos.filter(t => !completedMasterIds.has(t.id));

      // 4. JIKA SEMUA SUDAH SELESAI, TIDAK USAH DIINGATKAN
      if (pendingTasks.length === 0) {
        console.log(`✅ [Reminder Service] ${user.email} telah menyelesaikan seluruh to-do hari ini (${completedTodosToday.length}/${masterTodos.length}). Pengingat dilewati.`);
        skippedCompleted++;
        continue;
      }

      // 5. JIKA BELUM SELESAI -> KIRIM PENGINGAT LEWAT WHATSAPP & EMAIL (KEDUANYA)
      const taskNames = pendingTasks.map(t => t.tugasHarian);
      const namaIbu = profile.namaIbu || 'Bunda';

      console.log(`📢 [Reminder Service] Mengirim pengingat ke ${user.email} (${pendingTasks.length} tugas tersisa)...`);

      // Saluran 1: WhatsApp
      if (profile.nomorWhatsapp) {
        await sendReminderWhatsApp(profile.nomorWhatsapp, namaIbu, taskNames, type);
      }

      // Saluran 2: Email
      if (user.email) {
        await sendReminderEmail(user.email, namaIbu, taskNames, type);
      }

      remindersSent++;
    }

    console.log(`🏁 [Reminder Service] Selesai: Total Diperiksa: ${totalProcessed}, Pengingat Terkirim: ${remindersSent}, Selesai Lengkap (Dilewati): ${skippedCompleted}, Di-pause (7 Hari Inaktif): ${pausedUsers}.\n`);

    return {
      totalProcessed,
      remindersSent,
      pausedUsers,
      skippedCompleted
    };
  } catch (error) {
    console.error('❌ [Reminder Service] Kesalahan saat menjalankan pengingat harian:', error);
    return {
      totalProcessed,
      remindersSent,
      pausedUsers,
      skippedCompleted
    };
  }
};

/**
 * Inisialisasi Cron Job Penjadwalan Otomatis
 * - Pagi: Jam 08:00 WIB (0 8 * * *)
 * - Malam: Jam 20:00 WIB (0 20 * * *)
 * Menggunakan zona waktu Asia/Jakarta (WIB)
 */
export const initReminderCron = () => {
  // Jadwal Pagi: Jam 08:00 WIB
  cron.schedule(
    '0 8 * * *',
    async () => {
      console.log('⏰ [Cron Job] Menjalankan pengingat to-do pagi (08:00 WIB)...');
      await sendDailyReminders('morning');
    },
    {
      timezone: 'Asia/Jakarta'
    }
  );

  // Jadwal Malam: Jam 20:00 WIB
  cron.schedule(
    '0 20 * * *',
    async () => {
      console.log('⏰ [Cron Job] Menjalankan pengingat to-do malam (20:00 WIB)...');
      await sendDailyReminders('evening');
    },
    {
      timezone: 'Asia/Jakarta'
    }
  );

  console.log('🕒 [Reminder Service] Cron Job Pengingat To-Do List telah aktif (08:00 & 20:00 WIB).');
};
