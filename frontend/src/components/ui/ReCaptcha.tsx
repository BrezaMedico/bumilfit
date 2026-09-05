import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export interface ReCaptchaRef {
  reset: () => void;
  getResponse: () => string;
}

interface ReCaptchaProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: HTMLElement | string,
        parameters: {
          sitekey: string;
          callback?: (response: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark';
          size?: 'normal' | 'compact';
        }
      ) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
    onRecaptchaApiLoaded?: () => void;
  }
}

const DEFAULT_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LdKfaktAAAAAHpk60SPoZHfyIhD-faxPFBgwbQk';

export const ReCaptcha = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  (
    {
      siteKey = DEFAULT_SITE_KEY,
      onVerify,
      onExpire,
      onError,
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<number | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (window.grecaptcha && widgetIdRef.current !== null) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch (e) {
            console.warn('[reCAPTCHA] Gagal mereset widget:', e);
          }
        }
      },
      getResponse: () => {
        if (window.grecaptcha && widgetIdRef.current !== null) {
          return window.grecaptcha.getResponse(widgetIdRef.current);
        }
        return '';
      },
    }));

    const onVerifyRef = useRef(onVerify);
    onVerifyRef.current = onVerify;

    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;

    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    useEffect(() => {
      let isMounted = true;

      const renderWidget = () => {
        if (!isMounted || !containerRef.current || !window.grecaptcha) return;

        // Hindari render ganda jika widget sudah ter-render
        if (widgetIdRef.current !== null) return;

        try {
          const id = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              if (isMounted && onVerifyRef.current) onVerifyRef.current(token);
            },
            'expired-callback': () => {
              if (isMounted && onExpireRef.current) onExpireRef.current();
            },
            'error-callback': () => {
              if (isMounted && onErrorRef.current) onErrorRef.current();
            },
            theme: 'light',
          });

          widgetIdRef.current = id;
          setIsLoaded(true);
        } catch (err) {
          console.warn('[reCAPTCHA] Render error:', err);
        }
      };

      // Jika grecaptcha sudah siap di window
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        window.grecaptcha.ready(renderWidget);
        return;
      }

      // Jika script belum ada di DOM, inject secara aman
      const existingScript = document.getElementById('recaptcha-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (window.grecaptcha) {
            window.grecaptcha.ready(renderWidget);
          }
        };
        document.head.appendChild(script);
      } else {
        // Tunggu grecaptcha siap
        const interval = setInterval(() => {
          if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
            clearInterval(interval);
            window.grecaptcha.ready(renderWidget);
          }
        }, 100);

        return () => clearInterval(interval);
      }

      return () => {
        isMounted = false;
      };
    }, [siteKey]);

    return (
      <div className={`flex flex-col items-center justify-center my-2 select-none ${className}`}>
        {/* Placeholder ringan saat script reCAPTCHA dimuat */}
        {!isLoaded && (
          <div className="w-[304px] h-[78px] rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-center gap-2 text-xs text-slate-400 animate-pulse">
            <ShieldCheck size={16} className="text-[#389D9C]" />
            <span>Memuat keamanan reCAPTCHA...</span>
          </div>
        )}
        <div
          ref={containerRef}
          className={`${!isLoaded ? 'hidden' : 'block'} transform-gpu`}
          style={{ minHeight: '78px', minWidth: '304px' }}
        />
      </div>
    );
  }
);

ReCaptcha.displayName = 'ReCaptcha';
