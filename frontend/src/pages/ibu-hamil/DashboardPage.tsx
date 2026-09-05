import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Jumbotron } from '../../components/dashboard/Jumbotron';
import { TodoListCard } from '../../components/dashboard/TodoListCard';
import { Button } from '../../components/ui/button';
import { ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { BubunAiWidget } from '../../components/dashboard/BubunAiWidget';
import foodScannerMockup from '../../assets/food_scanner_mockup.png';
import { useLoadingStore } from '../../store/useLoadingStore';
import { PageSkeletonLoader } from '../../components/common/PageSkeletonLoader';

export const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { isLoginLoading, hideLoginLoader } = useLoadingStore();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        setProfile(response.data);

        // Jika akun yang login adalah Administrator WhatsApp, langsung arahkan ke halaman gateway
        if (response.data.role === 'WHATSAPP_ADMIN') {
          navigate('/whatsapp-gateway', { replace: true });
          return;
        }

        // Pengecekan status skrining: Cek database (primary) lalu fallback ke isolated localStorage
        const userId = response.data.profilIbu?.userId || response.data.id;
        const sudahSkrining = response.data.profilIbu?.sudahSkrining === true || 
                              localStorage.getItem(`skrining_selesai_${userId}`) === 'true';

        if (response.data.role === 'IBU_HAMIL' && !sudahSkrining) {
          navigate('/skrining');
        }
      } catch (error) {
        console.error('Gagal mengambil data profil:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
        // Sembunyikan loading fullscreen setelah data profil & dashboard siap
        setTimeout(() => {
          hideLoginLoader();
        }, 1100);
      }
    };
    fetchProfile();
  }, [navigate, hideLoginLoader]);

  // Tampilan Skeleton Loading abu-abu agar layar tidak kosong dan data tidak tiba-tiba berubah
  if (isLoading) {
    if (isLoginLoading) {
      return null; // Ditutupi oleh FullscreenLoginLoader
    }
    return <PageSkeletonLoader />;
  }

  // Tampilan Utama setelah data siap
  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 mt-4 sm:mt-6 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        
        <Jumbotron profilIbu={profile?.profilIbu} />
        
        <TodoListCard profilIbu={profile?.profilIbu} userId={profile?.id} />
        
        {/* Banner Fitur Kalkulator Gizi & Cek Gizi Makanan (AI Food Scanner) */}
        <div className="bg-gradient-to-br from-[#D5ECE6] via-[#EBF5F2] to-[#F7FCFB] rounded-[1.5rem] md:rounded-[2rem] border border-[#389D9C]/20 shadow-[0_20px_45px_rgba(25,70,104,0.06)] flex flex-col md:flex-row items-center justify-between overflow-hidden hover:shadow-[0_25px_50px_rgba(25,70,104,0.12)] transition-all duration-300">
          {/* Kolom Kanan: Visual Perangkat & Informasi (Mockup) - Di atas pada HP */}
          <div className="order-1 md:order-2 w-full md:w-[48%] flex items-center md:items-end justify-center px-4 pt-5 pb-1 sm:pb-6 md:pb-0 md:pt-0 md:px-0 md:pr-10">
            <img 
              src={foodScannerMockup} 
              alt="AI Food Scanner Mockup" 
              className="w-full max-w-[210px] sm:max-w-[280px] md:max-w-md h-auto object-contain hover:scale-102 transition-transform duration-500 ease-out"
            />
          </div>

          {/* Kolom Kiri: Teks & Action - Di bawah pada HP */}
          <div className="order-2 md:order-1 px-5 pt-2 pb-6 sm:p-8 md:p-10 flex-1 text-left space-y-2.5 sm:space-y-4 max-w-xl w-full">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#194668] leading-tight tracking-tight">
              Kalkulator Gizi & Cek Gizi Makanan
            </h3>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Hitung kebutuhan gizi harian dan cek kandungan gizi makanan atau minumanmu dengan kamera atau upload gambar.
            </p>
            <div className="pt-1 sm:pt-2">
              <Button 
                onClick={() => navigate('/cek-gizi')} 
                className="bg-[#389D9C] hover:bg-[#2E8281] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-sm sm:text-base group w-full sm:w-auto cursor-pointer"
              >
                Mulai Sekarang
                <ArrowRight className="w-4 h-4 sm:w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

      </div>


      {/* Floating Chatbot Bubun AI Widget */}
      <BubunAiWidget />
    </>
  );
};

