import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Crown, User, Settings, Key, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../lib/apiClient';
import { PricingModal } from '../pricing/PricingModal';

export const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [profile, setProfile] = useState<{ namaIbu: string; email: string; fotoProfil: string | null } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/chat', label: 'Hubungi Dokter' },
    { to: '/belanja-obat', label: 'Belanja Obat' },
    { to: '/komunitas', label: 'Komunitas' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        const userData = response.data;
        const profil = userData.profilIbu;
        setProfile({
          namaIbu: profil?.namaIbu || 'Ibu Hamil',
          email: userData.email || '',
          fotoProfil: profil?.fotoProfil || null,
        });
      } catch (err) {
        console.error('Gagal memuat profil di navbar:', err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout gagal:', err);
    }
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#194668]/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Bagian Kiri: Identitas Merek */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-[#389D9C] tracking-tight">
              BumilFit
            </Link>
          </div>

          {/* Bagian Tengah: Menu Navigasi Horizontal */}
          <div className="hidden md:flex items-center space-x-8 h-full">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `relative flex items-center h-full text-sm md:text-base font-medium transition-colors duration-200 ${
                    isActive ? 'text-[#194668]' : 'text-[#2D3748] hover:text-[#389D9C]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="py-2">{link.label}</span>
                    {/* Garis bawah aktif dengan animasi transisi geser/fade */}
                    <span
                      className={`absolute bottom-0 left-0 right-0 h-[3px] bg-[#194668] rounded-t-full transition-all duration-300 transform origin-left ${
                        isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Bagian Kanan: Premium CTA & Avatar Profil */}
          <div className="flex items-center gap-4 relative">
            <button 
              type="button"
              onClick={() => setIsPricingOpen(true)}
              className="flex items-center gap-2 bg-[#389D9C] hover:bg-[#2C7E7D] text-white px-5 py-2 rounded-xl font-medium transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Crown size={18} className="text-white" fill="currentColor" />
              <span className="hidden sm:inline">Premium</span>
            </button>
            
            {/* Avatar Trigger & Dropdown */}
            <div ref={dropdownRef} className="relative flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 focus:outline-none p-1 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label="Menu profil"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-[#389D9C]/10 text-[#389D9C] font-bold shadow-sm">
                  {profile?.fotoProfil ? (
                    <img src={profile.fotoProfil} alt={profile.namaIbu} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">
                      {profile?.namaIbu ? profile.namaIbu.charAt(0).toUpperCase() : <User size={18} />}
                    </span>
                  )}
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute right-0 top-[100%] mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 py-2 origin-top-right transition-all duration-200 ease-out transform ${
                  isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                }`}
                role="menu"
                aria-orientation="vertical"
              >
                {/* Header Dropdown */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-[#389D9C]/10 text-[#389D9C] font-bold shadow-sm">
                    {profile?.fotoProfil ? (
                      <img src={profile.fotoProfil} alt={profile.namaIbu} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">
                        {profile?.namaIbu ? profile.namaIbu.charAt(0).toUpperCase() : <User size={18} />}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-gray-800 truncate">{profile?.namaIbu || 'Pengguna'}</span>
                    <span className="text-xs text-gray-400 truncate">{profile?.email || ''}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="px-1.5 py-1">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/profil');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-[#389D9C]/10 hover:text-[#389D9C] rounded-xl transition-all duration-150 cursor-pointer"
                    role="menuitem"
                  >
                    <User size={16} />
                    <span>Profil Anda</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/pengaturan');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-[#389D9C]/10 hover:text-[#389D9C] rounded-xl transition-all duration-150 cursor-pointer"
                    role="menuitem"
                  >
                    <Settings size={16} />
                    <span>Pengaturan</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/profil');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-[#389D9C]/10 hover:text-[#389D9C] rounded-xl transition-all duration-150 cursor-pointer"
                    role="menuitem"
                  >
                    <Key size={16} />
                    <span>Kata Sandi</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-1"></div>

                {/* Logout Button */}
                <div className="px-1.5 py-1">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-150 cursor-pointer"
                    role="menuitem"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Modal Daftar Harga Premium */}
      <PricingModal 
        isOpen={isPricingOpen} 
        onClose={() => setIsPricingOpen(false)} 
      />
    </nav>
  );
};
