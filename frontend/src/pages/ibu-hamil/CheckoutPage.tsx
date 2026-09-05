import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Truck, 
  CreditCard, 
  Plus, 
  Loader2, 
  X, 
  Clock, 
  Banknote,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { apiClient } from '../../lib/apiClient';
import { toast } from '../../store/useToastStore';

interface AddressData {
  jalan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  type: 'reguler' | 'instant' | 'hemat';
  etd: string;
  price: number;
  description: string;
  badge?: string;
}

// Pilihan Ekspedisi Standar Indonesia dengan Tarif Realistis
const INDONESIA_SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'sicepat-reg',
    name: 'SiCepat Reguler (SIUNTUNG)',
    type: 'reguler',
    etd: '1 - 2 Hari',
    price: 9000,
    description: 'Layanan standar cepat & aman terpercaya',
    badge: 'Paling Murah',
  },
  {
    id: 'jnt-reg',
    name: 'J&T Express (EZ)',
    type: 'reguler',
    etd: '1 - 2 Hari',
    price: 10000,
    description: 'Jangkauan terluas seluruh Indonesia',
    badge: 'Terpopuler',
  },
  {
    id: 'jne-reg',
    name: 'JNE Reguler',
    type: 'reguler',
    etd: '2 - 3 Hari',
    price: 11000,
    description: 'Layanan pengiriman berpengalaman nasional',
  },
  {
    id: 'anteraja-reg',
    name: 'Anteraja Reguler',
    type: 'reguler',
    etd: '1 - 2 Hari',
    price: 10000,
    description: 'Kurir Satria terpercaya dengan pelacakan live',
  },
  {
    id: 'gosend-instant',
    name: 'GoSend Instant',
    type: 'instant',
    etd: '1 - 2 Jam Tiba',
    price: 20000,
    description: 'Driver langsung antar khusus obat darurat',
    badge: 'Kilat',
  },
  {
    id: 'grab-instant',
    name: 'GrabExpress Instant',
    type: 'instant',
    etd: '1 - 2 Jam Tiba',
    price: 20000,
    description: 'Pengiriman instan kilat langsung sampai',
  },
  {
    id: 'gosend-sameday',
    name: 'GoSend Sameday',
    type: 'instant',
    etd: '6 - 8 Jam',
    price: 14000,
    description: 'Tiba di hari yang sama dengan biaya hemat',
  },
  {
    id: 'sicepat-hemat',
    name: 'SiCepat Hemat (HALO)',
    type: 'hemat',
    etd: '3 - 5 Hari',
    price: 7000,
    description: 'Ongkir ekonomis untuk kebutuhan berkala',
    badge: 'Hemat',
  },
];

