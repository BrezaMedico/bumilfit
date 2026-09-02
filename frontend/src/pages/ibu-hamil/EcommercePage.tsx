import { Search, Plus } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { CartFAB } from '../../components/ecommerce/CartFAB';
import { animateFlyToCart } from '../../lib/animateFlyToCart';

// --- Dummy Data Produk ---
const DUMMY_PRODUCTS = [
  {
    id: 1,
    name: 'Blackmores Pregnancy & Breast-Feeding Gold',
    category: 'Vitamin & Suplemen',
    price: 'Rp 215.000',
    originalPrice: 'Rp 250.000',
    discount: '14%',
    image: 'https://placehold.co/400x400/e2e8f0/64748b?text=Blackmores'
  },
  {
    id: 2,
    name: 'Folamil Genio 30 Kapsul - Multivitamin Ibu Hamil',
    category: 'Vitamin & Suplemen',
    price: 'Rp 145.000',
    image: 'https://placehold.co/400x400/e2e8f0/64748b?text=Folamil'
  },
  {
    id: 3,
    name: 'Prenagen Mommy Vanilla 400gr',
    category: 'Susu Kehamilan',
    price: 'Rp 85.000',
    originalPrice: 'Rp 92.000',
    discount: '8%',
    image: 'https://placehold.co/400x400/e2e8f0/64748b?text=Prenagen'
  },
  {
    id: 4,
    name: 'Minyak Kutus Kutus Asli 100ml',
    category: 'Perawatan Tubuh',
    price: 'Rp 170.000',
    image: 'https://placehold.co/400x400/e2e8f0/64748b?text=Minyak+Kutus'
  },
  {
    id: 5,
    name: 'Calgae Kalsium Kehamilan (30 Kaplet)',
    category: 'Tulang & Sendi',
    price: 'Rp 110.000',
    image: 'https://placehold.co/400x400/e2e8f0/64748b?text=Calgae'
  },
  {
    id: 6,
    name: 'Folic Acid 400mcg Isi 100 Tablet',
    category: 'Asam Folat',
    price: 'Rp 35.000',
    image: 'https://placehold.co/400x400/e2e8f0/64748b?text=Asam+Folat'
  }
];

export const EcommercePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const addToCart = useCartStore((state) => state.addToCart);

  const filteredProducts = DUMMY_PRODUCTS.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Search Bar (Kapsul Penuh) */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[#194668] mb-6">Apotek & Keperluan Ibu</h1>
          
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#389D9C] focus:border-transparent shadow-[0_2px_15px_rgb(0,0,0,0.03)] transition-all"
              placeholder="Cari obat yang Anda butuhkan..."
            />
          </div>
        </div>

        {/* Grid Katalog Produk (Responsif 2-5 Kolom) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            
            // Container Kartu
            <div 
              key={product.id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col p-3 group cursor-pointer"
            >
              
              {/* Area Gambar (Aspect Square + Inner Radius) */}
              <div className="aspect-square bg-gray-50 rounded-[14px] mb-3 overflow-hidden flex items-center justify-center relative">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="object-contain w-3/4 h-3/4 group-hover:scale-110 transition-transform duration-500 ease-out" 
                  loading="lazy"
                />
                {/* Badge Diskon Opsional */}
                {product.discount && (
                  <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                    {product.discount}
                  </span>
                )}
              </div>
              
              {/* Informasi Produk */}
              <div className="flex flex-col flex-1 px-1">
                <p className="text-[11px] font-medium text-gray-400 mb-1.5">{product.category}</p>
                
                {/* Judul dengan Line Clamp agar rata */}
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-3">
                  {product.name}
                </h3>
                
                {/* Footer Kartu (Harga & Tombol Aksi - Rata Bawah) */}
                <div className="mt-auto flex items-end justify-between">
                  <div className="flex flex-col">
                    {product.originalPrice && (
                      <span className="text-[10px] text-gray-400 line-through mb-0.5">
                        {product.originalPrice}
                      </span>
                    )}
                    <span className="text-[15px] sm:text-base font-bold text-[#389D9C]">
                      {product.price}
                    </span>
                  </div>
                  
                  {/* Tombol Add to Cart Lingkaran */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Mencegah memicu klik pada kartu
                      addToCart(product);
                      animateFlyToCart(e.currentTarget, 'cart-fab');
                    }}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#389D9C] hover:bg-[#2b7f7e] flex items-center justify-center text-white flex-shrink-0 transition-colors shadow-sm active:scale-95"
                    aria-label="Tambah ke keranjang"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
      <CartFAB />
    </div>
  );
};
