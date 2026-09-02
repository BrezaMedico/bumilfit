import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';

export const CartFAB = () => {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const uniqueItemsCount = items.length;

  return (
    <button
      id="cart-fab"
      onClick={() => navigate('/keranjang')}
      className="fixed bottom-8 right-8 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#389D9C] hover:bg-[#2b7f7e] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(56,157,156,0.35)] hover:shadow-[0_15px_35px_rgba(56,157,156,0.5)] hover:-translate-y-0.5 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#389D9C]/30 focus:ring-offset-2"
      aria-label="Keranjang Belanja"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
        {uniqueItemsCount > 0 && (
          <span 
            key={uniqueItemsCount} 
            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] h-[20px] flex items-center justify-center border-2 border-white shadow-sm font-sans animate-bounce-pop"
          >
            {uniqueItemsCount}
          </span>
        )}
      </div>
    </button>
  );
};
