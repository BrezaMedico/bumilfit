import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description?: string;
}

interface CartState {
  items: CartItem[];
  addToCart: (product: { id: number; name: string; price: string | number; image: string; category?: string; description?: string }) => void;
  updateQuantity: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const parsePrice = (priceInput: string | number): number => {
  if (typeof priceInput === 'number') return priceInput;
  const clean = priceInput.replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (product) => {
        const priceNum = parsePrice(product.price);
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: product.id,
                name: product.name,
                price: priceNum,
                quantity: 1,
                image: product.image,
                description: product.description || product.category || '',
              },
            ],
          };
        });
      },
      updateQuantity: (id, delta) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id) {
              const newQty = item.quantity + delta;
              return { ...item, quantity: newQty > 0 ? newQty : 1 };
            }
            return item;
          }),
        }));
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'bumilfit-cart-storage',
    }
  )
);
