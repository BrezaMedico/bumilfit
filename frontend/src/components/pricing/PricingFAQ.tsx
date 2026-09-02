import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export const PricingFAQ = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const faqs: FAQItem[] = [
    {
      question: 'Bagaimana cara melakukan konsultasi dokter setelah berlangganan?',
      answer:
        'Setelah paket langganan Bunda aktif, Bunda cukup membuka menu "Hubungi Dokter" di navbar atau dashboard. Bunda dapat langsung memulai chat bebas tanpa kuota batas pertanyaan dengan dokter spesialis obgyn dan bidan BumilFit yang siap merespons secara cepat dan ramah.',
    },
    {
      question: 'Apa itu fitur Cek Gizi dengan Kamera (AI Food Scanner) dan cara kerjanya?',
      answer:
        'Fitur Cek Gizi Kamera memungkinkan Bunda memfoto makanan atau minuman harian Bunda menggunakan kamera smartphone atau upload foto. Kecerdasan Buatan (AI) BumilFit akan otomatis menganalisis porsi kalori, protein, lemak, karbohidrat, serta mikronutrien penting janin seperti asam folat, zat besi, dan kalsium.',
    },
    {
      question: 'Metode pembayaran apa saja yang tersedia di BumilFit?',
      answer:
        'Kami mendukung berbagai metode pembayaran instan dan aman, termasuk QRIS (GoPay, OVO, Dana, ShopeePay, LinkAja, BCA Mobile), Transfer Virtual Account Bank (BCA, Mandiri, BRI, BNI, Permata), serta transfer bank manual.',
    },
    {
      question: 'Apakah saya bisa upgrade paket kapan saja?',
      answer:
        'Tentu saja! Bunda dapat melakukan upgrade dari Paket Basic atau Pro ke Paket Premium atau Premium Lengkap kapan saja. Sisa masa aktif paket sebelumnya akan otomatis diakumulasikan dan disesuaikan secara proporsional.',
    },
    {
      question: 'Apakah paket langganan akan otomatis memotong saldo (auto-renewal)?',
      answer:
        'Tidak. Di BumilFit kami tidak menerapkan sistem auto-debit otomatis tanpa persetujuan. Menjelang masa aktif habis, kami akan mengirimkan notifikasi pengingat ramah sehingga Bunda memiliki kendali penuh untuk memperpanjang paket atau tidak.',
    },
    {
      question: 'Bagaimana jika saya memerlukan bantuan teknis atau memiliki kendala?',
      answer:
        'Tim Customer Support & Bantuan BumilFit siap membantu Bunda 24/7 melalui WhatsApp Support resmi dan Live Chat di aplikasi.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_15px_45px_rgba(0,0,0,0.04)] p-6 sm:p-10">
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#389D9C]/10 text-[#389D9C] text-xs font-bold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          Frequently Asked Questions
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Pertanyaan yang Sering Diajukan
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          Punya pertanyaan seputar paket langganan dan fitur BumilFit? Temukan jawabannya di sini.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndices.includes(index);

          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-[#389D9C]/40 bg-[#EBF8F7]/30 shadow-sm'
                  : 'border-gray-200/70 hover:border-gray-300 bg-white'
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left px-5 sm:px-6 py-4 sm:py-4.5 flex items-center justify-between gap-4 cursor-pointer"
                aria-expanded={isOpen}
              >
                <span
                  className={`text-sm sm:text-base font-bold transition-colors ${
                    isOpen ? 'text-[#194668]' : 'text-gray-800'
                  }`}
                >
                  {faq.question}
                </span>
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen
                      ? 'bg-[#389D9C] text-white rotate-180'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100/60 animate-in fade-in duration-200">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
