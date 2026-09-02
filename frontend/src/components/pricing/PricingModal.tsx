import { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  QrCode, 
  Building2, 
  Smartphone, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Copy,
  ChevronDown
} from 'lucide-react';
import type { PlanItem } from './PricingCard';
import { useNavigate } from 'react-router-dom';

interface PricingModalProps {
  plan: PlanItem | null;
  isOpen: boolean;
  onClose: () => void;
}

// Daftar Bank di Indonesia
const INDONESIAN_BANKS = [
  { id: 'bca', name: 'Bank BCA', code: 'BCA', va: '88019 8291 0281 92' },
  { id: 'mandiri', name: 'Bank Mandiri', code: 'MDR', va: '89102 3819 0281 72' },
  { id: 'bri', name: 'Bank BRI', code: 'BRI', va: '10293 8472 9182 01' },
  { id: 'bni', name: 'Bank BNI', code: 'BNI', va: '98801 8291 0293 84' },
  { id: 'bsi', name: 'Bank Syariah Indonesia (BSI)', code: 'BSI', va: '45109 2819 0281 92' },
  { id: 'permata', name: 'Bank Permata', code: 'PERMATA', va: '85201 9283 0192 83' },
  { id: 'cimb', name: 'Bank CIMB Niaga', code: 'CIMB', va: '70281 9283 0192 84' },
];

// Daftar E-Wallet di Indonesia
const INDONESIAN_EWALLETS = [
  { id: 'gopay', name: 'GoPay', code: 'GOPAY' },
  { id: 'ovo', name: 'OVO', code: 'OVO' },
  { id: 'dana', name: 'DANA', code: 'DANA' },
  { id: 'shopeepay', name: 'ShopeePay', code: 'SPAY' },
  { id: 'linkaja', name: 'LinkAja', code: 'LINKAJA' },
];

