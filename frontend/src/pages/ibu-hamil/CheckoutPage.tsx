import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, CreditCard, Plus, Loader2, X, ChevronDown } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { apiClient } from '../../lib/apiClient';

interface AddressData {
  jalan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
}

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
  
  // State form alamat
  const [formAlamat, setFormAlamat] = useState<AddressData>({
    jalan: '',
    kota: '',
    provinsi: '',
    kodePos: '',
  });

  // State Kurir & Pengiriman
  const [courierType, setCourierType] = useState<string>(''); // 'gosend' | 'reguler' | ''
  const [courierService, setCourierService] = useState<string>(''); // name of service
  const [shippingFee, setShippingFee] = useState<number>(0);

  // State Metode Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<string>('qris'); // 'qris' | 'bank' | 'cod'
  const [selectedBank, setSelectedBank] = useState<string>('BCA');

  // State Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Format mata uang Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // Fetch profil saat mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        setProfile(response.data);
        const savedAlamat = response.data.profilIbu?.alamat || '';
        setAlamat(savedAlamat);
        
        // Parse alamat jika tersimpan sebagai JSON string
        if (savedAlamat) {
          try {
            const parsed = JSON.parse(savedAlamat);
            setFormAlamat(parsed);
          } catch (e) {
            // Jika bukan JSON, isi saja ke jalan
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

  // Update biaya pengiriman
  const handleCourierTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setCourierType(type);
    setCourierService('');
    setShippingFee(0);
  };

  const handleCourierServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const service = e.target.value;
    setCourierService(service);
    
    // Hitung ongkir
    if (courierType === 'gosend') {
      if (service === 'Sameday') setShippingFee(15000);
      else if (service === 'Instant') setShippingFee(25000);
    } else if (courierType === 'reguler') {
      if (service === 'J&T Express') setShippingFee(10000);
      else if (service === 'JNE Express') setShippingFee(12000);
      else if (service === 'SiCepat') setShippingFee(9000);
    }
  };

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

      // Sinkronisasi state lokal
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

  // Helper untuk memformat tampilan alamat ringkas
  const getFormattedAddress = () => {
    if (!alamat) return '';
    try {
      const parsed = JSON.parse(alamat);
      return `${parsed.jalan}, ${parsed.kota}, ${parsed.provinsi} ${parsed.kodePos}`;
    } catch (e) {
      return alamat;
    }
  };

  const subtotalProduk = getTotalPrice();
  const totalTagihan = subtotalProduk + shippingFee;

  const handleCheckoutSubmit = () => {
    if (!alamat) {
      showToast('Harap masukkan alamat pengiriman terlebih dahulu!', 'warning');
      return;
    }
    if (!courierType || !courierService) {
      showToast('Harap pilih ekspedisi dan layanan pengiriman!', 'warning');
      return;
    }

    // Arahkan ke Halaman Menunggu Pembayaran
    navigate('/waiting-payment', {
      state: {
        totalBill: totalTagihan,
        paymentMethod,
        bankName: paymentMethod === 'bank' ? selectedBank : null,
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40 font-sans text-left relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm w-full px-4">
          <div className={`flex items-center justify-center text-center gap-2 px-4.5 py-3 rounded-2xl border shadow-[0_8px_25px_rgba(0,0,0,0.06)] backdrop-blur-md font-extrabold text-xs tracking-wide ${
            toast.type === 'success' 
              ? 'bg-emerald-500/95 border-emerald-400 text-white' 
              : toast.type === 'error'
                ? 'bg-rose-500/95 border-rose-400 text-white'
                : 'bg-amber-500/95 border-amber-400 text-white'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="sticky top-0 z-30 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/keranjang')} 
          className="text-[#389D9C] hover:bg-teal-50 p-2 rounded-xl transition-colors cursor-pointer"
          aria-label="Kembali ke keranjang"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-10">Checkout</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        
        {/* CARD 1: Alamat Pengiriman */}
        <div className="bg-white rounded-[1.25rem] border border-gray-100 p-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2 font-bold text-gray-800 text-sm tracking-wide">
              <MapPin className="text-[#389D9C] w-5 h-5" />
              <span>ALAMAT PENGIRIMAN</span>
            </div>
            {alamat && (
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="text-xs font-bold text-[#389D9C] hover:underline cursor-pointer"
              >
                Ubah Alamat
              </button>
            )}
          </div>
          
          {isProfileLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-[#389D9C]" size={24} />
            </div>
          ) : alamat ? (
            <div className="space-y-1">
              <p className="font-extrabold text-sm text-gray-800">{profile?.profilIbu?.namaIbu || 'Bunda BumilFit'}</p>
              <p className="text-xs text-gray-400 font-semibold">{profile?.profilIbu?.nomorWhatsapp || '-'}</p>
              <p className="text-sm text-gray-600 leading-relaxed pt-1.5">{getFormattedAddress()}</p>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-gray-400 font-bold mb-3">Bunda belum mengatur alamat pengiriman.</p>
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#389D9C] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:bg-[#2b7f7e] active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={14} />
                Tambah Alamat Baru
              </button>
            </div>
          )}
        </div>

        {/* CARD 2: Daftar Produk Pesanan */}
        <div className="bg-white rounded-[1.25rem] border border-gray-100 p-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 font-bold text-gray-800 text-sm tracking-wide mb-4">
            <span className="w-5 h-5 rounded-full bg-teal-50 text-[#389D9C] flex items-center justify-center font-bold text-xs">{cartItems.length}</span>
            <span>RINGKASAN PESANAN</span>
          </div>

          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.id} className="py-3 flex items-center gap-3.5 first:pt-0 last:pb-0">
                <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-xs truncate leading-snug">{item.name}</h4>
                  <p className="text-[10px] text-gray-400 line-clamp-1">{item.description}</p>
                  <p className="text-[11px] text-[#389D9C] font-extrabold mt-0.5">
                    {formatRupiah(item.price)} <span className="text-gray-400 font-semibold">x {item.quantity}</span>
                  </p>
                </div>
                <div className="font-extrabold text-gray-800 text-xs text-right whitespace-nowrap">
                  {formatRupiah(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 3: Pilihan Opsi Pengiriman */}
        <div className="bg-white rounded-[1.25rem] border border-gray-100 p-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 font-bold text-gray-800 text-sm tracking-wide mb-4.5">
            <Truck className="text-[#389D9C] w-5 h-5" />
            <span>JASA PENGIRIMAN</span>
          </div>

          <div className="space-y-3.5">
            {/* Pilih Jenis Kurir */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Tipe Ekspedisi</label>
              <div className="relative">
                <select 
                  value={courierType} 
                  onChange={handleCourierTypeChange}
                  className="w-full bg-slate-50/70 border border-slate-100 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#389D9C] font-semibold appearance-none cursor-pointer"
                >
                  <option value="">-- Pilih Jenis Kurir --</option>
                  <option value="gosend">Instant / Express (GoSend)</option>
                  <option value="reguler">Reguler</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Pilih Layanan Kurir */}
            {courierType && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Opsi Layanan</label>
                <div className="relative">
                  <select 
                    value={courierService} 
                    onChange={handleCourierServiceChange}
                    className="w-full bg-slate-50/70 border border-slate-100 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#389D9C] font-semibold appearance-none cursor-pointer"
                  >
                    <option value="">-- Pilih Layanan --</option>
                    {courierType === 'gosend' ? (
                      <>
                        <option value="Sameday">GoSend Sameday - Rp15.000</option>
                        <option value="Instant">GoSend Instant - Rp25.000</option>
                      </>
                    ) : (
                      <>
                        <option value="J&T Express">J&T Express - Rp10.000</option>
                        <option value="JNE Express">JNE Express - Rp12.000</option>
                        <option value="SiCepat">SiCepat - Rp9.000</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 4: Pilihan Metode Pembayaran */}
        <div className="bg-white rounded-[1.25rem] border border-gray-100 p-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 font-bold text-gray-800 text-sm tracking-wide mb-4">
            <CreditCard className="text-[#389D9C] w-5 h-5" />
            <span>METODE PEMBAYARAN</span>
          </div>

          <div className="space-y-3">
            {/* Opsi 1: QRIS */}
            <label className={`flex items-start gap-3 p-3.5 border rounded-2xl cursor-pointer transition-colors ${
              paymentMethod === 'qris' ? 'border-[#389D9C] bg-teal-50/10' : 'border-gray-100 hover:bg-slate-50/50'
            }`}>
              <input 
                type="radio" 
                name="payment" 
                checked={paymentMethod === 'qris'}
                onChange={() => setPaymentMethod('qris')}
                className="mt-0.5 accent-[#389D9C]" 
              />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-xs text-gray-800 block">QRIS</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Scan kode QR dinamis menggunakan e-wallet atau aplikasi bank Anda.</span>
                
                {paymentMethod === 'qris' && (
                  <div className="mt-3.5 bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col items-center animate-in fade-in duration-300 max-w-[240px] mx-auto">
                    {/* Mock QRIS Code */}
                    <div className="bg-white p-2.5 border border-gray-200 rounded-xl mb-2 flex items-center justify-center">
                      <svg width="120" height="120" viewBox="0 0 100 100" className="text-slate-800">
                        {/* Mock QR Code Pattern */}
                        <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                        <rect x="8" y="8" width="19" height="19" fill="white" />
                        <rect x="11" y="11" width="13" height="13" fill="currentColor" />
                        
                        <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                        <rect x="73" y="8" width="19" height="19" fill="white" />
                        <rect x="76" y="11" width="13" height="13" fill="currentColor" />
                        
                        <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                        <rect x="8" y="73" width="19" height="19" fill="white" />
                        <rect x="11" y="76" width="13" height="13" fill="currentColor" />
                        
                        <rect x="35" y="35" width="30" height="30" fill="currentColor" />
                        <rect x="40" y="40" width="20" height="20" fill="white" />
                        <rect x="47" y="47" width="6" height="6" fill="currentColor" />
                        
                        <rect x="40" y="10" width="10" height="15" fill="currentColor" />
                        <rect x="55" y="15" width="10" height="10" fill="currentColor" />
                        <rect x="15" y="40" width="15" height="10" fill="currentColor" />
                        <rect x="10" y="55" width="10" height="10" fill="currentColor" />
                        <rect x="75" y="40" width="15" height="20" fill="currentColor" />
                        <rect x="40" y="75" width="25" height="15" fill="currentColor" />
                      </svg>
                    </div>
                    <span className="text-[9px] text-gray-500 font-bold text-center">BumilFit QRIS Merchant</span>
                  </div>
                )}
              </div>
            </label>

            {/* Opsi 2: Transfer Bank */}
            <label className={`flex flex-col gap-3 p-3.5 border rounded-2xl cursor-pointer transition-colors ${
              paymentMethod === 'bank' ? 'border-[#389D9C] bg-teal-50/10' : 'border-gray-100 hover:bg-slate-50/50'
            }`}>
              <div className="flex items-start gap-3">
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'bank'}
                  onChange={() => setPaymentMethod('bank')}
                  className="mt-0.5 accent-[#389D9C]" 
                />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-gray-800 block">Transfer Virtual Account Bank</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Pembayaran via transfer Virtual Account bank lokal ternama.</span>
                </div>
              </div>

              {paymentMethod === 'bank' && (
                <div className="mt-2.5 animate-in fade-in duration-200">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Pilih Bank</label>
                  <div className="relative">
                    <select 
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#389D9C] font-bold appearance-none cursor-pointer"
                    >
                      <option value="BCA">BCA Virtual Account</option>
                      <option value="Mandiri">Mandiri Virtual Account</option>
                      <option value="BRI">BRI Virtual Account</option>
                      <option value="BNI">BNI Virtual Account</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                  </div>
                </div>
              )}
            </label>

            {/* Opsi 3: COD */}
            <label className={`flex items-start gap-3 p-3.5 border rounded-2xl cursor-pointer transition-colors ${
              paymentMethod === 'cod' ? 'border-[#389D9C] bg-teal-50/10' : 'border-gray-100 hover:bg-slate-50/50'
            }`}>
              <input 
                type="radio" 
                name="payment" 
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                className="mt-0.5 accent-[#389D9C]" 
              />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-xs text-gray-800 block">COD (Cash on Delivery)</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Bayar tunai di tempat saat kurir menyerahkan barang Anda.</span>
              </div>
            </label>
          </div>
        </div>

        {/* CARD 5: Rincian Biaya */}
        <div className="bg-white rounded-[1.25rem] border border-gray-100 p-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2 text-xs text-gray-500 font-semibold">
            <span>Subtotal Produk</span>
            <span className="text-gray-800 font-bold whitespace-nowrap">{formatRupiah(subtotalProduk)}</span>
          </div>
          <div className="flex justify-between items-center flex-wrap gap-2 text-xs text-gray-500 font-semibold">
            <span>Biaya Pengiriman</span>
            <span className="text-gray-800 font-bold whitespace-nowrap">{courierService ? formatRupiah(shippingFee) : '-'}</span>
          </div>
          <div className="h-[1px] bg-gray-50 my-1" />
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-sm font-bold text-gray-800">Total Tagihan</span>
            <span className="text-base font-black text-[#389D9C] whitespace-nowrap">{formatRupiah(totalTagihan)}</span>
          </div>
        </div>

      </div>

      {/* CARD 6 (Sticky Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] px-4 py-5 md:px-8 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Tagihan</span>
            <span className="text-lg font-black text-[#389D9C] leading-none mt-1 block">
              {formatRupiah(totalTagihan)}
            </span>
          </div>
          <button 
            onClick={handleCheckoutSubmit}
            disabled={!alamat || !courierType || !courierService}
            className="flex-1 max-w-[200px] bg-[#389D9C] hover:bg-[#2b7f7e] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer flex justify-center items-center"
          >
            Bayar Sekarang
          </button>
        </div>
      </div>

      {/* MODAL EDIT/TAMBAH ALAMAT */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
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
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Alamat Lengkap (Jalan, RT/RW, No. Rumah)</label>
                <textarea 
                  value={formAlamat.jalan}
                  onChange={(e) => setFormAlamat(prev => ({ ...prev, jalan: e.target.value }))}
                  placeholder="Ketik alamat lengkap Anda..."
                  rows={2}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#389D9C] focus:ring-2 focus:ring-[#389D9C]/10 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-slate-400 font-semibold focus:outline-none transition-all resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Kota / Kabupaten</label>
                  <input 
                    type="text"
                    value={formAlamat.kota}
                    onChange={(e) => setFormAlamat(prev => ({ ...prev, kota: e.target.value }))}
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#389D9C] focus:ring-2 focus:ring-[#389D9C]/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-slate-400 font-semibold focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Provinsi</label>
                  <input 
                    type="text"
                    value={formAlamat.provinsi}
                    onChange={(e) => setFormAlamat(prev => ({ ...prev, provinsi: e.target.value }))}
                    placeholder="Contoh: DKI Jakarta"
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#389D9C] focus:ring-2 focus:ring-[#389D9C]/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-slate-400 font-semibold focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Kode Pos</label>
                <input 
                  type="text"
                  value={formAlamat.kodePos}
                  onChange={(e) => setFormAlamat(prev => ({ ...prev, kodePos: e.target.value }))}
                  placeholder="Contoh: 12345"
                  maxLength={5}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#389D9C] focus:ring-2 focus:ring-[#389D9C]/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-slate-400 font-semibold focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSavingAddress}
                  className="bg-[#389D9C] hover:bg-[#2b7f7e] disabled:bg-[#389D9C]/60 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingAddress ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Menyimpan...
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
