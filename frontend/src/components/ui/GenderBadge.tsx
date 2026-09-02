import { Mars, Venus, HelpCircle, Sparkles } from 'lucide-react';

export type GenderType = 'LAKI_LAKI' | 'PEREMPUAN' | 'LAINNYA' | '';

interface GenderBadgeProps {
  gender: string | null | undefined;
  isInteractive?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
  showUnknownOption?: boolean;
}

export const normalizeGender = (gender: string | null | undefined): GenderType => {
  if (!gender) return '';
  const g = gender.toUpperCase().trim();
  if (g === 'LAKI_LAKI' || g === 'LAKI-LAKI' || g === 'LAKI') return 'LAKI_LAKI';
  if (g === 'PEREMPUAN' || g === 'WANITA' || g === 'FEMALE') return 'PEREMPUAN';
  if (g === 'LAINNYA' || g === 'LAIN' || g === 'OTHER') return 'LAINNYA';
  return '';
};

export const normalizeGenderText = (gender: string | null | undefined): string => {
  const normalized = normalizeGender(gender);
  if (normalized === 'LAKI_LAKI') return 'Laki-laki';
  if (normalized === 'PEREMPUAN') return 'Perempuan';
  if (normalized === 'LAINNYA') return 'Lainnya';
  return 'Belum diisi';
};

export const GenderBadge = ({
  gender,
  isInteractive = false,
  isSelected = false,
  onClick,
  size = 'md',
  showUnknownOption = true,
}: GenderBadgeProps) => {
  const normalized = normalizeGender(gender);

  const getGenderConfig = () => {
    switch (normalized) {
      case 'LAKI_LAKI':
        return {
          label: 'Laki-laki',
          icon: Mars,
          activeBg: 'bg-blue-50/80 border-blue-400 text-[#194668] shadow-sm',
          inactiveBg: 'border-zinc-200 bg-white text-zinc-500 hover:border-blue-200 hover:bg-blue-50/10',
          iconBg: 'bg-gradient-to-br from-blue-500 to-[#389D9C]',
          iconColor: 'text-white',
        };
      case 'PEREMPUAN':
        return {
          label: 'Perempuan',
          icon: Venus,
          activeBg: 'bg-pink-50/80 border-pink-400 text-pink-700 shadow-sm',
          inactiveBg: 'border-zinc-200 bg-white text-zinc-500 hover:border-pink-200 hover:bg-pink-50/10',
          iconBg: 'bg-gradient-to-br from-pink-500 to-rose-400',
          iconColor: 'text-white',
        };
      case 'LAINNYA':
        return {
          label: 'Lainnya',
          icon: Sparkles,
          activeBg: 'bg-purple-50/80 border-purple-400 text-purple-700 shadow-sm',
          inactiveBg: 'border-zinc-200 bg-white text-zinc-500 hover:border-purple-200 hover:bg-purple-50/10',
          iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-400',
          iconColor: 'text-white',
        };
      default:
        return {
          label: isInteractive ? 'Belum Tahu' : 'Belum diketahui',
          icon: HelpCircle,
          activeBg: 'bg-zinc-100 border-zinc-400 text-zinc-700 shadow-sm',
          inactiveBg: 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50/30',
          iconBg: 'bg-gradient-to-br from-zinc-400 to-zinc-300',
          iconColor: 'text-white',
        };
    }
  };

  const config = getGenderConfig();
  const IconComponent = config.icon;

  if (size === 'sm') {
    // Versi kecil untuk Dashboard / Jumbotron dan Profil Page (View Mode)
    if (!normalized && !showUnknownOption) return null;
    return (
      <div 
        onClick={isInteractive ? onClick : undefined}
        className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all duration-300 ${
          isInteractive ? 'cursor-pointer active:scale-95' : ''
        } ${
          isSelected || !isInteractive ? config.activeBg : config.inactiveBg
        } w-20 h-20 sm:w-22 sm:h-22`}
      >
        <div className={`p-1.5 rounded-full ${config.iconBg} ${config.iconColor} mb-1 shadow-xs flex items-center justify-center`}>
          <IconComponent size={14} className="stroke-[3]" />
        </div>
        <span className="text-[10px] sm:text-xs font-bold leading-tight block">
          {config.label}
        </span>
      </div>
    );
  }

  // Versi medium/normal untuk Register dan Profil Page (Edit Mode)
  return (
    <button
      type="button"
      disabled={!isInteractive}
      onClick={isInteractive ? onClick : undefined}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-300 w-full ${
        isInteractive ? 'cursor-pointer active:scale-95 hover:shadow-xs' : ''
      } ${
        isSelected ? config.activeBg : config.inactiveBg
      }`}
    >
      <div className={`p-2.5 rounded-full ${config.iconBg} ${config.iconColor} mb-2 shadow-sm flex items-center justify-center`}>
        <IconComponent size={20} className="stroke-[3]" />
      </div>
      <span className="text-xs sm:text-sm font-bold tracking-tight block">
        {config.label}
      </span>
    </button>
  );
};
