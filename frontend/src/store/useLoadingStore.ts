import { create } from 'zustand';

interface LoadingState {
  isLoginLoading: boolean;
  showLoginLoader: () => void;
  hideLoginLoader: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoginLoading: typeof window !== 'undefined' && sessionStorage.getItem('bumilfit_login_loading') === 'true',
  showLoginLoader: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bumilfit_login_loading', 'true');
    }
    set({ isLoginLoading: true });
  },
  hideLoginLoader: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bumilfit_login_loading');
    }
    set({ isLoginLoading: false });
  },
}));
