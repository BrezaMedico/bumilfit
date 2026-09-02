export interface SkriningOption {
  level: number; // 1, 2, 3
  score: number; // 1, 2, 3 poin
  text: string;
}

export interface SkriningQuestion {
  id: string;
  parameter: string;
  questionText: string;
  options: SkriningOption[];
}

export const skriningQuestions: SkriningQuestion[] = [
  {
    id: "hipertensi",
    parameter: "Riwayat Tekanan Darah Tinggi (Hipertensi)",
    questionText: "Apakah Ibu pernah memiliki riwayat tekanan darah tinggi, baik sebelum maupun selama kehamilan ini?",
    options: [
      {
        level: 1,
        score: 1,
        text: "Tidak pernah didiagnosis tekanan darah tinggi, tensi selalu normal saat pemeriksaan."
      },
      {
        level: 2,
        score: 2,
        text: "Pernah mengalami tensi tinggi sesekali (misal saat stres/kelelahan), namun tidak rutin minum obat dan biasanya kembali normal."
      },
      {
        level: 3,
        score: 3,
        text: "Didiagnosis hipertensi kronis/menahun, rutin minum obat penurun tensi, atau pernah mengalami preeklamsia pada kehamilan sebelumnya."
      }
    ]
  },
  {
    id: "diabetes",
    parameter: "Gula Darah / Riwayat Diabetes",
    questionText: "Apakah Ibu pernah didiagnosis kencing manis (diabetes) atau memiliki gula darah tinggi sebelum maupun selama kehamilan ini?",
    options: [
      {
        level: 1,
        score: 1,
        text: "Tidak pernah memiliki riwayat gula darah tinggi, tidak ada keluarga inti dengan diabetes."
      },
      {
        level: 2,
        score: 2,
        text: "Belum pernah didiagnosis diabetes, namun memiliki riwayat keluarga diabetes, berat badan berlebih, atau riwayat melahirkan bayi >4 kg."
      },
      {
        level: 3,
        score: 3,
        text: "Sudah didiagnosis diabetes (tipe 1, tipe 2, atau gestasional) dan/atau sedang menjalani terapi insulin/obat gula darah."
      }
    ]
  },
  {
    id: "anemia",
    parameter: "Riwayat Anemia / Kekurangan Darah",
    questionText: "Apakah Ibu memiliki riwayat anemia (kurang darah) atau sering merasa lemas, pucat, dan mudah lelah?",
    options: [
      {
        level: 1,
        score: 1,
        text: "Tidak pernah didiagnosis anemia, kadar Hb selalu normal saat pemeriksaan."
      },
      {
        level: 2,
        score: 2,
        text: "Sesekali merasa lemas/pusing atau pernah dinyatakan anemia ringan, namun sudah membaik setelah minum tablet tambah darah."
      },
      {
        level: 3,
        score: 3,
        text: "Anemia sedang-berat yang berulang, riwayat kelainan darah (misal thalasemia), atau pernah butuh transfusi darah."
      }
    ]
  },
  {
    id: "pernapasan",
    parameter: "Riwayat Gangguan Pernapasan (Asma/Sesak Napas)",
    questionText: "Apakah Ibu memiliki riwayat asma atau gangguan pernapasan seperti sering sesak napas/mengi?",
    options: [
      {
        level: 1,
        score: 1,
        text: "Tidak memiliki riwayat asma atau keluhan sesak napas."
      },
      {
        level: 2,
        score: 2,
        text: "Memiliki riwayat asma ringan yang jarang kambuh dan terkontrol tanpa obat rutin/inhaler."
      },
      {
        level: 3,
        score: 3,
        text: "Asma sering kambuh, membutuhkan inhaler/obat rutin, atau pernah dirawat di RS karena sesak napas berat."
      }
    ]
  },
  {
    id: "ginekologi",
    parameter: "Riwayat Ginekologi dan Obstetri",
    questionText: "Apakah Ibu pernah mengalami keguguran, kelahiran prematur, atau komplikasi serius pada kehamilan/persalinan sebelumnya?",
    options: [
      {
        level: 1,
        score: 1,
        text: "Ini kehamilan pertama, atau kehamilan/persalinan sebelumnya berjalan normal tanpa komplikasi."
      },
      {
        level: 2,
        score: 2,
        text: "Pernah mengalami satu kali keguguran atau kelahiran sedikit lebih awal (prematur ringan), tanpa komplikasi berat."
      },
      {
        level: 3,
        score: 3,
        text: "Pernah mengalami keguguran berulang (≥2 kali), stillbirth, pendarahan hebat pasca salin, SC darurat, atau kelainan serviks/rahim."
      }
    ]
  }
];

export interface SkriningResult {
  totalScore: number;
  category: "Risiko Rendah" | "Risiko Menengah" | "Risiko Tinggi";
  recommendation: string;
  colorClass: string;
}

export const calculateRisk = (score: number): SkriningResult => {
  if (score <= 7) {
    return {
      totalScore: score,
      category: "Risiko Rendah",
      recommendation: "Pemantauan rutin faskes primer/bidan. Tetap jaga pola makan sehat, konsumsi vitamin kehamilan, dan istirahat yang cukup.",
      colorClass: "bg-[#EBF5F2] text-[#3EA7A2] border-[#3EA7A2]"
    };
  } else if (score <= 11) {
    return {
      totalScore: score,
      category: "Risiko Menengah",
      recommendation: "Perlu konsultasi dokter spesialis kandungan/SpOG. Jadwalkan pemeriksaan lebih mendalam untuk memantau perkembangan janin secara berkala.",
      colorClass: "bg-amber-50 text-amber-700 border-amber-350"
    };
  } else {
    return {
      totalScore: score,
      category: "Risiko Tinggi",
      recommendation: "Wajib penanganan intensif/rujukan faskes tingkat lanjut. Sangat disarankan untuk segera memeriksakan diri ke Rumah Sakit rujukan dengan fasilitas lengkap.",
      colorClass: "bg-red-50 text-red-700 border-red-300"
    };
  }
};
