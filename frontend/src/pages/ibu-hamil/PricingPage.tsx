import { useState } from 'react';
import { Crown } from 'lucide-react';
import { PricingCard } from '../../components/pricing/PricingCard';
import type { PlanItem } from '../../components/pricing/PricingCard';
import { PricingModal } from '../../components/pricing/PricingModal';

export const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 4 Paket Langganan Sesuai Permintaan
  const plans: PlanItem[] = [
    {
      id: 'basic',
      name: 'Paket Basic',
      priceFormatted: 'Rp 15.000',
      periodText: '/minggu',
      ctaText: 'Pilih Paket Basic',
      features: [
        'Bebas konsultasi dokter 1 minggu',
      ],
    },
    {
      id: 'pro',
      name: 'Paket Pro',
      priceFormatted: 'Rp 99.000',
      periodText: '/bulan',
      ctaText: 'Pilih Paket Pro',
      features: [
        'Bebas konsultasi dokter 1 bulan',
      ],
    },
    {
      id: 'premium',
      name: 'Paket Premium',
      badge: 'Paling Populer',
      isPopular: true,
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
      name: 'Paket Premium Lengkap',
      priceFormatted: 'Rp 299.000',
      periodText: '/9 bulan',
      ctaText: 'Pilih Premium Lengkap',
      features: [
        'Bebas konsultasi dokter 3 bulan',
        'Fitur gizi dengan kamera',
      ],
    },
  ];

  const handleSelectPlan = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-300">
      
      {/* HEADER SECTION SIMPLE */}
      <div className="pt-8 sm:pt-12 text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#75D5D4]/20 border border-[#389D9C]/30 text-[#389D9C] text-xs font-bold shadow-xs">
          <Crown className="w-3.5 h-3.5 text-[#389D9C] fill-[#389D9C]" />
          <span>Daftar Harga Paket</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Pilihan Paket Langganan BumilFit
        </h1>

        <p className="text-sm sm:text-base text-gray-500">
          Pilih paket yang sesuai dengan kebutuhan konsultasi dokter dan pemantauan gizi Bunda.
        </p>
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
