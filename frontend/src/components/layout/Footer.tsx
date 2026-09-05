import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import logoBumilfit from '../../assets/logo-bumilfit.png';
import { useCartStore } from '../../store/useCartStore';

export const Footer: React.FC = () => {
  const location = useLocation();
  const cartItemsCount = useCartStore((state) => state.items.length);
  const hasFixedBottomBar = 
    (location.pathname.startsWith('/keranjang') && cartItemsCount > 0) || 
    location.pathname.startsWith('/checkout');

  const footerRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({
    x: 0,
    y: 0,
    isHovered: false,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!footerRef.current) return;
    const rect = footerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isHovered: true,
    });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!footerRef.current) return;
    const rect = footerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isHovered: true,
    });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({
      ...prev,
      isHovered: false,
    }));
  };

  return (
    <footer
      ref={footerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden bg-gradient-to-b from-[#389D9C] via-[#318B8A] to-[#266E6D] border-t border-[#75D5D4]/40 mt-10 sm:mt-16 text-white transition-colors"
    >
      {/* 1. Efek gradasi tipis di hover kursor pada background */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
        style={{
          opacity: mousePos.isHovered ? 1 : 0,
          background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.22), rgba(117, 213, 212, 0.3) 40%, transparent 75%)`,
        }}
      />

      {/* Konten Utama Footer */}
      <div className={`relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 ${hasFixedBottomBar ? 'pb-36 md:pb-32' : 'pb-24 sm:pb-28 md:pb-12'}`}>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
          
          {/* Kolom 1: Brand & Deskripsi */}
          <div className="lg:col-span-4 space-y-3">
            <Link 
              to="/" 
              className="inline-block hover:opacity-90 transition-opacity"
              aria-label="BUMILFIT Home"
            >
              <img 
                src={logoBumilfit} 
                alt="BUMILFIT" 
                className="h-8 sm:h-9 w-auto object-contain brightness-0 invert select-none" 
                loading="lazy"
              />
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-white/90 max-w-sm">
              BumilFit merupakan platform yang membantu ibu hamil dalam memantau dan menjalani perjalanan kehamilan dengan lebih teratur dan mudah.
            </p>
          </div>

          {/* Wrapper Kolom 2 & 3: Di mobile tampil rapi 2 kolom berdampingan, di desktop kembali ke grid masing-masing */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:contents">
            {/* Kolom 2: Produk & Layanan */}
            <div className="lg:col-span-3 space-y-2.5 sm:space-y-3">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                Produk & Layanan
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li>
                  <Link 
                    to="/" 
                    className="text-white/90 hover:text-white md:text-white md:hover:text-[#194668] transition-colors duration-200 inline-block py-0.5 sm:py-0"
                  >
                    Todo Reminder
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/chat" 
                    className="text-white/90 hover:text-white md:text-white md:hover:text-[#194668] transition-colors duration-200 inline-block py-0.5 sm:py-0"
                  >
                    Konsultasi Dokter
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/cek-gizi" 
                    className="text-white/90 hover:text-white md:text-white md:hover:text-[#194668] transition-colors duration-200 inline-block py-0.5 sm:py-0"
                  >
                    Kalkulator Gizi
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/belanja-obat" 
                    className="text-white/90 hover:text-white md:text-white md:hover:text-[#194668] transition-colors duration-200 inline-block py-0.5 sm:py-0"
                  >
                    Belanja Obat
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/komunitas" 
                    className="text-white/90 hover:text-white md:text-white md:hover:text-[#194668] transition-colors duration-200 inline-block py-0.5 sm:py-0"
                  >
                    Komunitas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Navigasi */}
            <div className="lg:col-span-2 space-y-2.5 sm:space-y-3">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                Navigasi
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li>
                  <Link 
                    to="/" 
                    className="text-white/90 hover:text-white md:text-white md:hover:text-[#194668] transition-colors duration-200 inline-block py-0.5 sm:py-0"
                  >
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/pricing" 
                    className="text-white/90 hover:text-white md:text-white md:hover:text-[#194668] transition-colors duration-200 inline-block py-0.5 sm:py-0"
                  >
                    Paket Premium
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/status-pesanan" 
                    className="text-white/90 hover:text-white md:text-white md:hover:text-[#194668] transition-colors duration-200 inline-block py-0.5 sm:py-0"
                  >
                    Status Pesanan
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/profil" 
                    className="text-white/90 hover:text-white md:text-white md:hover:text-[#194668] transition-colors duration-200 inline-block py-0.5 sm:py-0"
                  >
                    Profil Anda
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/kata-sandi" 
                    className="text-white/90 hover:text-white md:text-white md:hover:text-[#194668] transition-colors duration-200 inline-block py-0.5 sm:py-0"
                  >
                    Kata Sandi
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Kolom 4: Kontak */}
          <div className="lg:col-span-3 space-y-2.5 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Kontak
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href="https://wa.me/6285714963093"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 py-1 sm:py-0 text-white hover:text-white/80 md:hover:text-[#194668] transition-colors duration-200 group"
                >
                  <div className="w-7 h-7 sm:w-auto sm:h-auto rounded-lg sm:rounded-none bg-white/10 sm:bg-transparent flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-white group-hover:text-white md:group-hover:text-[#194668] transition-colors" />
                  </div>
                  <span className="font-medium">+62 857-1496-3093</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:bumilfit@gmail.com"
                  className="flex items-center gap-2.5 py-1 sm:py-0 text-white hover:text-white/80 md:hover:text-[#194668] transition-colors duration-200 group"
                >
                  <div className="w-7 h-7 sm:w-auto sm:h-auto rounded-lg sm:rounded-none bg-white/10 sm:bg-transparent flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-white group-hover:text-white md:group-hover:text-[#194668] transition-colors" />
                  </div>
                  <span className="font-medium">bumilfit@gmail.com</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 py-1 sm:py-0 text-white/90 leading-relaxed">
                <div className="w-7 h-7 sm:w-auto sm:h-auto rounded-lg sm:rounded-none bg-white/10 sm:bg-transparent flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={14} className="text-white shrink-0" />
                </div>
                <span className="font-medium">Jl. Cikampak, Kel. Cicadas, Kec. Ciampea, Kab. Bogor, Jawa Barat</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-white/15 sm:border-white/20 text-center text-[11px] sm:text-xs text-white/80">
          &copy; 2026 BumilFit. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
