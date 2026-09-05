import React from 'react';
import { useToastStore, type ToastItem } from '../../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-[#389D9C] shrink-0 mt-0.5" />,
  error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
  info: <Info className="w-5 h-5 text-[#194668] shrink-0 mt-0.5" />,
};

const borderStyles = {
  success: 'border-[#389D9C]/25 bg-white shadow-[0_8px_30px_rgb(56,157,156,0.12)]',
  error: 'border-rose-200 bg-white shadow-[0_8px_30px_rgb(244,63,94,0.12)]',
  warning: 'border-amber-200 bg-white shadow-[0_8px_30px_rgb(245,158,11,0.12)]',
  info: 'border-[#194668]/20 bg-white shadow-[0_8px_30px_rgb(25,70,104,0.12)]',
};

const ToastMessage: React.FC<{ toast: ToastItem; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border text-sm max-w-sm w-full transition-all animate-in fade-in slide-in-from-top-3 duration-250 ${
        borderStyles[toast.type]
      }`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0 pr-1">
        <p className="font-bold text-gray-800 text-xs sm:text-sm leading-snug">
          {toast.message}
        </p>
        {toast.description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 -mr-1 -mt-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastMessage toast={item} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
};
