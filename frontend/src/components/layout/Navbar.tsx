import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Crown, User, Key, LogOut, ChevronDown, LayoutDashboard, MessageSquare, ShoppingBag, Users } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../../lib/apiClient';
import { UserAvatar } from '../common/UserAvatar';
import { useSubscription } from '../../context/SubscriptionContext';
import logoBumilfit from '../../assets/logo-bumilfit.png';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasActiveSubscription, planBadge } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<{ namaIbu: string; email: string; fotoProfil: string | null } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/chat', label: 'Hubungi Dokter' },
    { to: '/belanja-obat', label: 'Belanja Obat' },
    { to: '/komunitas', label: 'Komunitas' },
  ];

  // Ref dan state untuk mengukur & menggeser lingkaran oval hijau secara mulus
  const navContainerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateIndicator = useCallback(() => {
    const activeIndex = navLinks.findIndex((link) => {
      if (link.to === '/') return location.pathname === '/' || location.pathname === '';
      return location.pathname.startsWith(link.to);
    });

    if (activeIndex !== -1) {
      const activeEl = linkRefs.current[activeIndex];
      const containerEl = navContainerRef.current;
      if (activeEl && containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          left: elRect.left - containerRect.left,
          width: elRect.width,
          opacity: 1,
        });
        return;
      }
    }
    // Sembunyikan jika berada di halaman luar navigasi utama (misal /pricing atau /profil)
    setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
  }, [location.pathname]);

  useEffect(() => {
    updateIndicator();
    const frameId = requestAnimationFrame(updateIndicator);
    return () => cancelAnimationFrame(frameId);
  }, [location.pathname, updateIndicator]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

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

  // Konfigurasi Bottom Navigation mobile (4 menu utama)
  const bottomNavLinks = [
    { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/chat', label: 'Dokter', Icon: MessageSquare },
    { to: '/belanja-obat', label: 'Apotek', Icon: ShoppingBag },
    { to: '/komunitas', label: 'Komunitas', Icon: Users },
  ];

  return (
    <>
    <nav className="sticky top-0 z-50 bg-white border-b border-[#194668]/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Bagian Kiri: Identitas Merek (Logo Gambar BUMILFIT) */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center hover:opacity-90 transition-opacity" aria-label="BUMILFIT Home">
              <img 
                src={logoBumilfit} 
                alt="BUMILFIT" 
                className="h-8 sm:h-9 w-auto object-contain select-none" 
                loading="eager"
              />
            </Link>
          </div>

          {/* Bagian Tengah: Menu Navigasi Horizontal (Hanya Oval Hijau, Tanpa Background Abu-abu, Jarak Lebih Lebar) */}
          <div 
            ref={navContainerRef}
            className="hidden md:flex items-center relative gap-2 lg:gap-3"
          >
            {/* Lingkaran Oval Hijau yang Bergeser Mulus (Sliding Pill Indicator) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#389D9C] rounded-full pointer-events-none shadow-[0_3px_12px_rgba(56,157,156,0.35)]"
              style={{
                transform: `translate3d(${indicatorStyle.left}px, 0, 0)`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
              }}
            />

            {navLinks.map((link, idx) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);

              return (
                <NavLink
                  key={link.to}
                  ref={(el) => {
                    linkRefs.current[idx] = el;
                  }}
                  to={link.to}
                  className={`relative z-10 px-5 py-2 text-sm md:text-[14.5px] font-semibold rounded-full transition-colors duration-200 select-none whitespace-nowrap ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-slate-600 hover:text-[#194668]'
                  }`}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </div>

          {/* Bagian Kanan: Premium CTA, Avatar Profil, & Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            <button
              onClick={() => navigate('/pricing')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-semibold transition-all shadow-sm cursor-pointer group text-xs sm:text-sm ${
                hasActiveSubscription
                  ? 'bg-gradient-to-r from-[#194668] to-[#389D9C] text-white ring-2 ring-[#75D5D4]/40 shadow-md'
                  : location.pathname === '/pricing'
                  ? 'bg-gradient-to-r from-[#194668] to-[#389D9C] text-white ring-2 ring-[#389D9C]/50 shadow-md scale-105'
                  : 'bg-[#389D9C] hover:bg-[#2E8281] text-white hover:shadow-md hover:scale-102'
              }`}
            >
              <Crown
                size={17}
                className={`transition-transform duration-200 group-hover:scale-110 ${
                  hasActiveSubscription || location.pathname === '/pricing' ? 'text-amber-300' : 'text-white'
                }`}
                fill="currentColor"
              />
              <span className="hidden sm:inline">
                {hasActiveSubscription ? (planBadge || 'Premium') : 'Langganan'}
              </span>
            </button>
            
            {/* Avatar Trigger & Dropdown */}
            <div ref={dropdownRef} className="relative flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 focus:outline-none p-1 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label="Menu profil"
              >
                <UserAvatar
                  size="md"
                  src={profile?.fotoProfil}
                  name={profile?.namaIbu}
                />
                <ChevronDown size={14} className={`hidden md:block text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
                  <UserAvatar
                    size="md"
                    src={profile?.fotoProfil}
                    name={profile?.namaIbu}
                  />
                  <div className="flex flex-col min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-800 truncate">{profile?.namaIbu || 'Pengguna'}</span>
                      {hasActiveSubscription && (
                        <span className="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-[#389D9C] to-[#75D5D4] text-white text-[9px] font-black uppercase tracking-wider shrink-0">
                          {planBadge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="px-1.5 py-1">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/profil');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#389D9C]/10 hover:text-[#389D9C] rounded-xl transition-all duration-150 cursor-pointer text-left"
                    role="menuitem"
                  >
                    <User size={16} className="text-[#389D9C]" />
                    <span>Profil Anda</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/kata-sandi');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#389D9C]/10 hover:text-[#389D9C] rounded-xl transition-all duration-150 cursor-pointer text-left"
                    role="menuitem"
                  >
                    <Key size={16} className="text-[#389D9C]" />
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
    </nav>

      {/* ===== BOTTOM NAVIGATION BAR — HANYA MOBILE (md:hidden) ===== */}
      {/* Sembunyikan navigasi bawah pada /chat agar tombol ketik pesan dokter tampil leluasa di bagian bawah */}
      {!location.pathname.startsWith('/chat') && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100/80 shadow-[0_-4px_20px_rgba(25,70,104,0.07)] safe-area-pb"
          aria-label="Navigasi utama mobile"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-stretch justify-around px-1 py-1.5">
            {bottomNavLinks.map(({ to, label, Icon }) => {
              const isActive =
                to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(to);

              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-all duration-200 min-h-[52px] ${
                    isActive
                      ? 'text-[#389D9C]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  aria-label={label}
                >
                  <div className={`relative flex items-center justify-center ${
                    isActive ? 'scale-105' : ''
                  } transition-transform duration-200`}>
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className="transition-all duration-200"
                    />
                  </div>
                  <span className={`text-[10px] font-semibold leading-tight mt-0.5 ${
                    isActive ? 'font-bold text-[#389D9C]' : ''
                  }`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};

