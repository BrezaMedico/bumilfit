import { Check, X, Sparkles, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface FeatureRow {
  name: string;
  tooltip?: string;
  category: string;
  basic: boolean | string;
  pro: boolean | string;
  premium: boolean | string;
  premiumLengkap: boolean | string;
}

export const PricingComparison = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'medis' | 'nutrisi'>('all');

  const features: FeatureRow[] = [
    // Kategori: Medis & Konsultasi
    {
      name: 'Bebas Konsultasi Dokter & Bidan',
      tooltip: 'Konsultasi chat dua arah dengan dokter spesialis obgyn dan bidan bersertifikasi.',
      category: 'medis',
      basic: '1 Minggu',
      pro: '1 Bulan',
      premium: '3 Bulan',
      premiumLengkap: '9 Bulan (Penuh)',
    },
    {
      name: 'Resep Obat & Rekomendasi Vitamin Digital',
      tooltip: 'Rekomendasi suplemen dan resep digital langsung dari dokter yang menangani.',
      category: 'medis',
      basic: false,
      pro: true,
      premium: true,
      premiumLengkap: true,
    },
    {
      name: 'Skrining Risiko Kehamilan & Evaluasi',
      tooltip: 'Deteksi dini potensi risiko kehamilan dan panduan pencegahan terpadu.',
      category: 'medis',
      basic: 'Skrining Awal',
      pro: 'Evaluasi Berkala',
      premium: 'Evaluasi Trimester',
      premiumLengkap: 'Evaluasi Menyeluruh 9 Bln',
    },
    {
      name: 'Prioritas Antrean Chat Dokter',
      tooltip: 'Pesan konsultasi Bunda diprioritaskan di daftar antrean dokter.',
      category: 'medis',
      basic: false,
      pro: true,
      premium: true,
      premiumLengkap: 'Prioritas VIP 24/7',
    },
    {
      name: 'Persiapan Persalinan & Konsultasi Laktasi',
      tooltip: 'Bimbingan persalinan nyaman serta tips menyusui dan perawatan bayi baru lahir.',
      category: 'medis',
      basic: false,
      pro: false,
      premium: false,
      premiumLengkap: true,
    },

    // Kategori: Nutrisi & AI Food Scanner
    {
      name: 'Fitur Cek Gizi dengan Kamera (AI Food Scanner)',
      tooltip: 'Cukup foto makanan Bunda, AI BumilFit langsung menganalisis kalori, protein, asam folat, dan zat besi secara instan.',
      category: 'nutrisi',
      basic: false,
      pro: false,
      premium: 'Unlimited (3 Bln)',
      premiumLengkap: 'Unlimited (9 Bln)',
    },
    {
      name: 'Kalkulator Gizi & Kebutuhan Nutrisi Janin',
      tooltip: 'Perhitungan kebutuhan kalori dan mikronutrien harian sesuai usia kehamilan.',
      category: 'nutrisi',
      basic: 'Standar',
      pro: 'Lengkap',
      premium: 'Lengkap + AI Rec',
      premiumLengkap: 'Personalisasi Tiap Minggu',
    },
    {
      name: 'Meal Plan & Rekomendasi Menu Ibu Hamil',
      tooltip: 'Inspirasi resep makanan sehat yang disesuaikan dengan kondisi dan trimester.',
      category: 'nutrisi',
      basic: false,
      pro: 'Template Bulanan',
      premium: 'Sesuai Trimester',
      premiumLengkap: 'Meal Plan Mingguan Personal',
    },

    // Kategori: Komunitas & Fasilitas Tambahan
    {
      name: 'Akses Forum Komunitas & Tanya Bunda',
      tooltip: 'Berbagi pengalaman, cerita kehamilan, dan saling menyemangati sesama calon ibu.',
      category: 'umum',
      basic: true,
      pro: true,
      premium: true,
      premiumLengkap: true,
    },
    {
      name: 'Todo List & Edukasi Harian Kehamilan',
      tooltip: 'Checklist aktivitas harian yang dirancang oleh dokter spesialis kandungan.',
      category: 'umum',
      basic: true,
      pro: true,
      premium: true,
      premiumLengkap: true,
    },
    {
      name: 'Akses Grup VIP & Webinar Eksklusif Dokter',
      tooltip: 'Sesi webinar rutin dan live Q&A bulanan khusus member premium.',
      category: 'umum',
      basic: false,
      pro: false,
      premium: false,
      premiumLengkap: true,
    },
  ];

  const filteredFeatures =
    activeTab === 'all'
      ? features
      : features.filter((f) => f.category === activeTab);

  const renderValue = (val: boolean | string, isHighlighted: boolean = false) => {
    if (typeof val === 'boolean') {
      return val ? (
        <div className="flex justify-center">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isHighlighted ? 'bg-[#389D9C] text-white shadow-sm' : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
            <X className="w-3.5 h-3.5" />
          </div>
        </div>
      );
    }

    return (
      <span
        className={`text-xs font-semibold px-2.5 py-1 rounded-full text-center inline-block ${
          isHighlighted
            ? 'bg-[#389D9C]/15 text-[#216d6c] font-bold border border-[#389D9C]/30'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        {val}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_15px_45px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header Tabel Perbandingan */}
      <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 via-white to-[#EBF8F7]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#389D9C]/10 text-[#389D9C] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Matriks Fitur Lengkap
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Bandingkan Seluruh Fitur Paket
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Lihat detail perbandingan fasilitas untuk menentukan pilihan terbaik bagi Bunda dan si Kecil.
          </p>
        </div>

        {/* Filter Tab Kategori */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveTab('medis')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'medis'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Medis & Dokter
          </button>
          <button
            onClick={() => setActiveTab('nutrisi')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'nutrisi'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Nutrisi & AI Kamera
          </button>
        </div>
      </div>

      {/* Konten Tabel Responsif */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-[36%]">
                Fitur & Layanan
              </th>
              <th className="py-4 px-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-[16%]">
                Basic
                <div className="text-[11px] text-gray-400 font-normal lowercase">15k/minggu</div>
              </th>
              <th className="py-4 px-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-[16%]">
                Pro
                <div className="text-[11px] text-gray-400 font-normal lowercase">99k/bulan</div>
              </th>
              <th className="py-4 px-4 text-center text-xs font-bold text-[#389D9C] uppercase tracking-wider bg-[#389D9C]/10 w-[16%] relative">
                <span className="inline-block bg-[#389D9C] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full absolute -top-2 left-1/2 -translate-x-1/2">
                  POPULER
                </span>
                Premium
                <div className="text-[11px] text-[#389D9C] font-semibold lowercase">105k/3bulan</div>
              </th>
              <th className="py-4 px-4 text-center text-xs font-bold text-[#194668] uppercase tracking-wider w-[16%]">
                Premium Lengkap
                <div className="text-[11px] text-gray-400 font-normal lowercase">299k/9bulan</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredFeatures.map((f, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50/80 transition-colors group"
              >
                <td className="py-3.5 px-6">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">
                      {f.name}
                    </span>
                    {f.tooltip && (
                      <span title={f.tooltip} className="text-gray-300 hover:text-gray-500 cursor-help">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  {f.tooltip && (
                    <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">
                      {f.tooltip}
                    </p>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {renderValue(f.basic)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {renderValue(f.pro)}
                </td>
                <td className="py-3.5 px-4 text-center bg-[#389D9C]/5">
                  {renderValue(f.premium, true)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {renderValue(f.premiumLengkap, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 sm:p-5 bg-gray-50 text-center border-t border-gray-100 text-xs text-gray-500">
        💡 <strong className="text-gray-700">Tips Hemat:</strong> Paket <span className="text-[#389D9C] font-bold">Premium (3 Bulan)</span> dan <span className="text-[#194668] font-bold">Premium Lengkap (9 Bulan)</span> sudah termasuk <strong className="text-gray-800">Fitur Cek Gizi dengan Kamera (AI Food Scanner)</strong> tanpa batas.
      </div>
    </div>
  );
};
