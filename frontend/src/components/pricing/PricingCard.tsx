import { Check } from 'lucide-react';

export interface PlanItem {
  id: string;
  name: string;
  badge?: string;
  isPopular?: boolean;
  tagline?: string;
  priceFormatted: string;
  periodText: string;
  features: string[];
  ctaText: string;
}

interface PricingCardProps {
  plan: PlanItem;
  onSelect: (plan: PlanItem) => void;
}

export const PricingCard = ({ plan, onSelect }: PricingCardProps) => {
  return (
    <div
      className={`relative w-full h-full rounded-2xl sm:rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ease-out ${
        plan.isPopular
          ? 'bg-gradient-to-b from-[#75D5D4]/15 via-white to-white border-2 border-[#389D9C] shadow-[0_10px_30px_rgba(56,157,156,0.15)] hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(56,157,156,0.22)]'
          : 'bg-white border border-gray-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-[#389D9C]/60 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(56,157,156,0.1)]'
      }`}
    >
      {/* Bagian Atas: Header & Fitur (flex-1 memastikan tinggi kartu & posisi tombol sejajar) */}
      <div className="flex flex-col flex-1">
        
        {/* Slot Badge Atas (Tinggi Konsisten Agar Semua Kartu Sejajar) */}
        <div className="h-6 flex items-center justify-center mb-1">
          {plan.badge ? (
            <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#389D9C] text-white shadow-xs">
              {plan.badge}
            </span>
          ) : (
            <div className="h-4" />
          )}
        </div>

        {/* Header Kartu: Nama Paket */}
        <div className="text-center pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{plan.name}</h3>
          
          {/* Harga: Ditampilkan Memanjang ke Samping dalam Satu Baris Horizontal Konsisten */}
          <div className="mt-3 flex items-baseline justify-center gap-1.5 whitespace-nowrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {plan.priceFormatted}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#389D9C]">
              {plan.periodText}
            </span>
          </div>
        </div>

        {/* Daftar Fitur Utama */}
        <div className="py-5 flex-1 flex flex-col justify-start">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Fitur Utama:
          </p>
          <ul className="space-y-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    plan.isPopular
                      ? 'bg-[#389D9C] text-white shadow-xs'
                      : 'bg-[#75D5D4]/25 text-[#389D9C]'
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="font-medium leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bagian Bawah: Tombol CTA dengan Efek Mengkilat (Glossy Shine Sweep) */}
      <div className="pt-4 border-t border-gray-100 mt-auto">
        <button
          onClick={() => onSelect(plan)}
          className="relative w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.98] group/btn bg-[#389D9C] hover:bg-[#2E8281] text-white shadow-sm hover:shadow-lg hover:shadow-[#389D9C]/35"
        >
          {/* Animasi Mengkilat (Gleam / Glossy Light Beam Sweep on Hover) */}
          <span className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] group-hover/btn:left-[100%] transition-all duration-700 ease-in-out pointer-events-none" />

          {/* Button Text Content */}
          <span className="relative z-10">
            {plan.ctaText}
          </span>
        </button>
      </div>
    </div>
  );
};
