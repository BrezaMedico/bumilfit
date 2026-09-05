import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
  disabled?: boolean;
}

export interface CustomDropdownProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Pilih salah satu...',
  label,
  error,
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs rounded-xl',
    md: 'h-11 px-3.5 sm:px-4 text-xs sm:text-sm rounded-xl',
    lg: 'h-12 px-4 text-sm rounded-xl',
  };

  return (
    <div className={`space-y-1.5 w-full text-left ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full flex items-center justify-between border transition-all duration-200 cursor-pointer select-none font-semibold ${
            sizeClasses[size]
          } ${
            disabled
              ? 'bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed'
              : isOpen
              ? 'border-[#389D9C] bg-white ring-2 ring-[#389D9C]/15 shadow-sm'
              : error
              ? 'border-rose-300 bg-rose-50/20 text-slate-800 hover:border-rose-400'
              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800 hover:bg-slate-50/50 shadow-3xs'
          } ${buttonClassName}`}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {selectedOption?.icon && (
              <span className="shrink-0">{selectedOption.icon}</span>
            )}
            <span
              className={`truncate block ${
                !selectedOption ? 'text-slate-400 font-normal' : 'text-slate-800'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#389D9C]' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Panel */}
        {isOpen && (
          <div
            role="listbox"
            className={`absolute z-50 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-98 duration-150 ${menuClassName}`}
          >
            {options.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-slate-400 text-center">
                Tidak ada pilihan tersedia
              </div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-teal-50/80 text-[#389D9C] font-bold'
                        : 'text-slate-700 hover:bg-teal-50/40 hover:text-[#194668] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {option.icon && (
                        <span className="shrink-0">{option.icon}</span>
                      )}
                      <div className="truncate">
                        <span className="block truncate">{option.label}</span>
                        {option.description && (
                          <span className="block text-[11px] text-slate-400 font-normal truncate mt-0.5">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {option.badge && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#389D9C] shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>
      )}
    </div>
  );
};