export const PricingModal = ({ plan, isOpen, onClose }: PricingModalProps) => {
  const navigate = useNavigate();
  
  // Metode pembayaran terpilih
  const [paymentCategory, setPaymentCategory] = useState<'qris' | 'bank' | 'ewallet'>('qris');
  const [selectedBank, setSelectedBank] = useState(INDONESIAN_BANKS[0]);
  const [selectedEwallet, setSelectedEwallet] = useState(INDONESIAN_EWALLETS[0]);

  // Status dropdown
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [isEwalletDropdownOpen, setIsEwalletDropdownOpen] = useState(false);

  // Status alur pembayaran
  const [step, setStep] = useState<'checkout' | 'payment_process' | 'success'>('checkout');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('checkout');
      setPaymentCategory('qris');
      setIsBankDropdownOpen(false);
      setIsEwalletDropdownOpen(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !plan) return null;

  // Harga dasar paket
  const getRawPrice = () => {
    switch (plan.id) {
      case 'basic':
        return 15000;
      case 'pro':
        return 99000;
      case 'premium':
        return 105000;
      case 'premium-lengkap':
        return 299000;
      default:
        return 105000;
    }
  };

  const rawPrice = getRawPrice();
  const ppnTax = Math.round(rawPrice * 0.11); // Pajak PPN 11%
  const adminFee = 0; // Bebas biaya admin
  const totalPrice = rawPrice + ppnTax + adminFee;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('payment_process');
    }, 800);
  };

  const handleConfirmPaid = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
    }, 1200);
  };

  const copyVA = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Sederhana (Tanpa Icon Atas Kiri) */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {step === 'checkout' && 'Checkout Paket Langganan'}
              {step === 'payment_process' && 'Instruksi Pembayaran'}
              {step === 'success' && 'Pembayaran Berhasil! 🎉'}
            </h2>
            <p className="text-xs text-gray-500">
              {step === 'checkout' && 'Pilih metode pembayaran aman dan nikmati seluruh fiturnya'}
              {step === 'payment_process' && 'Selesaikan pembayaran sebelum batas waktu berakhir'}
              {step === 'success' && 'Paket langganan Bunda telah aktif'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
          
          {/* STEP 1: CHECKOUT */}
          {step === 'checkout' && (
            <>
              {/* Ringkasan Paket */}
              <div className="p-4 rounded-2xl bg-[#75D5D4]/15 border border-[#389D9C]/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#389D9C] uppercase tracking-wider block">
                    Paket Dipilih
                  </span>
                  <h4 className="text-base font-extrabold text-gray-900">{plan.name}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{plan.features[0]}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-gray-900">{plan.priceFormatted}</div>
                  <span className="text-xs font-semibold text-[#389D9C]">{plan.periodText}</span>
                </div>
              </div>

              {/* Pilihan Metode Pembayaran */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Pilih Metode Pembayaran:
                </label>

                {/* 1. Opsi QRIS */}
                <div
                  onClick={() => {
                    setPaymentCategory('qris');
                    setIsBankDropdownOpen(false);
                    setIsEwalletDropdownOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentCategory === 'qris'
                      ? 'border-[#389D9C] bg-[#75D5D4]/10 ring-2 ring-[#389D9C]/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 block">QRIS (Semua Pembayaran)</span>
                      <p className="text-[11px] text-gray-500">GoPay, OVO, Dana, ShopeePay, BCA Mobile, dll.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Instan
                  </span>
                </div>

                {/* 2. Opsi Bank Virtual Account (Dropdown) */}
                <div className="space-y-1.5">
                  <div
                    onClick={() => {
                      setPaymentCategory('bank');
                      setIsBankDropdownOpen(!isBankDropdownOpen);
                      setIsEwalletDropdownOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentCategory === 'bank'
                        ? 'border-[#389D9C] bg-[#75D5D4]/10 ring-2 ring-[#389D9C]/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#194668] flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-gray-900 block">Transfer Virtual Account Bank</span>
                        <p className="text-[11px] text-[#389D9C] font-semibold">
                          Terpilih: {selectedBank.name}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* List Dropdown Bank */}
                  {isBankDropdownOpen && (
                    <div className="p-2 bg-gray-50 rounded-2xl border border-gray-200 space-y-1 animate-in fade-in duration-150">
                      {INDONESIAN_BANKS.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => {
                            setSelectedBank(bank);
                            setPaymentCategory('bank');
                            setIsBankDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                            selectedBank.id === bank.id
                              ? 'bg-[#389D9C] text-white'
                              : 'text-gray-700 hover:bg-white'
                          }`}
                        >
                          <span>{bank.name}</span>
                          <span className="text-[10px] uppercase font-bold opacity-80">{bank.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Opsi E-Wallet (Dropdown) */}
                <div className="space-y-1.5">
                  <div
                    onClick={() => {
                      setPaymentCategory('ewallet');
                      setIsEwalletDropdownOpen(!isEwalletDropdownOpen);
                      setIsBankDropdownOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentCategory === 'ewallet'
                        ? 'border-[#389D9C] bg-[#75D5D4]/10 ring-2 ring-[#389D9C]/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-gray-900 block">E-Wallet Indonesia</span>
                        <p className="text-[11px] text-[#389D9C] font-semibold">
                          Terpilih: {selectedEwallet.name}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isEwalletDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* List Dropdown E-Wallet */}
                  {isEwalletDropdownOpen && (
                    <div className="p-2 bg-gray-50 rounded-2xl border border-gray-200 space-y-1 animate-in fade-in duration-150">
                      {INDONESIAN_EWALLETS.map((wallet) => (
                        <button
                          key={wallet.id}
                          type="button"
                          onClick={() => {
                            setSelectedEwallet(wallet);
                            setPaymentCategory('ewallet');
                            setIsEwalletDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                            selectedEwallet.id === wallet.id
                              ? 'bg-[#389D9C] text-white'
                              : 'text-gray-700 hover:bg-white'
                          }`}
                        >
                          <span>{wallet.name}</span>
                          <span className="text-[10px] uppercase font-bold opacity-80">{wallet.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Rincian Biaya & PPN 11% */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Harga Paket ({plan.name})</span>
                  <span>{formatRupiah(rawPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pajak PPN (11%)</span>
                  <span>{formatRupiah(ppnTax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Admin</span>
                  <span className="text-emerald-600 font-bold">Gratis (Rp 0)</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline font-bold text-gray-900">
                  <span>Total Pembayaran</span>
                  <span className="text-lg text-[#389D9C] font-black">{formatRupiah(totalPrice)}</span>
                </div>
              </div>

              {/* Keamanan Pembayaran Ringkas */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#389D9C]" />
                <span>Pembayaran terenkripsi</span>
              </div>
            </>
          )}

          {/* STEP 2: PAYMENT INSTRUCTION (SIMULATED) */}
          {step === 'payment_process' && (
            <div className="space-y-5 text-center">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Clock className="w-4 h-4 text-amber-600" /> Batas Waktu Pembayaran:
                </span>
                <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-amber-300">
                  23:59:45
                </span>
              </div>

              {paymentCategory === 'qris' && (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="p-4 bg-white rounded-3xl border-2 border-[#389D9C]/40 shadow-md inline-block">
                    <div className="w-44 h-44 bg-gray-900 rounded-2xl flex flex-col items-center justify-center p-3 text-white">
                      <QrCode className="w-32 h-32 text-white" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">QRIS BUMILFIT</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 max-w-xs">
                    Scan kode QRIS menggunakan e-wallet atau mobile banking Bunda.
                  </p>
                </div>
              )}

              {paymentCategory === 'bank' && (
                <div className="space-y-3">
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-2">
                    <span className="text-xs text-gray-500 font-semibold block">
                      Nomor Virtual Account {selectedBank.name}:
                    </span>
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
                      <span className="font-mono font-black text-lg text-gray-900 tracking-wider">
                        {selectedBank.va}
                      </span>
                      <button
                        onClick={() => copyVA(selectedBank.va.replace(/\s/g, ''))}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-[#389D9C] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Total transfer: <strong className="text-gray-900">{formatRupiah(totalPrice)}</strong>
                    </p>
                  </div>
                </div>
              )}

              {paymentCategory === 'ewallet' && (
                <div className="space-y-3">
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-2">
                    <span className="text-xs text-gray-500 font-semibold block">
                      Pembayaran {selectedEwallet.name}:
                    </span>
                    <p className="text-xs text-gray-600">
                      Buka aplikasi <strong>{selectedEwallet.name}</strong> Anda dan konfirmasi pembayaran sebesar <strong>{formatRupiah(totalPrice)}</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">
                  Pembayaran Berhasil!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto mt-1">
                  Paket <strong className="text-[#389D9C]">{plan.name}</strong> Bunda telah aktif.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Modal Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          {step === 'checkout' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#389D9C] hover:bg-[#2E8281] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Bayar {formatRupiah(totalPrice)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {step === 'payment_process' && (
            <>
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmPaid}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saya Sudah Bayar</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/');
              }}
              className="w-full py-3 rounded-xl bg-[#389D9C] hover:bg-[#2E8281] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Mulai Gunakan Fitur</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
