import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { genAI } from '../lib/gemini.js';
import { sendDailyReminders } from '../services/reminder.service.js';

// Helper to convert gestational weeks to month of pregnancy (1 - 9)
function getPregnancyMonth(weeks: number): number {
  if (weeks <= 4) return 1;
  if (weeks <= 8) return 2;
  if (weeks <= 12) return 3;
  if (weeks <= 16) return 4;
  if (weeks <= 20) return 5;
  if (weeks <= 24) return 6;
  if (weeks <= 28) return 7;
  if (weeks <= 32) return 8;
  return 9; // 33 weeks and beyond is Month 9
}

function getRiskCategoryEnum(val: string | null | undefined): 'RENDAH' | 'SEDANG' | 'TINGGI' {
  if (!val) return 'RENDAH';
  const norm = val.toLowerCase();
  if (norm.includes('tinggi')) return 'TINGGI';
  if (norm.includes('sedang')) return 'SEDANG';
  return 'RENDAH';
}

export const getDailyTodos = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // 1. Ambil Profil Ibu Hamil
    const profile = await prisma.profilIbuHamil.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profil ibu hamil tidak ditemukan' });
    }

    // 2. Hitung Usia Kehamilan secara Dinamis
    const lastUpdate = new Date(profile.usiaKehamilanUpdatedAt);
    const now = new Date();
    
    // Set time ke 00:00:00 UTC untuk menghindari efek timezone
    const lastUpdateDateOnly = Date.UTC(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate());
    const nowDateOnly = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = nowDateOnly - lastUpdateDateOnly;
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    const totalDays = (profile.usiaKehamilanMinggu * 7) + profile.usiaKehamilanHari + diffDays;
    
    const currentWeek = Math.floor(totalDays / 7);
    const currentDay = totalDays % 7; // 0 sampai 6
    
    const pregnancyMonth = getPregnancyMonth(currentWeek);
    const dayOfCycle = (totalDays % 7) + 1; // 1 s.d. 7 (Siklus Harian)

    // 3. Tentukan Kategori Risiko
    const riskCategory = getRiskCategoryEnum(profile.kategoriSkrining);

    // 4. Ambil 5 Tugas MasterTemplate dari Database
    const masterTodos = await prisma.masterTodo.findMany({
      where: {
        bulan: pregnancyMonth,
        kategoriRisiko: riskCategory,
        hariKe: dayOfCycle
      },
      orderBy: {
        noTugas: 'asc'
      }
    });

    // 5. Cek Status Penyelesaian Harian
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const completedTodosToday = await prisma.userTodo.findMany({
      where: {
        userId,
        tanggal: {
          gte: startOfToday,
          lt: endOfToday
        },
        isCompleted: true
      }
    });

    const completedMasterIds = new Set(completedTodosToday.map(ut => ut.masterTodoId));

    const tasks = masterTodos.map(todo => {
      const isCompleted = completedMasterIds.has(todo.id);
      const userTodoLog = completedTodosToday.find(ut => ut.masterTodoId === todo.id);
      return {
        id: userTodoLog?.id || null,
        masterTodoId: todo.id,
        noTugas: todo.noTugas,
        tugasHarian: todo.tugasHarian,
        kategoriAktivitas: todo.kategoriAktivitas,
        isCompleted,
        completedAt: userTodoLog?.completedAt || null
      };
    });

    // Hitung Progress
    const completedCount = tasks.filter(t => t.isCompleted).length;
    const totalCount = tasks.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Catat keaktifan user & auto-resume pengingat jika user membuka to-do list
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date(),
        reminderAutoPaused: false
      }
    });

    res.status(200).json({
      success: true,
      data: {
        gestationalAge: {
          weeks: currentWeek,
          days: currentDay,
          pregnancyMonth,
          dayOfCycle,
          trimester: masterTodos[0]?.trimester || (currentWeek <= 12 ? 'Trimester 1' : currentWeek <= 27 ? 'Trimester 2' : 'Trimester 3')
        },
        riskCategory,
        progress: {
          totalTasks: totalCount,
          completedTasks: completedCount,
          percentage
        },
        tasks
      }
    });

  } catch (error: any) {
    console.error('Error Get Daily Tasks:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses data harian.', error: error.message });
  }
};

