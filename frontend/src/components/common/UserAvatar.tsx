import React from 'react';
import { User } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';

export interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isSubscribed?: boolean; // Jika tidak diisi, otomatis mengambil status user login
  className?: string;
  showBadge?: boolean;
}

const SIZE_MAP = {
  xs: {
    outer: 'w-7 h-7',
    icon: 14,
    text: 'text-[10px]',
    ring: 'ring-[1.5px] ring-offset-1',
  },
  sm: {
    outer: 'w-8 h-8',
    icon: 16,
    text: 'text-xs',
    ring: 'ring-2 ring-offset-1.5',
  },
  md: {
    outer: 'w-10 h-10',
    icon: 18,
    text: 'text-sm',
    ring: 'ring-2 ring-offset-2',
  },
  lg: {
    outer: 'w-12 h-12',
    icon: 22,
    text: 'text-base',
    ring: 'ring-2 ring-offset-2',
  },
  xl: {
    outer: 'w-16 h-16',
    icon: 28,
    text: 'text-lg',
    ring: 'ring-3 ring-offset-2',
  },
  '2xl': {
    outer: 'w-32 h-32',
    icon: 48,
    text: 'text-3xl',
    ring: 'ring-4 ring-offset-4',
  },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  isSubscribed,
  className = '',
}) => {
  const { hasActiveSubscription } = useSubscription();
  const activeSubscribed = isSubscribed !== undefined ? isSubscribed : hasActiveSubscription;
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const initial = name ? name.trim().charAt(0).toUpperCase() : null;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 aspect-square select-none ${sizeConfig.outer} ${
        activeSubscribed
          ? `${sizeConfig.ring} ring-[#389D9C] ring-offset-white shadow-[0_0_8px_rgba(56,157,156,0.25)]`
          : 'border border-gray-200'
      } ${className}`}
      title={activeSubscribed ? 'Pengguna Berlangganan Aktif' : undefined}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-50 text-[#389D9C] font-bold">
        {src ? (
          <img
            src={src}
            alt={name || 'Foto Profil'}
            className="w-full h-full object-cover rounded-full block"
            onError={(e) => {
              // Fallback jika URL gambar rusak
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : initial ? (
          <span className={`${sizeConfig.text} font-black text-[#194668]`}>{initial}</span>
        ) : (
          <User size={sizeConfig.icon} className="text-gray-400" />
        )}
      </div>
    </div>
  );
};
