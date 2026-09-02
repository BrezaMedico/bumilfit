import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Jumbotron } from '../../components/dashboard/Jumbotron';
import { TodoListCard } from '../../components/dashboard/TodoListCard';
import { Button } from '../../components/ui/button';
import { ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { BubunAiWidget } from '../../components/dashboard/BubunAiWidget';
import foodScannerMockup from '../../assets/food_scanner_mockup.png';

export const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        setProfile(response.data);

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
      }
    };
    fetchProfile();
  }, [navigate]);

  // Tampilan Skeleton Loading agar layar tidak kosong
  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pb-24 max-w-6xl mx-auto mt-6 space-y-8 animate-pulse">
        {/* Skeleton Jumbotron */}
        <div className="bg-gray-200 h-[180px] rounded-2xl w-full"></div>
        
        {/* Skeleton TodoList */}
        <div className="bg-gray-200 h-[300px] rounded-2xl w-full"></div>
      </div>
    );
  }

  // Tampilan Utama setelah data siap
  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 pb-24 max-w-6xl mx-auto mt-6 space-y-8 animate-in fade-in duration-500">
        
        <Jumbotron profilIbu={profile?.profilIbu} />
        
        <TodoListCard profilIbu={profile?.profilIbu} userId={profile?.id} />
        
        {/* Banner Fitur Kalkulator Gizi & Cek Gizi Makanan (AI Food Scanner) */}
        <div className="bg-gradient-to-br from-[#D5ECE6] via-[#EBF5F2] to-[#F7FCFB] rounded-[1.5rem] md:rounded-[2rem] border border-[#3EA7A2]/20 shadow-[0_20px_45px_rgba(44,83,86,0.06)] flex flex-col md:flex-row items-center justify-between overflow-hidden hover:shadow-[0_25px_50px_rgba(44,83,86,0.12)] transition-all duration-300">
          {/* Kolom Kiri: Teks & Action */}
          <div className="p-6 sm:p-8 md:p-10 flex-1 text-left space-y-4 max-w-xl">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#2C5356] leading-tight tracking-tight">
              Kalkulator Gizi & Cek Gizi Makanan
            </h3>
            <p className="text-sm sm:text-base text-[#4C6A6D] font-normal leading-relaxed">
              Hitung kebutuhan gizi harian dan cek kandungan gizi makanan atau minumanmu dengan kamera atau upload gambar.
            </p>
            <div className="pt-2">
              <Button 
                onClick={() => navigate('/cek-gizi')} 
                className="bg-[#3EA7A2] hover:bg-[#34918c] text-white px-6 sm:px-8 py-5 sm:py-6 rounded-full font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-sm sm:text-base group"
              >
                Mulai Sekarang
                <ArrowRight className="w-4 h-4 sm:w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
          
          {/* Kolom Kanan: Visual Perangkat & Informasi (Mockup) */}
          <div className="w-full md:w-[48%] flex items-end justify-center px-6 pb-6 md:pb-0 md:px-0 md:pr-10">
            <img 
              src={foodScannerMockup} 
              alt="AI Food Scanner Mockup" 
              className="w-full max-w-[320px] md:max-w-md h-auto object-contain hover:scale-102 transition-transform duration-500 ease-out"
            />
          </div>
        </div>

      </div>

      {/* Floating Chatbot Bubun AI Widget */}
      <BubunAiWidget />
    </>
  );
};

