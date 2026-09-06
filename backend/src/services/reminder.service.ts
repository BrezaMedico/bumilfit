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
    const bumilUrl = 'https://bumilfit.vercel.app';

    const header = isMorning
      ? `🌸 *BUMILFIT • SEMANGAT PAGI BUNDA!* 🌸\n━━━━━━━━━━━━━━━━━━━━━━\n🌅 *Selamat Pagi, Bunda ${namaIbu}* ✨`
      : `🌙 *BUMILFIT • PENGINGAT MALAM BUNDA* 🌙\n━━━━━━━━━━━━━━━━━━━━━━\n🌟 *Selamat Malam, Bunda ${namaIbu}* ✨`;

    const intro = isMorning
      ? `Awali hari ini dengan penuh kehangatan dan senyuman untuk si Kecil di dalam kandungan. Yuk, pastikan rutinitas kehamilan Bunda terpenuhi hari ini:`
      : `Hari ini telah berjalan luar biasa! Sebelum Bunda beristirahat nyenyak malam ini, yuk luangkan 1 menit untuk mencatat aktivitas kehamilan Bunda:`;

    const tasks = pendingTasks
      .map((task, idx) => `  *${idx + 1}.* 📋 ${task}`)
      .join('\n');

    const tips = isMorning
      ? `💡 *Tips Hari Ini:* Penuhi hidrasi cairan Bunda dengan minum air putih hangat dan luangkan waktu untuk relaksasi sejenak.`
      : `💡 *Tips Istirahat:* Posisi berbaring miring ke sisi kiri sangat disarankan untuk mengoptimalkan aliran darah & oksigen ke plasenta janin.`;

    const cta = `━━━━━━━━━━━━━━━━━━━━━━\n👉 *Buka & Centang Tugas di Web BumilFit:*\n🔗 ${bumilUrl}\n━━━━━━━━━━━━━━━━━━━━━━\n\n_Semoga Bunda dan buah hati selalu sehat dan bahagia!_ 💖\n*BUMILFIT — Sahabat Kehamilan Bunda*`;

    const message = `${header}\n\n${intro}\n\n📌 *Daftar Kegiatan Bunda Hari Ini:*\n${tasks}\n\n${tips}\n\n${cta}`;

    const res = await whatsappService.sendMessage(phone, message);
    return res.success;
  } catch (error) {
    console.error(`❌ [Reminder WhatsApp] Gagal kirim pengingat ke ${phone}:`, error);
    return false;
  }
};

/**
 * Kirim Pengingat To-Do List via Email (Nodemailer / Brevo API)
 */
export const sendReminderEmail = async (
  email: string,
  namaIbu: string,
  pendingTasks: string[],
  type: 'morning' | 'evening'
): Promise<boolean> => {
  const isMorning = type === 'morning';
  const bumilUrl = 'https://bumilfit.vercel.app';

  const subject = isMorning 
    ? `🌅 Semangat Pagi Bunda ${namaIbu}! Yuk Cek To-Do List Harian di BUMILFIT`
    : `🌙 Pengingat Malam Bunda ${namaIbu}: Lengkapi To-Do List Kehamilan Hari Ini di BUMILFIT`;

  const taskListHtml = pendingTasks
    .map((task, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 14px; text-align: center; vertical-align: middle; width: 44px;">
          <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; background: #e6f4f4; color: #194668; border-radius: 50%; font-weight: 800; font-size: 12px;">${idx + 1}</span>
        </td>
        <td style="padding: 12px 14px; color: #334155; font-size: 14px; line-height: 1.5; font-weight: 500;">
          ${task}
        </td>
      </tr>
    `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(25, 70, 104, 0.06);">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #194668 0%, #389D9C 100%); padding: 36px 28px; text-align: center; color: #ffffff;">
            <div style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 30px; padding: 4px 14px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
              PENGINGAT KEHAMILAN HARIAN
            </div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">BUMILFIT</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.92; font-weight: 500;">Sahabat Setia Kesehatan Kehamilan Bunda & Buah Hati</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px 28px;">
            <div style="font-size: 18px; font-weight: 800; color: #194668; margin-bottom: 10px;">
              ${isMorning ? '🌅 Selamat Pagi, Bunda ' + namaIbu + '! 🌸' : '🌙 Selamat Malam, Bunda ' + namaIbu + '! ✨'}
            </div>
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
              ${isMorning 
                ? 'Semoga hari Bunda dipenuhi rasa nyaman dan energi positif. Berikut adalah to-do list kegiatan harian yang direkomendasikan untuk mendukung tumbuh kembang optimal si Kecil hari ini:'
                : 'Hari ini Bunda telah melakukan yang terbaik! Luangkan waktu 1–2 menit sebelum beristirahat malam untuk memeriksa dan mencatat kegiatan kehamilan Bunda:'}
            </p>

            <!-- Table Tasks -->
            <div style="background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background: #e6f4f4; border-bottom: 1px solid #ccfbf1;">
                    <th style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #194668; font-weight: 800; width: 44px; text-align: center;">No</th>
                    <th style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #194668; font-weight: 800;">Kegiatan Rekomendasi Hari Ini</th>
                  </tr>
                </thead>
                <tbody>
                  ${taskListHtml}
                </tbody>
              </table>
            </div>

            <!-- Motivational Tips Box -->
            <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 14px; padding: 14px 18px; margin-bottom: 28px;">
              <p style="margin: 0; font-size: 13px; color: #115e59; line-height: 1.5;">
                <strong>💡 Catatan Bidan & Dokter:</strong> 
                ${isMorning 
                  ? 'Luangkan waktu untuk mencukupi asupan cairan, berjalan santai, serta nikmati momen bonding dengan mengajak si Kecil berbicara.'
                  : 'Berbaring miring ke sisi kiri sangat baik untuk melancarkan sirkulasi nutrisi menuju plasenta janin saat Bunda tidur lelap.'}
              </p>
            </div>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${bumilUrl}" style="display: inline-block; background: #389D9C; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 14px rgba(56, 157, 156, 0.35); letter-spacing: 0.2px;">
                Buka & Centang To-Do List di Website →
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0; text-align: center;">
              *Tautan langsung: <a href="${bumilUrl}" style="color: #389D9C; text-decoration: underline;">${bumilUrl}</a><br>
              Pengingat ini dikirim otomatis untuk mendampingi kesehatan kehamilan Bunda setiap hari.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            © ${new Date().getFullYear()} BumilFit. Seluruh hak cipta dilindungi.<br>
            Aplikasi Sahabat Kesehatan Kehamilan Indonesia
          </div>
        </div>
      </body>
    </html>
  `;

  const result = await sendAppEmail({
    to: email,
    subject,
    html,
    text: `${isMorning ? 'Selamat pagi' : 'Selamat malam'} Bunda ${namaIbu}!\n\nBerikut to-do list kehamilan Anda hari ini:\n${pendingTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nBuka dan centang di website BumilFit: ${bumilUrl}\n\nBUMILFIT — Sahabat Kehamilan Bunda`
  });
  return result.success;
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
