import { Search, Plus, ClipboardList, X, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { CartFAB } from '../../components/ecommerce/CartFAB';
import { animateFlyToCart } from '../../lib/animateFlyToCart';
import { apiClient } from '../../lib/apiClient';
import { MEDICINE_PRODUCTS, type MedicineProduct } from '../../data/medicineProducts';

export const EcommercePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [activeDetailProduct, setActiveDetailProduct] = useState<MedicineProduct | null>(null);

  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    const fetchActiveCount = async () => {
      try {
        const res = await apiClient.get('/orders/my-orders');
        const active = (res.data.orders || []).filter(
          (o: any) => o.status !== 'SELESAI' && o.status !== 'DIBATALKAN'
        ).length;
        setActiveOrdersCount(active);
      } catch (err) {
        // Abaikan jika belum login atau error koneksi
      }
    };
    fetchActiveCount();
  }, []);

  const categories = [
    'Semua',
    'Vitamin & Suplemen',
    'Anti Mual & Sirup',
    'Pereda Nyeri & Demam',
    'Pencernaan & Maag'
  ];

  const filteredProducts = MEDICINE_PRODUCTS.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'Semua') return true;
    if (selectedCategory === 'Vitamin & Suplemen') {
      return product.category.includes('Vitamin') || product.category.includes('Asam Folat') || product.category.includes('Mineral') || product.category.includes('Tulang');
    }
    if (selectedCategory === 'Anti Mual & Sirup') {
      return product.category.includes('Mual') || product.name.includes('Doksilamin') || product.name.includes('B6');
    }
    if (selectedCategory === 'Pereda Nyeri & Demam') {
      return product.category.includes('Nyeri') || product.name.includes('Parasetamol');
    }
    if (selectedCategory === 'Pencernaan & Maag') {
      return product.category.includes('Lambung') || product.category.includes('Pencernaan') || product.name.includes('Antasida') || product.name.includes('Laktulosa');
    }
    return true;
  });

  const handleAddToCart = (product: MedicineProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.priceNum,
      image: product.image,
      category: product.category,
      description: product.category,
    });

    animateFlyToCart(e.currentTarget as HTMLElement, 'cart-fab');
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 mobile-bottom-pad pt-6 sm:pt-8 animate-in fade-in duration-500 font-sans text-left">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Search Bar */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#194668] tracking-tight mb-5">
            Apotek & Keperluan Ibu Hamil
          </h1>
          
          <div className="flex items-center justify-center gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#389D9C] focus:border-transparent shadow-[0_2px_15px_rgb(0,0,0,0.03)] transition-all"
                placeholder="Cari nama obat, vitamin, atau keluhan (misal: parasetamol, folat, mual)..."
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {/* Tombol Icon Aktivitas / Riwayat Pesanan */}
            <button
              onClick={() => navigate('/status-pesanan')}
              className="h-12 w-12 sm:h-[48px] sm:w-[48px] rounded-full bg-white border border-gray-200 hover:border-[#389D9C] text-gray-600 hover:text-[#389D9C] flex items-center justify-center shadow-[0_2px_15px_rgb(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shrink-0 relative"
              title="Aktivitas Pembelian"
              aria-label="Aktivitas Pembelian"
            >
              <ClipboardList className="w-5 h-5 text-gray-500 group-hover:text-[#389D9C] transition-colors" />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#389D9C] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                  {activeOrdersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Kategori Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto py-4 mt-2 px-1 bumil-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#194668] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Katalog Produk Berukuran Sama & Seragam */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              return (
                <div 
                  key={product.id} 
                  onClick={() => setActiveDetailProduct(product)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col p-3.5 group cursor-pointer h-full justify-between relative"
                >
                  <div>
                    {/* Area Gambar (Seragam Aspect Square + Padding Presisi + Light Canvas) */}
                    <div className="aspect-square bg-slate-50/70 rounded-xl mb-3 overflow-hidden flex items-center justify-center p-3 relative border border-slate-100/80 group-hover:border-[#389D9C]/30 transition-colors">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        loading="lazy"
                        decoding="async"
                        className="object-contain max-h-full max-w-full w-auto h-auto group-hover:scale-105 transition-transform duration-300 ease-out mix-blend-multiply" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (product.fallbackImage && target.src !== product.fallbackImage) {
                            target.src = product.fallbackImage;
                          }
                        }}
                      />
                    </div>
                    
                    {/* Kategori Produk */}
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-[#389D9C] truncate">
                        {product.category}
                      </span>
                    </div>

                    {/* Judul Produk dengan line-clamp-2 dan min-h tetap */}
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 line-clamp-2 leading-snug mb-2 min-h-[2.4rem]">
                      {product.name}
                    </h3>
                  </div>
                  
                  {/* Footer Kartu (Harga Tertera & Tombol Add to Cart) */}
                  <div className="mt-auto pt-2.5 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">
                        Harga
                      </span>
                      <span className="text-sm sm:text-base font-black text-[#389D9C]">
                        {formatRupiah(product.priceNum)}
                      </span>
                    </div>
                    
                    {/* Tombol Add to Cart Lingkaran */}
                    <button 
                      type="button"
                      onClick={(e) => handleAddToCart(product, e)}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#389D9C] hover:bg-[#2E8281] flex items-center justify-center text-white flex-shrink-0 transition-all shadow-3xs active:scale-95 hover:scale-105 cursor-pointer"
                      aria-label="Tambah ke keranjang"
                      title="Tambah ke keranjang"
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-3xs max-w-md mx-auto p-8 space-y-3">
            <ShoppingBag size={44} className="mx-auto text-slate-300" />
            <h3 className="font-extrabold text-base text-slate-700">Obat Tidak Ditemukan</h3>
            <p className="text-xs text-slate-400">
              Tidak ada obat atau vitamin yang cocok dengan pencarian "{searchQuery}". Silakan coba kata kunci lain.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); }}
              className="mt-2 px-4 py-2 bg-[#389D9C] text-white text-xs font-bold rounded-full hover:bg-[#2E8281] transition-colors cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        )}

      </div>

      {/* MODAL DETAIL PRODUK */}
      {activeDetailProduct && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveDetailProduct(null)}
        >
          <div 
            className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl max-w-md w-full text-left space-y-4 animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Tutup */}
            <button 
              onClick={() => setActiveDetailProduct(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X size={20} />
            </button>

            {/* Gambar Besar */}
            <div className="aspect-square max-h-56 w-full bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100 overflow-hidden mx-auto">
              <img 
                src={activeDetailProduct.image} 
                alt={activeDetailProduct.name}
                className="object-contain max-h-full max-w-full mix-blend-multiply" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (activeDetailProduct.fallbackImage && target.src !== activeDetailProduct.fallbackImage) {
                    target.src = activeDetailProduct.fallbackImage;
                  }
                }}
              />
            </div>

            {/* Header Info */}
            <div className="space-y-1">
              <span className="text-xs text-[#389D9C] font-bold">
                {activeDetailProduct.category}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#194668] leading-snug">
                {activeDetailProduct.name}
              </h2>
            </div>

            {/* Deskripsi & Indikasi */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-1.5 text-xs text-slate-600 leading-relaxed">
              <span className="font-extrabold text-slate-700 block text-[11px] uppercase tracking-wider">
                Indikasi & Manfaat Kehamilan:
              </span>
              <p>{activeDetailProduct.description}</p>
            </div>

            {/* Harga & Tombol Tambah */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block">Total Harga</span>
                <span className="text-xl font-black text-[#389D9C]">
                  {formatRupiah(activeDetailProduct.priceNum)}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  handleAddToCart(activeDetailProduct, e);
                  setActiveDetailProduct(null);
                }}
                className="flex-1 h-11 bg-[#389D9C] hover:bg-[#2E8281] active:scale-95 text-white font-extrabold text-xs sm:text-sm px-3 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Tambah ke Keranjang</span>
              </button>
            </div>

          </div>
        </div>
      )}

      <CartFAB />
    </div>
  );
};
