import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { genAI } from '../lib/gemini.js';

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
        }
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
    const { masterTodoId } = req.body;

    if (!masterTodoId) {
      return res.status(400).json({ message: 'masterTodoId harus disertakan' });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const userTodo = await prisma.userTodo.upsert({
      where: {
        userId_masterTodoId_tanggal: {
          userId,
          masterTodoId,
          tanggal: startOfToday
        }
      },
      update: {
        isCompleted: true,
        completedAt: new Date()
      },
      create: {
        userId,
        masterTodoId,
        tanggal: startOfToday,
        isCompleted: true,
        completedAt: new Date()
      }
    });

    res.status(200).json({ success: true, message: 'Tugas berhasil ditandai selesai', data: userTodo });
  } catch (error: any) {
    console.error('Error Complete Task:', error);
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
    const { completedTasks, symptoms } = req.body;

    if (!Array.isArray(symptoms)) {
      return res.status(400).json({ message: 'symptoms harus berupa array' });
    }

    let hasHeavy = false;
    let hasMedium = false;
    const activeSymptomsList: string[] = [];

    symptoms.forEach((s: any) => {
      const severityStr = s.severity || 'Tidak Ada';
      activeSymptomsList.push(`${s.name}: ${severityStr}`);
      if (severityStr.includes('Berat')) {
        hasHeavy = true;
      } else if (severityStr.includes('Ringan')) {
        hasMedium = true;
      }
    });

    const tingkatKeparahan = hasHeavy ? 'BERAT' : hasMedium ? 'SEDANG' : 'RINGAN';
    const isRedFlag = hasHeavy;

    const completedTasksStr = Array.isArray(completedTasks) && completedTasks.length > 0
      ? completedTasks.map((t: string) => `- ${t}`).join('\n')
      : 'Tidak ada tugas yang diselesaikan hari ini.';

    const activeSymptomsStr = symptoms
      .filter((s: any) => s.severity && !s.severity.includes('Tidak Ada'))
      .map((s: any) => `- ${s.name}: ${s.severity}`)
      .join('\n') || 'Tidak ada keluhan hari ini.';

    const prompt = `Anda adalah asisten AI medis untuk ibu hamil di aplikasi BumilFit.
Tugas Anda adalah merumuskan kesimpulan harian yang dinamis dan bervariasi berdasarkan data hari ini.

Tugas harian yang BERHASIL diselesaikan Bunda hari ini:
${completedTasksStr}

Keluhan fisik yang dirasakan Bunda hari ini:
${activeSymptomsStr}

Aturan Penulisan Respon (PENTING):
1. Gunakan Bahasa Indonesia yang hangat, berempati, menenangkan, dan profesional. Selalu sapa dengan panggilan "Bunda".
2. Panjang respon harus MAKSIMAL 2-3 kalimat saja (sekitar 40-60 kata). Jangan menghasilkan kalimat template yang kaku dan repetitif.
3. Struktur Jawaban:
   - Kalimat 1: Berikan apresiasi secara spesifik atas pencapaian tugas harian yang diselesaikan hari ini (sebutkan salah satu nama tugas secara kreatif).
   - Kalimat 2-3: Berikan saran kesehatan/hidrasi yang praktis dan relevan untuk mengatasi keluhan spesifik yang dialami (jika ada keluhan), atau berikan tips menjaga kebugaran jika tidak ada keluhan.
4. JANGAN memberikan resep obat atau diagnosis medis pasti.
5. Gunakan variasi kata dan diksi yang natural agar saran terasa dinamis dan personal.`;

    // Logika fallback dinamis jika API Gemini gagal terkoneksi (misal API key belum didaftarkan di Google AI Studio)
    const taskApresiasi = Array.isArray(completedTasks) && completedTasks.length > 0
      ? `Luar biasa Bunda sudah menyelesaikan tugas harian "${completedTasks[0].replace(/\.$/, '')}" dengan sangat baik.`
      : 'Terima kasih sudah mencatat agenda harian kehamilan hari ini, Bunda.';

    const activeSymptoms = symptoms.filter((s: any) => s.severity && !s.severity.includes('Tidak Ada'));
    let keluhanAdvice = 'Tetap pertahankan pola makan sehat, penuhi target air mineral harian, dan pastikan istirahat Bunda cukup.';
    
    if (activeSymptoms.length > 0) {
      const topSymptom = activeSymptoms[0];
      const cleanSymptomName = topSymptom.name.split(' (')[0];
      if (topSymptom.severity.includes('Berat')) {
        keluhanAdvice = `Karena keluhan ${cleanSymptomName} Bunda hari ini terasa sangat berat, mohon untuk segera istirahat total (bedrest) dan pertimbangkan untuk berkonsultasi ke dokter spesialis kandungan.`;
      } else {
        keluhanAdvice = `Terkait keluhan ${cleanSymptomName} yang terasa ringan, cobalah kurangi aktivitas fisik berlebih dan minumlah air putih hangat secara berkala.`;
      }
    }
    let advice = `${taskApresiasi} ${keluhanAdvice}`;

    try {
      // Menggunakan model gemini-3.5-flash dengan temperature 0.7 untuk variasi yang natural
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash',
        generationConfig: { temperature: 0.7 }
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) {
        advice = text;
      }
    } catch (aiError: any) {
      console.warn('Percobaan pertama Gemini gagal, mencoba fallback model gemini-3.6-flash...', aiError.message || aiError);
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const result = await fallbackModel.generateContent(prompt);
        const text = result.response.text().trim();
        if (text) {
          advice = text;
        }
      } catch (fallbackErr: any) {
        console.error('Gemini API call failed, falling back to dynamic local advice:', fallbackErr.message || fallbackErr);
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
        tingkatKeparahan,
        logId: log.id
      }
    });
  } catch (error: any) {
    console.error('Error Evaluate Symptoms:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengevaluasi kondisi.', error: error.message });
  }
};
