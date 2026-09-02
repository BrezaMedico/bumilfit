import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  HeartHandshake, 
  HelpCircle 
} from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  subtitle: string;
  monthlyPrice: number;
  annualPrice: number;
  periodLabel: string;
  isPopular?: boolean;
  badgeText?: string;
  features: { text: string; included: boolean; highlight?: boolean }[];
  ctaText: string;
  buttonVariant: 'outline' | 'secondary' | 'primary';
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Paket Starter',
    subtitle: 'Pemantauan kehamilan dasar untuk bunda yang baru memulai.',
    monthlyPrice: 0,
    annualPrice: 0,
    periodLabel: 'Selamanya',
    features: [
      { text: 'Kalkulator Usia Kehamilan & HPL', included: true },
      { text: 'Checklist 5 Tugas Harian Dasar', included: true },
      { text: 'Forum Diskusi Komunitas', included: true },
      { text: 'AI Scanner Nutrisi Makanan (3x/hari)', included: true },
      { text: 'Konsultasi Dokter Virtual 24/7', included: false },
      { text: 'Analisis AI & Rangkuman Medis', included: false },
      { text: 'Panduan Persalinan & Modul Senam', included: false },
    ],
    ctaText: 'Mulai Gratis',
    buttonVariant: 'outline'
  },
  {
    id: 'basic_1m',
    name: 'Paket 1 Bulan',
    subtitle: 'Pendampingan nutrisi harian dan konsultasi awal kehamilan.',
    monthlyPrice: 49000,
    annualPrice: 39000,
    periodLabel: '/ bulan',
    features: [
      { text: 'Semua fitur di Paket Starter', included: true },
      { text: 'AI Food Scanner Tanpa Batas', included: true, highlight: true },
      { text: 'Evaluasi Keluhan Harian Berbasis AI', included: true },
      { text: 'Konsultasi Dokter Virtual (10 sesi/bln)', included: true },
      { text: 'Rekomendasi Menu Gizi Trimester', included: true },
      { text: 'Rangkuman Resume Medis Otomatis', included: false },
      { text: 'Panduan Persalinan & Modul Senam', included: false },
    ],
    ctaText: 'Dapatkan Sekarang',
    buttonVariant: 'secondary'
  },
  {
    id: 'premium_3m',
    name: 'Paket Premium',
    subtitle: 'Pilihan terfavorit bunda untuk pendampingan satu trimester penuh.',
    monthlyPrice: 119000,
    annualPrice: 89000,
    periodLabel: '/ 3 bulan',
    isPopular: true,
    badgeText: 'POPULER',
    features: [
      { text: 'Semua fitur di Paket 1 Bulan', included: true },
      { text: 'Konsultasi Dokter Virtual Tanpa Batas 24/7', included: true, highlight: true },
      { text: 'Rangkuman Resume Medis Otomatis (AI)', included: true, highlight: true },
      { text: 'Tanya Bubun AI Interaktif Instan', included: true },
      { text: 'Prioritas Balasan di Forum Komunitas', included: true },
      { text: 'Pelacak Berat Badan & Pertumbuhan Janin', included: true },
      { text: 'Diskon 10% Belanja Obat & Vitamin', included: true },
    ],
    ctaText: 'Dapatkan Sekarang',
    buttonVariant: 'primary'
  },
  {
    id: 'full_term_9m',
    name: 'Paket Lengkap',
    subtitle: 'Pendampingan total 9 bulan kehamilan hingga hari persalinan.',
    monthlyPrice: 249000,
    annualPrice: 199000,
    periodLabel: '/ 9 bulan',
    badgeText: 'HEMAT 35%',
    features: [
      { text: 'Semua fitur di Paket Premium', included: true },
      { text: 'Akses Penuh 9 Bulan + Masa Nifas (40 Hari)', included: true, highlight: true },
      { text: 'Rencana Persalinan & Hospital Bag Checklist', included: true },
      { text: 'Modul Video Senam Hamil & Relaksasi', included: true },
      { text: 'Layanan Darurat & Red Flag Warning Cepat', included: true },
      { text: 'Diskon 15% Belanja Obat & Vitamin', included: true },
      { text: 'Konsultasi Pasca Lahir & Laktasi', included: true },
    ],
    ctaText: 'Dapatkan Sekarang',
    buttonVariant: 'secondary'
  }
];

export interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: string, planName: string, price: number) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ 
  isOpen, 
  onClose,
  onSelectPlan 
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatRupiah = (val: number) => {
    if (val === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handleChoosePlan = (tier: PricingTier) => {
    const price = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;
    if (onSelectPlan) {
      onSelectPlan(tier.id, tier.name, price);
    } else {
      alert(`Bunda memilih ${tier.name} seharga ${formatRupiah(price)}. Fitur pembayaran akan segera tersedia!`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-7xl bg-[#F8FAFC] rounded-[2rem] border border-slate-200/80 shadow-[0_25px_70px_rgba(0,0,0,0.2)] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup X di Sudut Kanan Atas */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200 transition-all cursor-pointer"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto p-5 sm:p-8 md:p-10 space-y-8 text-slate-800">
          
          {/* 1. Header Bagian Atas */}
          <div className="text-center max-w-2xl mx-auto space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#389D9C] text-xs font-bold uppercase tracking-wider shadow-2xs">
              <Crown size={14} className="text-[#389D9C]" fill="currentColor" />
              <span>BumilFit Premium</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#194668] tracking-tight">
              Paket Langganan
            </h2>

            <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
              Pilih paket yang paling tepat untuk mendampingi setiap momen berharga kehamilan Bunda dengan layanan dokter & AI terbaik.
            </p>

            {/* Toggle Siklus Pembayaran (Bulanan / Tahunan) */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <div className="bg-slate-200/80 p-1 rounded-full flex items-center shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-[#194668] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Bayar Reguler
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    billingCycle === 'annual'
                      ? 'bg-[#389D9C] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Bayar Hemat</span>
                  <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                    Hemat 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Grid 4 Kolom Kartu Paket */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 items-stretch">
            {PRICING_TIERS.map((tier) => {
              const displayPrice = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;
              const isHighlighted = tier.isPopular;

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-[1.75rem] transition-all duration-300 flex flex-col justify-between text-left p-6 ${
                    isHighlighted
                      ? 'bg-gradient-to-b from-white via-teal-50/20 to-teal-50/40 border-2 border-[#389D9C] shadow-[0_20px_45px_rgba(56,157,156,0.18)] ring-4 ring-[#389D9C]/10 lg:-translate-y-2'
                      : 'bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-1'
                  }`}
                >
                  {/* Badge Sorotan di Bagian Atas Kartu */}
                  {tier.badgeText && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                      <span className={`text-[11px] font-black tracking-wider uppercase px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1 ${
                        isHighlighted
                          ? 'bg-[#389D9C] text-white'
                          : 'bg-amber-400 text-slate-900'
                      }`}>
                        {isHighlighted && <Sparkles size={12} className="animate-spin" style={{ animationDuration: '3s' }} />}
                        {tier.badgeText}
                      </span>
                    </div>
                  )}

                  {/* Bagian Atas Kartu: Header & Harga */}
                  <div className="space-y-4">
                    <div>
                      <h3 className={`text-lg font-extrabold ${isHighlighted ? 'text-[#194668]' : 'text-slate-800'}`}>
                        {tier.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed min-h-[36px]">
                        {tier.subtitle}
                      </p>
                    </div>

                    {/* Harga Utama */}
                    <div className="pt-2 border-t border-slate-100 pb-2">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
                          isHighlighted ? 'text-[#389D9C]' : 'text-[#194668]'
                        }`}>
                          {formatRupiah(displayPrice)}
                        </span>
                        {displayPrice > 0 && (
                          <span className="text-xs font-bold text-slate-400">
                            {tier.periodLabel}
                          </span>
                        )}
                      </div>
                      {displayPrice === 0 && (
                        <span className="text-xs font-semibold text-emerald-600">Akses selamanya gratis</span>
                      )}
                    </div>

                    {/* Tombol Aksi CTA */}
                    <div className="pt-1">
                      {tier.buttonVariant === 'primary' && (
                        <button
                          type="button"
                          onClick={() => handleChoosePlan(tier)}
                          className="w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-[#389D9C] hover:bg-[#2C7E7D] text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <Zap size={16} fill="currentColor" />
                          <span>{tier.ctaText}</span>
                        </button>
                      )}

                      {tier.buttonVariant === 'secondary' && (
                        <button
                          type="button"
                          onClick={() => handleChoosePlan(tier)}
                          className="w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-teal-50 hover:bg-[#389D9C] text-[#389D9C] hover:text-white border border-[#389D9C]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <span>{tier.ctaText}</span>
                        </button>
                      )}

                      {tier.buttonVariant === 'outline' && (
                        <button
                          type="button"
                          onClick={() => handleChoosePlan(tier)}
                          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <span>{tier.ctaText}</span>
                        </button>
                      )}
                    </div>

                    {/* Garis Pemisah */}
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                        FITUR TERMASUK:
                      </p>

                      {/* Daftar Fitur (Checklist) */}
                      <ul className="space-y-2.5 text-xs leading-relaxed">
                        {tier.features.map((feature, idx) => (
                          <li 
                            key={idx} 
                            className={`flex items-start gap-2.5 ${
                              feature.included 
                                ? feature.highlight 
                                  ? 'font-bold text-[#194668]' 
                                  : 'text-slate-700 font-medium' 
                                : 'text-slate-300 line-through'
                            }`}
                          >
                            <span className="flex-shrink-0 mt-0.5">
                              {feature.included ? (
                                <div className="w-4 h-4 rounded-full bg-teal-100/80 text-[#389D9C] flex items-center justify-center">
                                  <Check size={11} strokeWidth={3.5} />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center">
                                  <X size={10} strokeWidth={2.5} />
                                </div>
                              )}
                            </span>
                            <span className="flex-1">{feature.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

          {/* 3. Footer Tambahan & Jaminan */}
          <div className="pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#389D9C]" />
              <span className="font-semibold text-slate-700">Garansi 7 Hari Uang Kembali</span>
              <span className="text-slate-300">•</span>
              <span>Batalkan kapan saja tanpa biaya tersembunyi.</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <HeartHandshake size={14} className="text-[#389D9C]" />
                Didukung Dokter Kandungan & Ahli Gizi
              </span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                <HelpCircle size={14} />
                Butuh Bantuan? Hubungi CS
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
