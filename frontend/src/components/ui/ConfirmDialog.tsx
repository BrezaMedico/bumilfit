import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    iconBg: 'bg-rose-50 text-rose-500 border border-rose-100',
    icon: <Trash2 className="w-7 h-7" />,
    confirmButton: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow',
  },
  warning: {
    iconBg: 'bg-amber-50 text-amber-500 border border-amber-100',
    icon: <AlertTriangle className="w-7 h-7" />,
    confirmButton: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow',
  },
  info: {
    iconBg: 'bg-blue-50 text-[#194668] border border-blue-100',
    icon: <Info className="w-7 h-7" />,
    confirmButton: 'bg-[#194668] hover:bg-[#133650] text-white shadow-sm hover:shadow',
  },
  success: {
    iconBg: 'bg-teal-50 text-[#389D9C] border border-teal-100',
    icon: <CheckCircle2 className="w-7 h-7" />,
    confirmButton: 'bg-[#389D9C] hover:bg-[#2d8382] text-white shadow-sm hover:shadow',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const currentVariant = variantStyles[variant];

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
        {/* Status Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-2xs ${currentVariant.iconBg}`}
        >
          {currentVariant.icon}
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              onConfirm();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50 ${currentVariant.confirmButton}`}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
