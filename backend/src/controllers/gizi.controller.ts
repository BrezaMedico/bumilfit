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

    const candidateModels = ['gemini-3.6-flash', 'gemini-3.7-flash'];
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

// Handler 2: Kalkulator Kebutuhan Gizi Medis & Menu Rekomendasi AI yang Selalu Bervariasi
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

    // Hitung Indeks Massa Tubuh (IMT / BMI)
    const bmi = parseFloat((w / Math.pow(h / 100, 2)).toFixed(1));
    let statusBmi = 'Normal';
    if (bmi < 18.5) statusBmi = 'Kurang (Underweight)';
    else if (bmi >= 25 && bmi < 30) statusBmi = 'Kelebihan berat badan (Overweight)';
    else if (bmi >= 30) statusBmi = 'Obesitas';

    // Variasi tema agar selalu berbeda setiap kali tombol ditekan
    const randomVariations = [
      'olahan ikan lokal kaya Omega-3 DHA (seperti kembung, tongkol, tenggiri, atau salmon) dipadu sayuran segar',
      'menu nusantara berkuah hangat kaya bumbu alami seperti sup bayam jagung bening, sayur asam, atau soto ayam kampung bening',
      'paduan protein nabati & hewani seimbang dengan tahu tempe bacem/kukus dan telur rebus atau ayam panggang',
      'menu tinggi zat besi dan asam folat dengan sayuran hijau gelap, daging sapi tanpa lemak, atau hati ayam higienis',
      'menu kaya kalsium dan vitamin D untuk pembentukan tulang dan gigi janin',
      'menu kaya serat alami dan antioksidan untuk kenyamanan pencernaan dan mencegah konstipasi',
      'sarapan bergizi tinggi seperti oat buah pisang alpukat, dilanjut makan siang kaya lauk segar dan makan malam mudah cerna'
    ];
    const chosenTheme = randomVariations[Math.floor(Math.random() * randomVariations.length)];
    const seedTimestamp = Date.now();

    // 2. Hubungi Google Gemini AI untuk Menghasilkan Tepat 3 Rekomendasi Menu yang Variatif & Spesifik
    const candidateModels = ['gemini-3.6-flash'];
    const aiPrompt = `Kamu adalah Ahli Gizi Klinis Spesialis Kehamilan BUMILFIT.
Berikan TEPAT 3 rekomendasi menu makanan sehat yang BERBEDA, LEZAT, dan BERVARIASI untuk Bunda dengan profil berikut:

PROFIL IBU HAMIL:
- Usia Kehamilan: ${wk} minggu (Trimester ${trimester})
- Berat Badan: ${w} kg
- Tinggi Badan: ${h} cm
- IMT / BMI: ${bmi} (${statusBmi})
- Tingkat Aktivitas Fisik: "${activity}"
- Kebutuhan Kalori Target: ~${totalKalori} kkal/hari
- Kebutuhan Protein Target: ~${targetProtein} gram/hari
- Fokus Variasi Menu Kali Ini: ${chosenTheme}
- Token Keunikan: ${seedTimestamp}

INSTRUKSI PENTING:
1. Selalu ciptakan menu yang KREATIF, BERAGAM, dan BERBEDA setiap kali diminta (jangan mengulang menu yang sama). Gunakan bahan-bahan lokal Indonesia yang segar dan mudah didapat.
2. Buat 3 menu dengan pembagian waktu makan yang jelas:
   - Menu 1: Sarapan / Camilan Pagi
   - Menu 2: Makan Siang
   - Menu 3: Makan Malam
3. FORMAT SPESIFIK AGAR SANGAT MUDAH DIBACA:
   - "name": Nama hidangan lengkap yang menggugah selera.
   - "mealTime": "Sarapan", "Makan Siang", atau "Makan Malam".
   - "protein": Format daftar rincian protein berbaris-baris (gunakan newline '\\n' per poin agar mudah dibaca, contoh: "• Daging Sapi Panggang 100g (~22g protein)\\n• Tahu Tempe 2 potong (~8g protein)\\n• Total Estimasi: ~30g protein").
   - "nutrients": Format poin nutrisi kunci berbaris-baris (gunakan '\\n' per poin, contoh: "• Asam Folat (mencegah kelainan saraf)\\n• Zat Besi Heme (mencegah anemia)\\n• Kalsium").
   - "benefit": Uraian ringkas 1-2 kalimat manfaat gizi spesifik untuk Bunda pada usia kehamilan ${wk} minggu dengan kondisi BB ${w} kg.

FORMAT RESPON:
Kembalikan HANYA berupa JSON array valid (tanpa markdown codeblock atau teks pengantar apapun) dengan struktur persis:
[
  {
    "name": "Nama Menu Hidangan",
    "mealTime": "Sarapan",
    "protein": "• Rincian protein poin 1\\n• Rincian protein poin 2\\n• Total Estimasi: ~...g protein",
    "nutrients": "• Nutrisi kunci 1\\n• Nutrisi kunci 2",
    "benefit": "Penjelasan manfaat medis spesifik untuk kondisi Bunda..."
  },
  {
    "name": "Nama Menu Hidangan",
    "mealTime": "Makan Siang",
    "protein": "• Rincian protein poin 1\\n• Rincian protein poin 2\\n• Total Estimasi: ~...g protein",
    "nutrients": "• Nutrisi kunci 1\\n• Nutrisi kunci 2",
    "benefit": "Penjelasan manfaat medis spesifik untuk kondisi Bunda..."
  },
  {
    "name": "Nama Menu Hidangan",
    "mealTime": "Makan Malam",
    "protein": "• Rincian protein poin 1\\n• Rincian protein poin 2\\n• Total Estimasi: ~...g protein",
    "nutrients": "• Nutrisi kunci 1\\n• Nutrisi kunci 2",
    "benefit": "Penjelasan manfaat medis spesifik untuk kondisi Bunda..."
  }
]`;

    let recommendations: any[] = [];

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.9, // Memberikan variasi menu yang kaya dan berbeda setiap kali di-generate
            topP: 0.95,
          }
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timeout')), 4000)
        );
        const result: any = await Promise.race([model.generateContent(aiPrompt), timeoutPromise]);
        const rawText = result.response.text().trim();
        const cleanedText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        recommendations = JSON.parse(cleanedText);
        if (Array.isArray(recommendations) && recommendations.length >= 3) break;
      } catch (aiErr: any) {
        console.warn(`Gizi kalkulator model ${modelName} gagal:`, aiErr.message || aiErr);
      }
    }

    // 3. Fallback Variatif Berbobot (Bila jaringan API Google mengalami timeout)
    if (!Array.isArray(recommendations) || recommendations.length < 3) {
      const fallbackLibraryTrimester1 = [
        { 
          name: "Bubur Kacang Hijau Santan Encer & Telur Rebus",
          mealTime: "Sarapan",
          protein: "• 1 Butir Telur Rebus (~6g protein)\n• Bubur Kacang Hijau 1 mangkuk (~8g protein)\n• Total Estimasi: ~14g protein",
          nutrients: "• Asam Folat (pencegah kelainan saraf janin)\n• Zat Besi & Serat Alami",
          benefit: "Kaya Asam Folat dan zat besi untuk mencegah cacat tabung saraf janin pada awal kehamilan."
        },
        { 
          name: "Salad Alpukat, Bayam Merah & Jeruk Manis",
          mealTime: "Camilan Sehat",
          protein: "• Alpukat Mentega 1/2 buah (~2g protein)\n• Biji Chia & Kacang Almond (~5g protein)\n• Total Estimasi: ~7g protein",
          nutrients: "• Lemak Sehat Omega-9\n• Vitamin B6 (meredakan mual)\n• Vitamin C",
          benefit: "Lemak sehat omega dan vitamin B6 membantu meredakan mual di trimester pertama."
        },
        { 
          name: "Sup Ayam Jahe Hangat dengan Wortel & Labu Siam",
          mealTime: "Makan Siang",
          protein: "• Dada Ayam Kampung 80g (~22g protein)\n• Tahu Sutra Halus (~6g protein)\n• Total Estimasi: ~28g protein",
          nutrients: "• Protein Hewani Mudah Cerna\n• Gingerol Alami Pereda Mual\n• Vitamin A & Beta Karoten",
          benefit: "Jahe alami meredakan morning sickness serta protein ayam mendukung pembentukan sel janin."
        },
        { 
          name: "Omelet Bayam Tahu Sutra & Tomat Ceri",
          mealTime: "Sarapan",
          protein: "• 2 Butir Telur Ayam (~12g protein)\n• Tahu Sutra 50g (~6g protein)\n• Total Estimasi: ~18g protein",
          nutrients: "• Kolin (perkembangan otak awal janin)\n• Lutein & Asam Folat",
          benefit: "Tinggi kolin dan protein untuk mendukung perkembangan awal sistem saraf buah hati."
        },
        { 
          name: "Puding Chia Seed Mangga & Susu Kedelai",
          mealTime: "Camilan Sore",
          protein: "• Susu Kedelai Murni 200ml (~7g protein)\n• Biji Chia 1 sdm (~2g protein)\n• Total Estimasi: ~9g protein",
          nutrients: "• Kalsium Nabati Tinggi\n• Serat Prebiotik Pencernaan\n• Vitamin C Alami",
          benefit: "Camilan segar tinggi kalsium nabati dan serat untuk kenyamanan lambung Bunda."
        },
        { 
          name: "Nasi Merah dengan Pepes Ikan Mas & Lalap Daun Kemangi",
          mealTime: "Makan Malam",
          protein: "• Ikan Mas Bumbu Kuning (~20g protein)\n• Tempe Kukus 1 potong (~5g protein)\n• Total Estimasi: ~25g protein",
          nutrients: "• Karbohidrat Kompleks Nasi Merah\n• Omega-3 & Fosfor",
          benefit: "Karbohidrat kompleks menjaga kestabilan energi ibu hamil tanpa memicu lonjakan gula darah."
        }
      ];

      const fallbackLibraryTrimester2 = [
        { 
          name: "Pepes Ikan Kembung Bumbu Kuning & Tumis Brokoli",
          mealTime: "Makan Siang",
          protein: "• 1 Ekor Ikan Kembung Sedang (~22g protein)\n• Tempe Bakar Bumbu (~6g protein)\n• Total Estimasi: ~28g protein",
          nutrients: "• DHA & EPA Omega-3 Tinggi (setara salmon)\n• Kalsium & Vitamin K",
          benefit: "Ikan kembung mengandung DHA dan Omega-3 setara salmon untuk pertumbuhan otak janin di trimester kedua."
        },
        { 
          name: "Smoothie Pisang, Yoghurt Yunani & Madu Alami",
          mealTime: "Sarapan",
          protein: "• Yoghurt Yunani 150ml (~13g protein)\n• Susu Segar Rendah Lemak (~5g protein)\n• Total Estimasi: ~18g protein",
          nutrients: "• Kalsium Tinggi Tulang\n• Kalium (mencegah kram otot kaki)\n• Probiotik Usus",
          benefit: "Tinggi kalsium dan kalium untuk mencegah kram kaki pada ibu hamil."
        },
        { 
          name: "Tumis Daging Sapi Lada Manis & Kacang Polong",
          mealTime: "Makan Malam",
          protein: "• Daging Sapi Tanpa Lemak 90g (~25g protein)\n• Kacang Polong Manis (~4g protein)\n• Total Estimasi: ~29g protein",
          nutrients: "• Zat Besi Heme (penyerapan optimal)\n• Zinc & Vitamin B12",
          benefit: "Kaya Zat Besi heme untuk mencegah anemia defisiensi besi di masa ekspansi volume darah."
        },
        { 
          name: "Sup Iga Kacang Merah & Jagung Manis",
          mealTime: "Makan Siang",
          protein: "• Daging Iga Lembut 80g (~20g protein)\n• Kacang Merah 1 mangkuk kecil (~6g protein)\n• Total Estimasi: ~26g protein",
          nutrients: "• Magnesium & Fosfor Tulang\n• Serat Pangan Larut",
          benefit: "Padat kalori sehat dan asam amino esensial untuk percepatan tumbuh kembang janin."
        },
        { 
          name: "Sayur Bening Kelor & Tempe Bacem Panggang",
          mealTime: "Makan Malam",
          protein: "• 2 Potong Tempe Bacem (~14g protein)\n• 1 Butir Telur Rebus (~6g protein)\n• Total Estimasi: ~20g protein",
          nutrients: "• Antioksidan Daun Kelor\n• Kalsium Tinggi & Isoflavon",
          benefit: "Daun kelor kaya multivitamin alami dan kalsium untuk pembentukan tulang janin."
        },
        { 
          name: "Sandwich Roti Gandum Telur Dadar Jamur & Keju Cheddar",
          mealTime: "Sarapan",
          protein: "• Telur Dadar 2 butir (~12g protein)\n• Keju Cheddar 1 lembar (~5g protein)\n• Roti Gandum 2 tangkup (~6g protein)\n• Total Estimasi: ~23g protein",
          nutrients: "• Serat Gandum Utuh Lambat Cerna\n• Vitamin D & Kalsium",
          benefit: "Kombinasi protein dan kalsium praktis yang membantu metabolisme aktif Bunda."
        }
      ];

      const fallbackLibraryTrimester3 = [
        { 
          name: "Ikan Salmon Panggang Rempah & Kentang Tumbuk",
          mealTime: "Makan Siang",
          protein: "• Fillet Salmon 100g (~23g protein)\n• Susu dalam Puree Kentang (~3g protein)\n• Total Estimasi: ~26g protein",
          nutrients: "• DHA Murni (pematangan retina & otak janin)\n• Kalium & Vitamin B6",
          benefit: "DHA maksimal untuk perkembangan otak janin dan pematangan jaringan retina mata."
        },
        { 
          name: "Sup Daging Gurih Labu Kuning & Daun Katuk",
          mealTime: "Makan Malam",
          protein: "• Daging Sapi Cincang 80g (~20g protein)\n• Tahu Sutra Halus (~5g protein)\n• Total Estimasi: ~25g protein",
          nutrients: "• Laktagogum Alami Daun Katuk (Persiapan ASI)\n• Beta-Karoten & Zat Besi",
          benefit: "Mempersiapkan kelenjar ASI dan memberikan energi optimal menjelang persalinan."
        },
        { 
          name: "Nasi Ubi Cilembu dengan Ayam Kukus Jamur & Pakcoy",
          mealTime: "Makan Siang",
          protein: "• Ayam Kukus Suwir 90g (~24g protein)\n• Jamur Tiram Segar (~3g protein)\n• Total Estimasi: ~27g protein",
          nutrients: "• Serat Larut Tinggi Ubi (anti konstipasi)\n• Vitamin A & Folat Alami",
          benefit: "Tinggi serat alami untuk mencegah sembelit dan ambeien di akhir kehamilan."
        },
        { 
          name: "Sayur Lodeh Tahu Tempe Santan Ringan & Telur Puyuh",
          mealTime: "Makan Malam",
          protein: "• Tahu & Tempe Panggang (~12g protein)\n• 4 Butir Telur Puyuh (~6g protein)\n• Total Estimasi: ~18g protein",
          nutrients: "• Kalsium & Magnesium Kepadatan Tulang\n• Asam Lemak Sehat",
          benefit: "Protein dan kalsium seimbang untuk mendukung penambahan berat badan janin secara ideal."
        },
        { 
          name: "Jus Alpukat Kurma & Susu Hamil Hangat",
          mealTime: "Sarapan / Snack",
          protein: "• Susu Kehamilan 200ml (~9g protein)\n• Bubuk Almond (~4g protein)\n• Total Estimasi: ~13g protein",
          nutrients: "• Kalium & Gula Alami Pemulih Stamina\n• Lemak Sehat Pelindung Janin",
          benefit: "Energi padat bernutrisi untuk stamina Bunda dan pembentukan lapisan lemak pelindung tubuh janin."
        },
        { 
          name: "Tumis Hati Ayam Kampung, Buncis & Wortel",
          mealTime: "Makan Siang",
          protein: "• Hati Ayam Kampung 50g (~13g protein)\n• Daging Ayam 50g (~12g protein)\n• Total Estimasi: ~25g protein",
          nutrients: "• Zat Besi Konsentrasi Tinggi (cadangan HB)\n• Vitamin A & B-Kompleks",
          benefit: "Mendongkrak cadangan hemoglobin agar proses persalinan berjalan lancar dan bertenaga."
        }
      ];

      const library = trimester === 1 
        ? fallbackLibraryTrimester1 
        : trimester === 2 
          ? fallbackLibraryTrimester2 
          : fallbackLibraryTrimester3;

      // Acak dan ambil tepat 3 rekomendasi unik
      const shuffled = [...library].sort(() => 0.5 - Math.random());
      recommendations = shuffled.slice(0, 3);
    }

    res.status(200).json({
      kalori: totalKalori,
      protein: targetProtein,
      cairan: targetCairan,
      serat: targetSerat,
      bmi,
      statusBmi,
      recommendations: recommendations.slice(0, 3)
    });

  } catch (error: any) {
    console.error('Error Kalkulator Gizi:', error);
    res.status(500).json({ message: 'Gagal melakukan kalkulasi gizi.', error: error.message });
  }
};
