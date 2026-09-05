import { useState, useEffect, useRef } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { VerifyOtpPage } from '../pages/auth/VerifyOtpPage';
import { SkriningAwalPage } from '../pages/ibu-hamil/SkriningAwalPage';
import { WhatsAppGatewayPage } from '../pages/admin/WhatsAppGatewayPage';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { DashboardPage } from '../pages/ibu-hamil/DashboardPage';
import { ChatPage } from '../pages/ibu-hamil/ChatPage';
import { ProfilPage } from '../pages/ibu-hamil/ProfilPage';
import { KataSandiPage } from '../pages/ibu-hamil/KataSandiPage';
import { EcommercePage } from '../pages/ibu-hamil/EcommercePage';
import { CartPage } from '../pages/ibu-hamil/CartPage';
import { KomunitasPage } from '../pages/ibu-hamil/KomunitasPage';
import { CheckoutPage } from '../pages/ibu-hamil/CheckoutPage';
import { WaitingPaymentPage } from '../pages/ibu-hamil/WaitingPaymentPage';
import { CekGiziPage } from '../pages/ibu-hamil/CekGiziPage';
import { PricingPage } from '../pages/ibu-hamil/PricingPage';
import { StatusPesananPage } from '../pages/ibu-hamil/StatusPesananPage';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { ToastContainer } from '../components/ui/Toast';
import { PageSkeletonLoader } from '../components/common/PageSkeletonLoader';
import { FullscreenLoginLoader } from '../components/common/FullscreenLoginLoader';

const ProtectedLayout = () => {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');
  const [isPageChanging, setIsPageChanging] = useState(false);
  const previousPathRef = useRef(location.pathname);

  // Efek transisi loading abu-abu saat ganti halaman / ganti tampilan
  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname;
      if (!isChat) {
        setIsPageChanging(true);
        window.scrollTo(0, 0);
        const timer = setTimeout(() => {
          setIsPageChanging(false);
        }, 320); // Menahan transisi abu-abu agar database tidak tiba-tiba berubah secara kasar

        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, isChat]);

  return (
    <SubscriptionProvider>
      <div className={`min-h-screen bg-[#F8FAFC] flex flex-col justify-between ${isChat ? 'h-screen overflow-hidden' : ''}`}>
        <Navbar />

        {/* Indikator Progres Bar Halus di Bawah Navbar */}
        {isPageChanging && (
          <div className="fixed top-16 left-0 right-0 z-40 h-0.5 bg-gradient-to-r from-transparent via-[#389D9C] to-transparent animate-pulse" />
        )}

        <main className={`w-full flex-1 flex flex-col ${isChat ? 'h-[calc(100vh-4rem)] overflow-hidden p-0 max-w-full' : 'max-w-6xl mx-auto'}`}>
          {isPageChanging ? (
            <PageSkeletonLoader />
          ) : (
            <div className="animate-in fade-in duration-300 w-full flex-1 flex flex-col">
              <Outlet />
            </div>
          )}
        </main>
        {!isChat && <Footer />}
      </div>
    </SubscriptionProvider>
  );
};

const router = createBrowserRouter([
  {
    path: '/whatsapp-gateway',
    element: <WhatsAppGatewayPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/verify-otp',
    element: <VerifyOtpPage />,
  },
  {
    path: '/skrining',
    element: <SkriningAwalPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'komunitas',
        element: <KomunitasPage />,
      },
      {
        path: 'profil',
        element: <ProfilPage />,
      },
      {
        path: 'kata-sandi',
        element: <KataSandiPage />,
      },
      {
        path: 'belanja-obat',
        element: <EcommercePage />,
      },
      {
        path: 'keranjang',
        element: <CartPage />,
      },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'waiting-payment',
        element: <WaitingPaymentPage />,
      },
      {
        path: 'status-pesanan',
        element: <StatusPesananPage />,
      },
      {
        path: 'cek-gizi',
        element: <CekGiziPage />,
      },
      {
        path: 'pricing',
        element: <PricingPage />,
      },
      {
        path: 'premium',
        element: <PricingPage />,
      },
      // Rute dokter akan ditambahkan di sini nanti
    ],
  },
]);

export const AppRouter = () => {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
      <FullscreenLoginLoader />
    </>
  );
};