export const completeTodo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { masterTodoId, isCompleted } = req.body;

    if (!masterTodoId) {
      return res.status(400).json({ message: 'masterTodoId harus disertakan' });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let targetCompleted: boolean;
    if (typeof isCompleted === 'boolean') {
      targetCompleted = isCompleted;
    } else {
      const existing = await prisma.userTodo.findFirst({
        where: {
          userId,
          masterTodoId,
          tanggal: startOfToday
        }
      });
      targetCompleted = existing ? !existing.isCompleted : true;
    }

    const userTodo = await prisma.userTodo.upsert({
      where: {
        userId_masterTodoId_tanggal: {
          userId,
          masterTodoId,
          tanggal: startOfToday
        }
      },
      update: {
        isCompleted: targetCompleted,
        completedAt: targetCompleted ? new Date() : null
      },
      create: {
        userId,
        masterTodoId,
        tanggal: startOfToday,
        isCompleted: targetCompleted,
        completedAt: targetCompleted ? new Date() : null
      }
    });

    // Catat keaktifan user & auto-resume pengingat saat berinteraksi dengan tugas
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date(),
        reminderAutoPaused: false
      }
    });

    res.status(200).json({
      success: true,
      message: targetCompleted ? 'Tugas berhasil ditandai selesai' : 'Tugas dibatalkan dari status selesai',
      data: userTodo
    });
  } catch (error: any) {
    console.error('Error Complete/Toggle Task:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate status tugas.', error: error.message });
  }
};

export const createKeluhanLog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { daftarKeluhan, tingkatKeparahan, catatanBebas, isRedFlag } = req.body;

    if (!Array.isArray(daftarKeluhan)) {
      return res.status(400).json({ message: 'daftarKeluhan harus berupa array string' });
    }

    if (!['RINGAN', 'SEDANG', 'BERAT'].includes(tingkatKeparahan)) {
      return res.status(400).json({ message: 'tingkatKeparahan tidak valid' });
    }

    const log = await prisma.keluhanLog.create({
      data: {
        userId,
        daftarKeluhan,
        tingkatKeparahan: tingkatKeparahan as any,
        catatanBebas,
        isRedFlag: !!isRedFlag,
        tanggal: new Date()
      }
    });

    res.status(201).json({ success: true, message: 'Keluhan harian berhasil dicatat', data: log });
  } catch (error: any) {
    console.error('Error Create Keluhan Log:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mencatat keluhan.', error: error.message });
  }
};

