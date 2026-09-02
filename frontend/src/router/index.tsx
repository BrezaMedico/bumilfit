import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { VerifyOtpPage } from '../pages/auth/VerifyOtpPage';
import { SkriningAwalPage } from '../pages/ibu-hamil/SkriningAwalPage';

import { Navbar } from '../components/layout/Navbar';
import { DashboardPage } from '../pages/ibu-hamil/DashboardPage';
import { ChatPage } from '../pages/ibu-hamil/ChatPage';
import { ProfilPage } from '../pages/ibu-hamil/ProfilPage';
import { EcommercePage } from '../pages/ibu-hamil/EcommercePage';
import { CartPage } from '../pages/ibu-hamil/CartPage';
import { KomunitasPage } from '../pages/ibu-hamil/KomunitasPage';
import { CheckoutPage } from '../pages/ibu-hamil/CheckoutPage';
import { WaitingPaymentPage } from '../pages/ibu-hamil/WaitingPaymentPage';
import { CekGiziPage } from '../pages/ibu-hamil/CekGiziPage';

const ProtectedLayout = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

const router = createBrowserRouter([
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
        path: 'cek-gizi',
        element: <CekGiziPage />,
      },
      // Rute dokter akan ditambahkan di sini nanti
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
