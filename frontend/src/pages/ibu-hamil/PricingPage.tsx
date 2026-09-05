import { useState } from 'react';
import { Crown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { PricingCard } from '../../components/pricing/PricingCard';
import type { PlanItem } from '../../components/pricing/PricingCard';
import { PricingModal } from '../../components/pricing/PricingModal';
import { useSubscription } from '../../context/SubscriptionContext';

export const PricingPage = () => {
  const location = useLocation();
  const { hasActiveSubscription, activePlanName, endDateFormatted, daysRemaining } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pesan peringatan jika diarahkan dari fitur tertentu (misal: Hubungi Dokter atau Scan Camera)
  const redirectAlert = (location.state as any)?.alert;

  // 4 Paket Langganan Sesuai Permintaan
  const plans: PlanItem[] = [
    {
      id: 'basic',
      name: 'Paket Basic',
      price: 15000,
      priceFormatted: 'Rp 15.000',
      periodText: '/minggu',
      ctaText: 'Pilih Paket Basic',
      features: [
        'Konsultasi dokter 1 minggu',
        'Pemeriksaan gizi tanpa kamera',
      ],
    },
    {
      id: 'pro',
      name: 'Paket Pro',
      price: 99000,
      priceFormatted: 'Rp 99.000',
      periodText: '/bulan',
      ctaText: 'Pilih Paket Pro',
      features: [
        'Bebas konsultasi dokter 1 bulan',
        'Pemeriksaan gizi tanpa kamera',
      ],
    },
    {
      id: 'premium',
      name: 'Paket Premium',
      badge: 'Paling Populer',
      isPopular: true,
      price: 105000,
      priceFormatted: 'Rp 105.000',
      periodText: '/3 bulan',
      ctaText: 'Pilih Paket Premium',
      features: [
        'Bebas konsultasi dokter 3 bulan',
        'Fitur gizi dengan kamera',
      ],
    },
    {
      id: 'premium-lengkap',
      name: 'Paket Premium+',
      price: 299000,
      priceFormatted: 'Rp 299.000',
      periodText: '/9 bulan',
      ctaText: 'Pilih Paket Premium+',
      features: [
        'Bebas konsultasi dokter 9 bulan',
        'Fitur gizi dengan kamera',
      ],
    },
  ];

  const handleSelectPlan = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 mobile-bottom-pad px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER SECTION SIMPLE */}
      <div className="pt-8 sm:pt-12 text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#75D5D4]/20 border border-[#389D9C]/30 text-[#389D9C] text-xs font-bold shadow-xs">
          <Crown className="w-3.5 h-3.5 text-[#389D9C] fill-[#389D9C]" />
          <span>Daftar Harga Paket</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#194668] tracking-tight">
          Pilihan Paket Langganan BumilFit
        </h1>

        <p className="text-sm sm:text-base text-gray-500">
          Pilih paket yang sesuai dengan kebutuhan konsultasi dokter dan pemantauan gizi Bunda.
        </p>

        {/* NOTIFIKASI JIKA DIALIHKAN KARENA FITUR MEMBUTUHKAN LANGGANAN */}
        {redirectAlert && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-left shadow-xs animate-in slide-in-from-top-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-800">Akses Memerlukan Langganan</h4>
              <p className="text-xs text-amber-700 leading-relaxed">{redirectAlert}</p>
            </div>
          </div>
        )}

        {/* INFO STATUS LANGGANAN AKTIF SAAT INI */}
        {hasActiveSubscription && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Langganan Aktif</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">{activePlanName}</span>
                </div>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Berlaku s.d. <strong>{endDateFormatted}</strong> ({daysRemaining} hari tersisa). Bunda dapat memperpanjang atau upgrade paket kapan saja.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GRID 4 PRICING CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
        ))}
      </div>

      {/* MODAL CHECKOUT & SIMULASI PEMBAYARAN */}
      <PricingModal
        plan={selectedPlan}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
};