export const evaluateSymptoms = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { completedTasks, uncompletedTasks, symptoms } = req.body;

    if (!Array.isArray(symptoms)) {
      return res.status(400).json({ message: 'symptoms harus berupa array' });
    }

    // 1. Ambil Profil Ibu Hamil untuk konteks usia kehamilan
    const profile = await prisma.profilIbuHamil.findUnique({
      where: { userId }
    });

    const usiaMinggu = profile?.usiaKehamilanMinggu ?? 0;
    const usiaHari = profile?.usiaKehamilanHari ?? 0;
    const namaIbu = profile?.namaIbu ? `Bunda ${profile.namaIbu}` : 'Bunda';

    // 2. Sistem Skoring Gejala: Tidak Ada/Baik = 0, Ringan = 1, Berat = 2
    let totalScore = 0;
    const scoredSymptoms = symptoms.map((s: any) => {
      const severityStr = s.severity || 'Tidak Ada';
      let score = 0;
      if (severityStr.includes('Berat')) {
        score = 2;
      } else if (severityStr.includes('Ringan')) {
        score = 1;
      } else {
        score = 0;
      }
      totalScore += score;
      return {
        name: s.name,
        severity: severityStr,
        score
      };
    });

    const maxScore = 10;
    const hasSevere = scoredSymptoms.some(s => s.score === 2);
    // Aturan Bahaya: Jika skor >= 4 ATAU ada keluhan berstatus Berat (skor 2), maka Wajib Lapor Dokter (Red Flag)
    const isRedFlag = totalScore >= 4 || hasSevere;
    const tingkatKeparahan: 'RINGAN' | 'SEDANG' | 'BERAT' = isRedFlag ? 'BERAT' : totalScore >= 2 ? 'SEDANG' : 'RINGAN';

    const activeSymptomsList = scoredSymptoms.map(s => `${s.name}: ${s.severity}`);

    const completedTasksArr = Array.isArray(completedTasks) ? completedTasks : [];
    const uncompletedTasksArr = Array.isArray(uncompletedTasks) ? uncompletedTasks : [];

    const completedTasksStr = completedTasksArr.length > 0
      ? completedTasksArr.map((t: string) => `- ${t}`).join('\n')
      : 'Belum ada tugas yang diselesaikan hari ini.';

    const uncompletedTasksStr = uncompletedTasksArr.length > 0
      ? uncompletedTasksArr.map((t: string) => `- ${t}`).join('\n')
      : 'Semua tugas harian berhasil diselesaikan.';

    const activeSymptomsStr = scoredSymptoms
      .filter((s) => s.score > 0)
      .map((s) => `- ${s.name}: ${s.severity}`)
      .join('\n') || 'Tidak ada keluhan fisik (Kondisi Baik/Normal).';

    // 3. Prompt AI untuk Menggabungkan Hasil To-Do List dan Skrining Keluhan Fisik
    const prompt = `Anda adalah asisten medis kehamilan cerdas dan empatik di aplikasi BumilFit.
Tugas Anda: Buat SATU KESIMPULAN DAN EVALUASI TERPADU yang MENGGABUNGKAN hasil pencapaian To-Do List Bunda hari ini dengan keluhan fisik harian yang dialami.

Profil Pasien:
- Panggilan: ${namaIbu}
- Usia Kehamilan: ${usiaMinggu > 0 ? `${usiaMinggu} minggu ${usiaHari} hari` : 'Sedang berjalan'}
- Status Medis Internal: ${isRedFlag ? 'PERINGATAN BAHAYA (Wajib Lapor Dokter)' : 'KONDISI STABIL / AMAN'}

Hasil Tugas Harian (To-Do List):
- Tugas yang Diselesaikan:
${completedTasksStr}
- Tugas yang Belum Diselesaikan:
${uncompletedTasksStr}

Hasil Skrining Keluhan Fisik:
${activeSymptomsStr}

Aturan Penulisan Respon (PENTING):
1. GABUNGKAN kedua data (tugas harian & keluhan fisik) menjadi satu kesimpulan analisis terpadu yang saling berhubungan.
   - Contoh: Hubungkan tugas nutrisi/hidrasi/aktivitas yang sudah dikerjakan atau yang belum dengan sensasi fisik yang dialami (misal: pusing, mual, pegal, atau kram).
   - Jika tugas belum lengkap karena ada keluhan, berikan pemakluman yang menenangkan bahwa istirahat adalah prioritas utama hari ini.
   - Jika semua tugas selesai dan tidak ada keluhan, simpulkan bahwa kedisiplinan Bunda menjaga rutinitas harian berdampak sangat positif pada kondisi fisik yang prima.
2. JANGAN PERNAH MENYEBUTKAN ANGKA SKOR, NILAI POIN, ATAU KATA "SKOR" / "POIN" dalam teks respon Anda! Sistem skoring hanya berjalan secara rahasia di backend sistem. Tuliskan kesimpulan secara alami, hangat, dan mengalir selayaknya percakapan bidan/dokter spesialis dengan pasien.
3. Panjang respon: MAKSIMAL 3-4 kalimat (sekitar 50-80 kata). Selalu sapa dengan panggilan "Bunda".
4. Tanda Bahaya & Status Medis:
   - Jika Status Medis: PERINGATAN BAHAYA (${isRedFlag ? 'YA' : 'TIDAK'}): Sampaikan dengan tenang bahwa keluhan fisik yang dialami membutuhkan evaluasi medis, dan sarankan Bunda segera berkonsultasi dengan dokter spesialis melalui tombol "Hubungi Dokter".
   - Jika Kondisi Stabil: Berikan dorongan semangat positif untuk mempertahankan pola hidup sehat.
5. JANGAN memberikan resep obat keras atau diagnosis penyakit yang menakut-nakuti.`;

    // 4. Logika Fallback Cerdas (Penggabungan To-Do + Gejala Lokal) jika Gemini Offline
    const generateFallbackAdvice = () => {
      const taskDoneCount = completedTasksArr.length;
      const totalTaskCount = taskDoneCount + uncompletedTasksArr.length;
      const firstCompleted = completedTasksArr[0]?.replace(/\.$/, '') || '';
      const severeSymptoms = scoredSymptoms.filter(s => s.score === 2);
      const mildSymptoms = scoredSymptoms.filter(s => s.score === 1);

      let opening = '';
      if (taskDoneCount === totalTaskCount && totalTaskCount > 0) {
        opening = `Hebat sekali, Bunda telah menuntaskan seluruh ${totalTaskCount} agenda harian kehamilan hari ini.`;
      } else if (taskDoneCount > 0) {
        opening = `Apresiasi untuk Bunda yang sudah menyelesaikan tugas "${firstCompleted}".`;
      } else {
        opening = 'Terima kasih telah mencatat perkembangan harian Bunda bersama BumilFit.';
      }

      let medicalBody = '';
      if (isRedFlag) {
        const criticalNames = severeSymptoms.map(s => s.name.split(' (')[0]).join(' dan ') || 'kondisi fisik';
        medicalBody = ` Namun, Bunda saat ini mengalami keluhan ${criticalNames} yang cukup berat dan membutuhkan perhatian medis. Kami sangat menyarankan Bunda segera beristirahat total dan berkonsultasi dengan dokter spesialis kandungan melalui tombol yang tersedia.`;
      } else if (mildSymptoms.length > 0) {
        const mildNames = mildSymptoms.map(s => s.name.split(' (')[0]).join(', ');
        medicalBody = ` Kondisi fisik Bunda secara umum terpantau stabil dengan adanya keluhan ringan (${mildNames}). Penuhi hidrasi air hangat, lakukan peregangan santai, dan jangan memaksakan sisa agenda harian jika tubuh merasa lelah.`;
      } else {
        medicalBody = ` Kondisi fisik Bunda hari ini terpantau sangat prima tanpa keluhan berarti. Tetap pertahankan pola makan bergizi seimbang, cukup tidur, dan nikmati masa kehamilan dengan bahagia ya, Bun!`;
      }

      return `${opening}${medicalBody}`;
    };

    let advice = generateFallbackAdvice();

    // 5. Pemanggilan Gemini API dengan Model Flash Cepat
    const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest'];
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.7 }
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timeout')), 4000)
        );
        const result: any = await Promise.race([model.generateContent(prompt), timeoutPromise]);
        const text = result.response.text().trim();
        if (text) {
          advice = text;
          break;
        }
      } catch (err: any) {
        console.warn(`Panggilan model ${modelName} untuk to-do evaluate gagal:`, err.message || err);
      }
    }

    const log = await prisma.keluhanLog.create({
      data: {
        userId,
        daftarKeluhan: activeSymptomsList,
        tingkatKeparahan: tingkatKeparahan as any,
        isRedFlag,
        catatanBebas: advice
      }
    });

    res.status(200).json({
      success: true,
      data: {
        advice,
        isRedFlag,
        totalScore,
        maxScore,
        tingkatKeparahan,
        logId: log.id
      }
    });
  } catch (error: any) {
    console.error('Error Evaluate Symptoms:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengevaluasi kondisi.', error: error.message });
  }
};

export const triggerRemindersManual = async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) === 'evening' ? 'evening' : 'morning';
    const result = await sendDailyReminders(type);
    res.status(200).json({
      success: true,
      message: `Pengingat to-do (${type.toUpperCase()}) berhasil dijalankan`,
      data: result
    });
  } catch (error: any) {
    console.error('Error Trigger Reminders Manual:', error);
    res.status(500).json({ message: 'Gagal memicu pengingat', error: error.message });
  }
};
