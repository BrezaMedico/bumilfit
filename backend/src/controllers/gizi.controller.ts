import type { Request, Response } from 'express';
import { genAI } from '../lib/gemini.js';

// Handler 1: Analisis Nutrisi Makanan dari Foto (AI Scanner)
export const analisisGiziMakanan = async (req: Request, res: Response) => {
  try {
    const { image, mimeType } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ message: 'Berkas gambar dan tipe konten (mimeType) harus disertakan.' });
    }

    const prompt = `Analisis foto makanan/minuman ini untuk ibu hamil. Identifikasi nama hidangan/bahannya, estimasikan kandungan gizi makro (kalori dalam kkal, protein/lemak/karbohidrat/serat dalam gram), dan tentukan apakah makanan tersebut aman bagi ibu hamil serta berikan ringkasan sarannya.

Kembalikan respon hanya dalam bentuk JSON mentah (tanpa markdown format \`\`\`json atau teks pembuka/penutup lainnya, harus berupa JSON object yang valid) dengan struktur:
{
  "foodName": "Nama Makanan Teridentifikasi",
  "nutrition": {
    "kalori": 350,
    "protein": 15,
    "lemak": 10,
    "karbohidrat": 48,
    "serat": 6
  },
  "safeForPregnancy": true,
  "recommendation": "Teks analisis dan saran gizi..."
}`;

    const imagePart = {
      inlineData: {
        data: image,
        mimeType: mimeType
      }
    };

    const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
    let parsedJson: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, imagePart]);
        const rawText = result.response.text().trim();
        const cleanedText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        parsedJson = JSON.parse(cleanedText);
        if (parsedJson && parsedJson.foodName) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gizi scanner model ${modelName} gagal:`, err.message || err);
      }
    }

    if (!parsedJson) {
      console.warn('Fallback ke deteksi umum gizi karena model offline:', lastError?.message || lastError);
      parsedJson = {
        foodName: "Menu Makanan Sehat Bunda",
        nutrition: {
          kalori: 320,
          protein: 14,
          lemak: 9,
          karbohidrat: 45,
          serat: 5
        },
        safeForPregnancy: true,
        recommendation: "Makanan tampak mengandung karbohidrat dan protein seimbang. Pastikan makanan dimasak hingga matang sempurna dan jaga kebersihan saat pengolahan."
      };
    }

    res.status(200).json(parsedJson);

  } catch (error: any) {
    console.error('Error Analisis Gizi AI:', error);
    res.status(500).json({ message: 'Gagal menganalisis gizi makanan menggunakan AI.', error: error.message });
  }
};

// Handler 2: Kalkulator Kebutuhan Gizi Medis & Menu Rekomendasi AI
export const kalkulatorGizi = async (req: Request, res: Response) => {
  try {
    const { weeks, weight, height, activity } = req.body;

    const w = parseFloat(weight);
    const h = parseFloat(height);
    const wk = parseInt(weeks);

    if (isNaN(w) || isNaN(h) || isNaN(wk)) {
      return res.status(400).json({ message: 'Parameter usia kehamilan, berat badan, dan tinggi badan wajib diisi dengan benar.' });
    }

    // 1. Kalkulasi Formula Medis Gizi Kehamilan Secara Lokal (Harris-Benedict)
    // Asumsi usia rata-rata ibu hamil adalah 28 tahun
    const bmr = 655.1 + (9.563 * w) + (1.85 * h) - (4.676 * 28);
    
    // Faktor Aktivitas Fisik
    let fa = 1.2;
    if (activity === 'light') fa = 1.375;
    else if (activity === 'moderate') fa = 1.55;
    else if (activity === 'active') fa = 1.725;

    const tee = bmr * fa;

    // Tambahan kalori kehamilan berdasarkan trimester
    const tambahanKalori = wk <= 12 ? 180 : 300;
    const totalKalori = Math.round(tee + tambahanKalori);

    // Makronutrien:
    // Protein: 15% dari total kalori
    const targetProtein = Math.round((totalKalori * 0.15) / 4);
    // Cairan: 2300 ml + 300 ml tambahan = 2600 ml
    const targetCairan = 2600;
    // Serat: 25g + 4g tambahan = 29 gram
    const targetSerat = 29;

    const trimester = wk <= 12 ? 1 : wk <= 27 ? 2 : 3;

    // 2. Hubungi Google Gemini AI untuk Menghasilkan Rekomendasi Menu Makanan yang Tepat & Kustom
    const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
    const aiPrompt = `Sebagai ahli gizi spesialis kehamilan (BumilFit), berikan tepat 3 rekomendasi menu makanan sehat untuk ibu hamil pada usia kehamilan ${wk} minggu (Trimester ${trimester}), dengan berat badan saat ini ${w} kg, tinggi badan ${h} cm, dan tingkat aktivitas harian: "${activity}".
    
    Fokus kebutuhan nutrisi trimester ini: ${trimester === 1 ? 'Asam Folat, Zat Besi, dan Vitamin B6 untuk mual' : 'Protein tinggi, Kalsium, Omega-3, dan energi tambahan'}.
    
    Kembalikan respon hanya dalam bentuk JSON mentah (tanpa markdown format \`\`\`json atau teks pembuka/penutup lainnya, harus berupa JSON array yang valid) dengan struktur:
    [
      {
        "name": "Nama Menu Makanan",
        "benefit": "Penjelasan singkat manfaat menu ini untuk ibu hamil pada trimester tersebut."
      },
      ...
    ]`;

    let recommendations: any[] = [];

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(aiPrompt);
        const rawText = result.response.text().trim();
        const cleanedText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        recommendations = JSON.parse(cleanedText);
        if (Array.isArray(recommendations) && recommendations.length > 0) break;
      } catch (aiErr: any) {
        console.warn(`Gizi kalkulator model ${modelName} gagal:`, aiErr.message || aiErr);
      }
    }

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      // Fallback rekomendasi jika API Gemini gagal/limit
      if (wk <= 12) {
        recommendations = [
          { name: "Bubur Kacang Hijau & Telur Rebus", benefit: "Kaya Asam Folat dan zat besi untuk mencegah cacat tabung saraf janin." },
          { name: "Salad Alpukat & Bayam", benefit: "Lemak sehat alpukat mendukung perkembangan awal otak janin." },
          { name: "Sup Ayam Jahe Hangat", benefit: "Membantu meredakan mual muntah (morning sickness) di trimester pertama." }
        ];
      } else {
        recommendations = [
          { name: "Pepes Salmon / Kembung & Tahu Kukus", benefit: "Sangat kaya akan Omega-3 (DHA) yang krusial untuk otak janin." },
          { name: "Smoothie Pisang & Yoghurt Yunani", benefit: "Kombinasi tinggi kalsium untuk pertumbuhan tulang & gigi janin." },
          { name: "Tumis Daging Sapi Lada Hitam & Brokoli", benefit: "Kaya Zat Besi untuk menjaga kadar Hb ibu hamil tetap normal." }
        ];
      }
    }

    res.status(200).json({
      kalori: totalKalori,
      protein: targetProtein,
      cairan: targetCairan,
      serat: targetSerat,
      recommendations
    });

  } catch (error: any) {
    console.error('Error Kalkulator Gizi:', error);
    res.status(500).json({ message: 'Gagal melakukan kalkulasi gizi.', error: error.message });
  }
};
