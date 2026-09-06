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
  const searchParams = new URLSearchParams(location.search);
  const isInsideDoctorChat = location.pathname.startsWith('/chat') && (searchParams.has('id') || searchParams.has('matching'));
  const isChat = location.pathname.startsWith('/chat');
  const [isPageChanging, setIsPageChanging] = useState(false);
  const previousPathRef = useRef(location.pathname);

  // Efek transisi loading abu-abu saat ganti halaman / ganti tampilan
  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname;
      if (!isInsideDoctorChat) {
        setIsPageChanging(true);
        window.scrollTo(0, 0);
        const timer = setTimeout(() => {
          setIsPageChanging(false);
        }, 320); // Menahan transisi abu-abu agar database tidak tiba-tiba berubah secara kasar

        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, isInsideDoctorChat]);

  return (
    <SubscriptionProvider>
      <div className={`bg-[#F8FAFC] flex flex-col ${isInsideDoctorChat ? 'h-screen h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen justify-between'}`}>
        <Navbar />

        {/* Indikator Progres Bar Halus di Bawah Navbar */}
        {isPageChanging && (
          <div className="fixed top-16 left-0 right-0 z-40 h-0.5 bg-gradient-to-r from-transparent via-[#389D9C] to-transparent animate-pulse" />
        )}

        <main className={`w-full flex-1 flex flex-col ${
          isInsideDoctorChat 
            ? 'min-h-0 h-[calc(100vh-4rem)] h-[calc(100dvh-4rem)] overflow-hidden p-0 max-w-full' 
            : isChat 
            ? 'max-w-4xl mx-auto p-4 sm:p-6 pb-24 md:pb-8' 
            : 'max-w-6xl mx-auto'
        }`}>
          {isPageChanging ? (
            <PageSkeletonLoader />
          ) : (
            <div className={`animate-in fade-in duration-300 w-full flex-1 flex flex-col min-h-0 ${isInsideDoctorChat ? 'h-full overflow-hidden' : ''}`}>
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
