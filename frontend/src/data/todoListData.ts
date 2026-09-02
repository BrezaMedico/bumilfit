export interface TodoTask {
  id: number;
  text: string;
}

export const TODO_TASKS_BY_RISK: Record<"Risiko Rendah" | "Risiko Menengah" | "Risiko Tinggi", TodoTask[]> = {
  "Risiko Rendah": [
    { id: 1, text: "Minum vitamin kehamilan (Asam Folat & Zat Besi)" },
    { id: 2, text: "Jalan santai pagi selama 15 menit" },
    { id: 3, text: "Minum air putih minimal 8-10 gelas" },
    { id: 4, text: "Konsumsi makanan bergizi tinggi serat (sayur dan buah)" }
  ],
  "Risiko Menengah": [
    { id: 1, text: "Minum vitamin kehamilan (Asam Folat & Zat Besi)" },
    { id: 2, text: "Pantau tekanan darah & cek kadar gula secara berkala" },
    { id: 3, text: "Batasi konsumsi garam berlebih dan gula tambahan" },
    { id: 4, text: "Jadwalkan konsultasi rutin ke dokter kandungan/SpOG" },
    { id: 5, text: "Istirahat cukup (minimal 8 jam sehari) & kurangi aktivitas berat" }
  ],
  "Risiko Tinggi": [
    { id: 1, text: "Minum obat rutin (penurun tensi/terapi gula) sesuai resep dokter" },
    { id: 2, text: "Pantau gerakan janin secara ketat (minimal 10 gerakan per 2 jam)" },
    { id: 3, text: "Cek tanda bahaya preeklamsia (sakit kepala hebat, pandangan kabur, kaki bengkak)" },
    { id: 4, text: "Persiapkan dokumen rujukan faskes tingkat lanjut (RS)" },
    { id: 5, text: "Wajib istirahat total (bedrest) & batasi mobilitas fisik" }
  ]
};
