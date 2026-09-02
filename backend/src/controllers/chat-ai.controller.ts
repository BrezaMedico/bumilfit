import type { Request, Response } from 'express';
import { genAI } from '../lib/gemini.js';

const CHATBOT_SYSTEM_PROMPT = `Anda adalah asisten edukasi kehamilan BumilFit bernama Bubun AI. Bersikaplah ramah, berempati, dan menenangkan.
Aturan ketat:
1. Selalu gunakan Bahasa Indonesia yang baik, hangat, dan mudah dipahami. Sapa dengan panggilan "Bunda".
2. JANGAN PERNAH memberikan diagnosis medis pasti atau resep obat keras.
3. Jika pengguna menyebutkan keluhan berisiko (pendarahan, nyeri hebat, kontraksi dini, dll), wajib sarankan konsultasi dokter segera.`;

export const sendMessageAI = async (req: Request, res: Response) => {
  try {
    const { message, history, persona, doctorName } = req.body;
    
    let systemInstruction = CHATBOT_SYSTEM_PROMPT;
    
    if (persona === 'dokter') {
      systemInstruction = `Anda adalah dr. ${doctorName || 'Sarah'}, seorang dokter virtual di aplikasi BumilFit.
Anda memiliki persona sebagai dokter medis profesional yang sangat santai, luwes, ramah, berempati tinggi, dan komunikatif seperti teman dekat.
Aturan utama percakapan:
1. Gunakan Bahasa Indonesia yang sangat santai, informal, hangat, dan luwes layaknya percakapan chat WhatsApp manusia asli (bukan bahasa medis kaku, robotik, atau bahasa baku kamus). Selalu sapa ibu hamil dengan panggilan "Bunda". Gunakan kata-kata santai seperti "oh ya", "gitu", "nih", "ya", "sih", "kok", dll.
2. Jawablah dengan SINGKAT, PADAT, dan LANGSUNG ke intinya (maksimal 2-3 kalimat pendek per respon). Jangan memberikan penjelasan medis yang terlalu panjang lebar atau bertele-tele kecuali diminta.
3. JANGAN PERNAH memberikan diagnosis medis pasti atau meresepkan obat-obatan keras/khusus.
4. Jika keluhan pasien berisiko tinggi atau darurat (seperti pendarahan hebat, kontraksi dini, ketuban pecah), sampaikan secara santai namun tegas agar Bunda segera memeriksakan diri ke dokter atau IGD terdekat.
5. Pertahankan persona dokter yang ramah, santai, dan respons pendek ini di setiap jawaban.`;
    }

    const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemInstruction
        });

        const chat = model.startChat({
          history: history || [],
        });

        const result = await chat.sendMessage(message);
        responseText = result.response.text();
        if (responseText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Panggilan model ${modelName} gagal:`, err.message || err);
      }
    }

    if (!responseText) {
      console.error('Semua model Gemini gagal dihubungi:', lastError);
      // Fallback pesan ramah jika jaringan Google terputus sementara
      if (persona === 'dokter') {
        responseText = `Halo Bunda, dr. ${doctorName || 'Sarah'} menerima pesan Bunda. Untuk saat ini pastikan Bunda cukup minum air putih, hindari kelelahan fisik, dan jika ada keluhan yang semakin mengganggu jangan ragu untuk segera periksa ke fasilitas kesehatan terdekat ya.`;
      } else {
        responseText = 'Halo Bunda! Bubun AI menyarankan Bunda untuk selalu menjaga hidrasi, mengonsumsi makanan bernutrisi seimbang, serta beristirahat yang cukup. Ada hal lain yang ingin Bunda diskusikan?';
      }
    }

    res.status(200).json({ text: responseText });
  } catch (error: any) {
    console.error('Error in sendMessageAI:', error);
    res.status(500).json({ 
      message: 'Gagal terhubung ke layanan AI BumilFit', 
      error: error.message || error 
    });
  }
};