const BANK_OPTIONS = [
  { id: 'BCA', label: 'BCA Virtual Account', prefix: '3901' },
  { id: 'Mandiri', label: 'Mandiri Virtual Account', prefix: '896' },
  { id: 'BRI', label: 'BRI Virtual Account (BRIVA)', prefix: '88788' },
  { id: 'BNI', label: 'BNI Virtual Account', prefix: '827' },
  { id: 'BSI', label: 'BSI Virtual Account (Syariah)', prefix: '889' },
];

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  
  // State profile dan alamat
  const [profile, setProfile] = useState<any>(null);
  const [alamat, setAlamat] = useState<string>('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  
  // State form alamat
  const [formAlamat, setFormAlamat] = useState<AddressData>({
    jalan: '',
    kota: '',
    provinsi: '',
    kodePos: '',
  });

  // State Kurir & Pengiriman (Default: SiCepat Reguler)
  const [shippingCategoryTab, setShippingCategoryTab] = useState<'semua' | 'reguler' | 'instant' | 'hemat'>('semua');
  const [selectedShippingId, setSelectedShippingId] = useState<string>('sicepat-reg');

  // State Metode Pembayaran (Default: QRIS)
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bank' | 'cod'>('qris');
  const [selectedBank, setSelectedBank] = useState<string>('BCA');

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast.warning(message);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(angka);
  };

  // Fetch profil saat mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        setProfile(response.data);
        const savedAlamat = response.data.profilIbu?.alamat || '';
        setAlamat(savedAlamat);
        
        if (savedAlamat) {
          try {
            const parsed = JSON.parse(savedAlamat);
            setFormAlamat(parsed);
          } catch (e) {
            setFormAlamat({
              jalan: savedAlamat,
              kota: '',
              provinsi: '',
              kodePos: '',
            });
          }
        }
      } catch (err) {
        console.error('Gagal mengambil data profil:', err);
      } finally {
        setIsProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Simpan Alamat ke Database
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAlamat.jalan.trim() || !formAlamat.kota.trim() || !formAlamat.provinsi.trim() || !formAlamat.kodePos.trim()) {
      showToast('Semua bidang alamat wajib diisi!', 'warning');
      return;
    }

    setIsSavingAddress(true);
    const fullAddressJson = JSON.stringify(formAlamat);

    try {
      const res = await apiClient.put('/auth/profile', {
        namaIbu: profile?.profilIbu?.namaIbu,
        nomorWhatsapp: profile?.profilIbu?.nomorWhatsapp,
        namaAnak: profile?.profilIbu?.namaAnak,
        genderAnak: profile?.profilIbu?.genderAnak,
        usiaKehamilanMinggu: profile?.profilIbu?.usiaKehamilanMinggu,
        usiaKehamilanHari: profile?.profilIbu?.usiaKehamilanHari,
        golonganDarah: profile?.profilIbu?.golonganDarah,
        fotoProfil: profile?.profilIbu?.fotoProfil,
        alamat: fullAddressJson,
      });

      setProfile((prev: any) => ({
        ...prev,
        profilIbu: res.data.profilIbu,
      }));
      setAlamat(fullAddressJson);
      setIsAddressModalOpen(false);
      showToast('Alamat berhasil disimpan!', 'success');
    } catch (err) {
      console.error('Gagal memperbarui alamat:', err);
      showToast('Gagal menyimpan alamat. Harap coba lagi.', 'error');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const getFormattedAddress = () => {
    if (!alamat) return '';
    try {
      const parsed = JSON.parse(alamat);
      return `${parsed.jalan}, ${parsed.kota}, ${parsed.provinsi} ${parsed.kodePos}`;
    } catch (e) {
      return alamat;
    }
  };

  // Kalkulasi Biaya
  const selectedShipping = INDONESIA_SHIPPING_OPTIONS.find(s => s.id === selectedShippingId) || INDONESIA_SHIPPING_OPTIONS[0];
  const shippingFee = selectedShipping.price;
  const subtotalProduk = getTotalPrice();
  // PPN 5% dihitung dari total harga obat (subtotal) + ongkos kirim (ongkir)
  const ppn = Math.round((subtotalProduk + shippingFee) * 0.05);
  const totalTagihan = subtotalProduk + shippingFee + ppn;

  // Filter daftar ekspedisi berdasarkan tab
  const filteredShippingOptions = INDONESIA_SHIPPING_OPTIONS.filter((option) => {
    if (shippingCategoryTab === 'semua') return true;
    return option.type === shippingCategoryTab;
  });

  const handleCheckoutSubmit = async () => {
    if (!alamat) {
      showToast('Harap masukkan alamat pengiriman terlebih dahulu!', 'warning');
      setIsAddressModalOpen(true);
      return;
    }
    if (cartItems.length === 0) {
      showToast('Keranjang belanja Anda masih kosong!', 'warning');
      navigate('/belanja-obat');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const activeBank = BANK_OPTIONS.find(b => b.id === selectedBank) || BANK_OPTIONS[0];
      const orderPayload = {
        items: cartItems,
        totalPrice: totalTagihan,
        subtotal: subtotalProduk,
        shippingFee,
        courierName: selectedShipping.name,
        paymentMethod,
        bankName: paymentMethod === 'bank' ? selectedBank : null,
        vaNumber: paymentMethod === 'bank' ? `${activeBank.prefix}081234567890` : null,
        shippingAddress: getFormattedAddress(),
      };

      const res = await apiClient.post('/orders', orderPayload);
      const createdOrder = res.data.order;

      // Kosongkan keranjang belanja
      useCartStore.getState().clearCart();

      // Arahkan ke Halaman Menunggu Pembayaran
      navigate('/waiting-payment', {
        state: {
          order: createdOrder,
          orderId: createdOrder.id,
          totalBill: totalTagihan,
          paymentMethod,
          bankName: paymentMethod === 'bank' ? selectedBank : null,
        }
      });
    } catch (err: any) {
      console.error('Gagal membuat pesanan:', err);
      showToast(err.response?.data?.message || 'Gagal memproses pesanan. Harap coba lagi.', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-52 md:pb-36 font-sans text-left relative">
      {/* Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3.5 flex items-center justify-between">
        <button 
          onClick={() => navigate('/keranjang')} 
          className="text-[#389D9C] hover:bg-teal-50 p-2 rounded-xl transition-colors cursor-pointer"
          aria-label="Kembali ke keranjang"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-center flex-1 pr-8">
          <h1 className="text-base sm:text-lg font-extrabold text-[#194668]">Checkout Pesanan</h1>
          <p className="text-[11px] text-slate-400 font-medium">Lengkapi pengiriman & pembayaran obat</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-5 space-y-4">
        
        {/* SEKSI 1: ALAMAT PENGIRIMAN */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-3xs hover:border-[#389D9C]/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm tracking-wide">
              <div className="w-7 h-7 rounded-full bg-teal-50 text-[#389D9C] flex items-center justify-center">
                <MapPin size={15} />
              </div>
              <span>ALAMAT PENGIRIMAN</span>
            </div>
            {alamat && (
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="text-xs font-bold text-[#389D9C] hover:underline cursor-pointer bg-teal-50/60 px-3 py-1 rounded-full"
              >
                Ubah Alamat
              </button>
            )}
          </div>
          
          {isProfileLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-[#389D9C]" size={20} />
            </div>
          ) : alamat ? (
            <div className="pl-9 space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-800">{profile?.profilIbu?.namaIbu || 'Bunda BumilFit'}</span>
                <span className="text-xs text-slate-400 font-semibold">• {profile?.profilIbu?.nomorWhatsapp || '-'}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-0.5">{getFormattedAddress()}</p>
            </div>
          ) : (
            <div className="py-3 text-center pl-0 sm:pl-9">
              <p className="text-xs text-slate-400 font-semibold mb-2.5">Bunda belum memasukkan alamat tujuan pengiriman.</p>
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-[#389D9C] hover:bg-[#2E8281] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-3xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah Alamat Sekarang</span>
              </button>
            </div>
          )}
        </div>

        {/* SEKSI 2: RINGKASAN PRODUK */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-3xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm tracking-wide">
              <div className="w-7 h-7 rounded-full bg-teal-50 text-[#389D9C] flex items-center justify-center font-bold text-xs">
                {cartItems.length}
              </div>
              <span>PRODUK YANG DIBELI</span>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)} Total Item
            </span>
          </div>

          <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto bumil-scrollbar pr-1">
            {cartItems.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center gap-3 first:pt-0 last:pb-0">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">{item.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatRupiah(item.price)} <span className="font-bold text-slate-600">× {item.quantity}</span>
                  </p>
                </div>
                <div className="font-black text-slate-700 text-xs text-right whitespace-nowrap">
                  {formatRupiah(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEKSI 3: METODE PENGIRIMAN (INDONESIA STANDARD) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-3xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm tracking-wide">
              <div className="w-7 h-7 rounded-full bg-teal-50 text-[#389D9C] flex items-center justify-center">
                <Truck size={15} />
              </div>
              <span>PILIHAN PENGIRIMAN</span>
            </div>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
              {selectedShipping.etd}
            </span>
          </div>

          {/* Tab Filter Ekspedisi Sederhana */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 bumil-scrollbar">
            {[
              { id: 'semua', label: 'Semua Kurir' },
              { id: 'reguler', label: 'Reguler (1-2 Hari)' },
              { id: 'instant', label: 'Instant (Hari Ini)' },
              { id: 'hemat', label: 'Hemat' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setShippingCategoryTab(tab.id as any)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  shippingCategoryTab === tab.id
                    ? 'bg-[#194668] text-white shadow-3xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Daftar Kartu Kurir Langsung Pilih */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto bumil-scrollbar pr-1">
            {filteredShippingOptions.map((shipping) => {
              const isSelected = selectedShippingId === shipping.id;

              return (
                <div
                  key={shipping.id}
                  onClick={() => setSelectedShippingId(shipping.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                    isSelected
                      ? 'border-[#389D9C] bg-teal-50/20 shadow-3xs ring-1 ring-[#389D9C]/30'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Radio Indicator */}
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-[#389D9C] bg-[#389D9C]' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                          {shipping.name}
                        </span>
                        {shipping.badge && (
                          <span className="text-[9px] font-extrabold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                            {shipping.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-slate-500">
                          <Clock size={11} className="text-teal-600" />
                          {shipping.etd}
                        </span>
                        <span>•</span>
                        <span className="truncate">{shipping.description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tarif Ongkir */}
                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-xs sm:text-sm text-[#389D9C]">
                      {formatRupiah(shipping.price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SEKSI 4: METODE PEMBAYARAN POPULER INDONESIA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-3xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm tracking-wide mb-3.5">
            <div className="w-7 h-7 rounded-full bg-teal-50 text-[#389D9C] flex items-center justify-center">
              <CreditCard size={15} />
            </div>
            <span>METODE PEMBAYARAN</span>
          </div>

          <div className="space-y-3 text-left">
            {/* 1. QRIS (Semua E-Wallet & Bank) */}
            <div
              onClick={() => setPaymentMethod('qris')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                paymentMethod === 'qris'
                  ? 'border-[#389D9C] bg-teal-50/20 shadow-3xs ring-1 ring-[#389D9C]/30'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === 'qris' ? 'border-[#389D9C] bg-[#389D9C]' : 'border-slate-300 bg-white'
                }`}>
                  {paymentMethod === 'qris' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800">
                      QRIS (Semua E-Wallet & Mobile Banking)
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Instan & Bebas Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Scan via GoPay, OVO, DANA, ShopeePay, BCA Mobile, Livin' Mandiri, BRImo, dll.
                  </p>
                </div>
              </div>

              {paymentMethod === 'qris' && (
                <div className="mt-3 pt-3 border-t border-teal-100/60 space-y-2.5">
                  
                  {/* Mini Issuer Badges */}
                  <div className="flex flex-wrap items-center gap-1 text-[9px] font-bold text-slate-500">
                    <span className="text-[9px] font-extrabold text-slate-400 mr-0.5 uppercase tracking-wider">Mendukung:</span>
                    <span className="bg-sky-50 text-sky-700 border border-sky-200/80 px-2 py-0.5 rounded">GoPay</span>
                    <span className="bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded">OVO</span>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded">DANA</span>
                    <span className="bg-orange-50 text-orange-700 border border-orange-200/80 px-2 py-0.5 rounded">ShopeePay</span>
                    <span className="bg-red-50 text-red-700 border border-red-200/80 px-2 py-0.5 rounded">LinkAja</span>
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">BCA</span>
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">Livin'</span>
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">BRImo</span>
                    <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">+Semua M-Banking</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Transfer Virtual Account (VA Otomatis) */}
            <div
              onClick={() => setPaymentMethod('bank')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                paymentMethod === 'bank'
                  ? 'border-[#389D9C] bg-teal-50/20 shadow-3xs ring-1 ring-[#389D9C]/30'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === 'bank' ? 'border-[#389D9C] bg-[#389D9C]' : 'border-slate-300 bg-white'
                }`}>
                  {paymentMethod === 'bank' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800">
                      Transfer Virtual Account (VA)
                    </span>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      Verifikasi Otomatis 24 Jam
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Nomor rekening khusus virtual account bank tanpa perlu upload bukti struk.
                  </p>
                </div>
              </div>

              {/* Pilihan Bank Populer Indonesia */}
              {paymentMethod === 'bank' && (
                <div className="mt-3 pt-3 border-t border-teal-100/60 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Pilih Bank Tujuan:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BANK_OPTIONS.map((bank) => {
                      const isBankActive = selectedBank === bank.id;
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBank(bank.id);
                          }}
                          className={`p-2 rounded-xl text-xs font-bold text-center border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isBankActive
                              ? 'bg-[#194668] text-white border-[#194668] shadow-3xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Building2 size={13} className={isBankActive ? 'text-teal-300' : 'text-slate-400'} />
                          <span>{bank.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. COD (Bayar di Tempat) */}
            <div
              onClick={() => setPaymentMethod('cod')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                paymentMethod === 'cod'
                  ? 'border-[#389D9C] bg-teal-50/20 shadow-3xs ring-1 ring-[#389D9C]/30'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === 'cod' ? 'border-[#389D9C] bg-[#389D9C]' : 'border-slate-300 bg-white'
                }`}>
                  {paymentMethod === 'cod' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800">
                      COD (Bayar Tunai di Tempat)
                    </span>
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                      Bayar Pas Barang Tiba
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Bayar langsung tunai kepada kurir saat pesanan obat diterima di rumah.
                  </p>
                </div>
              </div>

              {paymentMethod === 'cod' && (
                <div className="mt-3 pt-3 border-t border-teal-100/60 flex items-center gap-2 text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-lg">
                  <Banknote size={18} className="text-amber-600 flex-shrink-0" />
                  <span className="text-[11px] font-medium text-amber-900">
                    Mohon siapkan uang tunai pas sebesar <strong className="font-black text-[#194668]">{formatRupiah(totalTagihan)}</strong> saat kurir mengantar paket.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEKSI 5: RINCIAN PEMBAYARAN */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-3xs space-y-2.5">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>Subtotal Produk ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} barang)</span>
            <span className="text-slate-800 font-bold">{formatRupiah(subtotalProduk)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>Ongkos Kirim ({selectedShipping.name})</span>
            <span className="text-slate-800 font-bold">{formatRupiah(shippingFee)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <div className="flex items-center gap-1.5">
              <span>PPN (5%)</span>
            </div>
            <span className="text-slate-800 font-bold">{formatRupiah(ppn)}</span>
          </div>
          <div className="h-[1px] bg-slate-100 my-1" />
          <div className="flex justify-between items-center pt-0.5">
            <div>
              <span className="text-sm font-extrabold text-slate-800 block">Total Pembayaran</span>
              <span className="text-[11px] text-slate-400 font-medium">Termasuk PPN 5% (Obat & Ongkir)</span>
            </div>
            <span className="text-lg font-black text-[#389D9C]">{formatRupiah(totalTagihan)}</span>
          </div>
        </div>

      </div>

      {/* STICKY BOTTOM BAR (TOMBOL BAYAR SEKARANG) */}
      <div className="fixed bottom-[calc(65px+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-8px_25px_rgba(0,0,0,0.05)] px-4 py-3 sm:py-3.5 sm:px-8 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tagihan</span>
            <span className="text-lg sm:text-xl font-black text-[#389D9C] leading-none mt-0.5 block">
              {formatRupiah(totalTagihan)}
            </span>
          </div>
          <button 
            type="button"
            onClick={handleCheckoutSubmit}
            disabled={!alamat || isSubmittingOrder}
            className="flex-1 max-w-[220px] bg-[#389D9C] hover:bg-[#2E8281] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 sm:py-3.5 rounded-full font-extrabold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer flex justify-center items-center gap-2"
          >
            {isSubmittingOrder ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Bayar Sekarang</span>
                <ChevronRight size={16} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL EDIT/TAMBAH ALAMAT */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-[1.75rem] sm:rounded-[2rem] w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col">

            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-base">
                {alamat ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Pengiriman'}
              </h3>
              <button 
                onClick={() => setIsAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddress} className="p-5 sm:p-6 space-y-3.5 text-left">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Alamat Lengkap (Jalan, RT/RW, No. Rumah)
                </label>
                <textarea 
                  value={formAlamat.jalan}
                  onChange={(e) => setFormAlamat(prev => ({ ...prev, jalan: e.target.value }))}
                  placeholder="Ketik alamat lengkap pengiriman..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#389D9C] focus:ring-2 focus:ring-[#389D9C]/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-slate-400 font-semibold focus:outline-none transition-all resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Kota / Kabupaten
                  </label>
                  <input 
                    type="text"
                    value={formAlamat.kota}
                    onChange={(e) => setFormAlamat(prev => ({ ...prev, kota: e.target.value }))}
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#389D9C] focus:ring-2 focus:ring-[#389D9C]/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-gray-800 placeholder-slate-400 font-semibold focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Provinsi
                  </label>
                  <input 
                    type="text"
                    value={formAlamat.provinsi}
                    onChange={(e) => setFormAlamat(prev => ({ ...prev, provinsi: e.target.value }))}
                    placeholder="Contoh: DKI Jakarta"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#389D9C] focus:ring-2 focus:ring-[#389D9C]/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-gray-800 placeholder-slate-400 font-semibold focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Kode Pos
                </label>
                <input 
                  type="text"
                  value={formAlamat.kodePos}
                  onChange={(e) => setFormAlamat(prev => ({ ...prev, kodePos: e.target.value }))}
                  placeholder="Contoh: 12345"
                  maxLength={5}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#389D9C] focus:ring-2 focus:ring-[#389D9C]/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-gray-800 placeholder-slate-400 font-semibold focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSavingAddress}
                  className="bg-[#389D9C] hover:bg-[#2E8281] disabled:bg-[#389D9C]/60 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-3xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingAddress ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    'Simpan Alamat'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
