import type { Request, Response } from 'express';
import { genAI } from '../lib/gemini.js';

const CHATBOT_SYSTEM_PROMPT = `Anda adalah asisten edukasi kehamilan BumilFit. Bersikaplah ramah, berempati, dan menenangkan.
Aturan ketat:
1. Selalu gunakan Bahasa Indonesia yang baik dan mudah dipahami.
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

    const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash',
        systemInstruction: systemInstruction
    });

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.status(200).json({ text: responseText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal terhubung ke layanan AI BumilFit' });
  }
};
