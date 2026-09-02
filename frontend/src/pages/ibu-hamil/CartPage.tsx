import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';

export const CartPage = () => {
  const navigate = useNavigate();
  
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const totalBelanja = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Helper format mata uang
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* HEADER HALAMAN */}
      <div className="sticky top-0 z-10 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="text-[#389D9C] hover:bg-teal-50 p-2 rounded-xl transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex-1 text-center pr-10">Keranjang Saya</h1>
      </div>

      {/* DAFTAR ITEM (Tumpukan Kartu) */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 space-y-4 pb-40">
        
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">Keranjang masih kosong.</p>
            <Link to="/belanja-obat" className="text-[#389D9C] font-bold mt-4 inline-block hover:underline">Mulai Belanja</Link>
          </div>
        ) : (
          cartItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-[1.25rem] shadow-[0_4px_15px_rgb(0,0,0,0.03)] border border-gray-100 p-3 md:p-4 flex flex-col sm:flex-row items-center gap-4 transition-all hover:shadow-[0_6px_20px_rgb(0,0,0,0.06)]"
            >
              
              {/* KIRI & TENGAH: Gambar & Tipografi */}
              <div className="flex items-center gap-4 w-full sm:w-auto sm:flex-1">
                {/* Placeholder Gambar (Persegi dengan sudut membulat) */}
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                
                {/* Kolom Tipografi */}
                <div className="flex flex-col justify-center flex-1">
                  <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight mb-1">{item.name}</h3>
                  <p className="text-xs md:text-sm text-gray-400 font-medium line-clamp-1">{item.description}</p>
                </div>
              </div>

              {/* KANAN: Unit Kontrol, Harga, & Hapus */}
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto bg-gray-50/50 sm:bg-transparent p-2 sm:p-0 rounded-2xl">
                
                {/* Unit Kontrol Kuantitas */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-7 h-7 rounded-full bg-[#389D9C] flex items-center justify-center text-white hover:bg-[#2b7f7e] transition-colors active:scale-95 shadow-sm"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="font-bold text-gray-800 w-5 text-center text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-7 h-7 rounded-full bg-[#389D9C] flex items-center justify-center text-white hover:bg-[#2b7f7e] transition-colors active:scale-95 shadow-sm"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>

                {/* Harga Produk */}
                <div className="font-bold text-[#389D9C] text-sm md:text-base w-24 text-right">
                  {formatRupiah(item.price * item.quantity)}
                </div>

                {/* Ikon Tempat Sampah */}
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-[#389D9C] p-2 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors ml-1"
                  aria-label="Hapus item"
                >
                  <Trash2 size={20} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* AREA RINGKASAN & TOMBOL TINDAKAN (Fixed Bottom) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] px-4 py-5 md:px-8">
          <div className="max-w-3xl mx-auto">
            
            {/* Footer Ringkasan */}
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="font-bold text-gray-800 text-base md:text-lg">Total</span>
              <span className="font-bold text-[#389D9C] text-xl md:text-2xl">{formatRupiah(totalBelanja)}</span>
            </div>
            
            {/* Tombol Tindakan Utama */}
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-[#389D9C] hover:bg-[#2b7f7e] text-white py-4 rounded-[1.25rem] font-bold text-base shadow-sm transition-transform active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer"
            >
              Lanjutkan ke Pembayaran
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
