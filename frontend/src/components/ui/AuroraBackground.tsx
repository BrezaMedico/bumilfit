import React, { useEffect, useRef } from 'react';

interface Point {
  baseXRatio: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Ribbon {
  points: Point[];
  baseYRatio: number;
  speed: number;
  amplitude: number;
  freq: number;
  colorStops: { offset: number; color: string }[];
  phase: number;
}

export const AuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number | null = null;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchOnly = window.matchMedia('(hover: none)').matches;

    // Buffer kanvas sangat ringan (360x200)
    // Di-upscale dengan hardware bilinear filter GPU bawaan tanpa beban CPU/GPU
    const BUFFER_W = 360;
    const BUFFER_H = 200;
    canvas.width = BUFFER_W;
    canvas.height = BUFFER_H;

    // State kursor mouse
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
      lastMoved: 0,
    };

    let isScrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const startAnimation = () => {
      if (animationFrameId === null && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const stopAnimation = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    // Saat pengguna sedang scroll, HENTIKAN canvas animation sepenuhnya!
    // Ini menjamin 100% thread browser bebas hambatan untuk 60-120fps scrolling!
    const handleScroll = () => {
      isScrolling = true;
      stopAnimation();

      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        startAnimation();
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      if (isScrolling) return;
      const scaleX = BUFFER_W / window.innerWidth;
      const scaleY = BUFFER_H / window.innerHeight;
      mouse.targetX = e.clientX * scaleX;
      mouse.targetY = e.clientY * scaleY;
      mouse.active = true;
      mouse.lastMoved = performance.now();
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    if (!isTouchOnly) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    // 2 Pita Aurora hijau BumilFit dengan gradasi lembut
    const ribbonConfigs = [
      {
        baseYRatio: 0.36,
        speed: 0.0005,
        amplitude: 30,
        freq: 0.003,
        phase: 0,
        colorStops: [
          { offset: 0, color: 'rgba(56, 157, 156, 0)' },
          { offset: 0.35, color: 'rgba(45, 212, 191, 0.32)' },
          { offset: 0.7, color: 'rgba(20, 184, 166, 0.18)' },
          { offset: 1, color: 'rgba(25, 70, 104, 0)' },
        ],
      },
      {
        baseYRatio: 0.50,
        speed: 0.0007,
        amplitude: 36,
        freq: 0.0035,
        phase: Math.PI / 2.5,
        colorStops: [
          { offset: 0, color: 'rgba(20, 184, 166, 0)' },
          { offset: 0.4, color: 'rgba(56, 157, 156, 0.35)' },
          { offset: 0.75, color: 'rgba(45, 212, 191, 0.16)' },
          { offset: 1, color: 'rgba(19, 78, 74, 0)' },
        ],
      },
    ];

    // Hanya 10 titik per pita (sangat efisien di CPU)
    const pointCount = 10;
    const ribbons: Ribbon[] = ribbonConfigs.map((cfg) => {
      const points: Point[] = [];
      for (let i = 0; i <= pointCount; i++) {
        const ratio = i / pointCount;
        points.push({
          baseXRatio: ratio,
          x: ratio * BUFFER_W,
          y: cfg.baseYRatio * BUFFER_H,
          vx: 0,
          vy: 0,
        });
      }
      return { ...cfg, points };
    });

    let time = 0;
    let lastRenderTime = 0;

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      // Batasi frame rate maksimal 30 FPS untuk animasi ambient lambat
      // Ini memotong 50% beban kerja prosesor laptop seketika!
      if (currentTime - lastRenderTime < 33) return;
      const delta = Math.min(currentTime - (lastRenderTime || currentTime), 40);
      lastRenderTime = currentTime;
      time += delta;

      // Matikan interaksi mouse jika diam lebih dari 1 detik
      if (mouse.active && currentTime - mouse.lastMoved > 1000) {
        mouse.active = false;
      }

      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.2;
        mouse.y += (mouse.targetY - mouse.y) * 0.2;
      }

      ctx.clearRect(0, 0, BUFFER_W, BUFFER_H);

      const repelRadius = 70;
      const springStiffness = 0.045;
      const damping = 0.82;

      for (let rIdx = 0; rIdx < ribbons.length; rIdx++) {
        const ribbon = ribbons[rIdx];
        const { points, baseYRatio, speed, amplitude, freq, colorStops, phase } = ribbon;
        const currentBaseY = baseYRatio * BUFFER_H;

        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const naturalX = p.baseXRatio * BUFFER_W;
          const waveOffsetY =
            Math.sin(time * speed + i * freq * 18 + phase) * amplitude +
            Math.cos(time * (speed * 0.6) + i * 0.3) * (amplitude * 0.28);
          const targetY = currentBaseY + waveOffsetY;

          if (!prefersReducedMotion && mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;

            if (Math.abs(dx) < repelRadius && Math.abs(dy) < repelRadius) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < repelRadius && dist > 0) {
                const repelPower = (1 - dist / repelRadius) * (1 - dist / repelRadius);
                const angle = Math.atan2(dy, dx);
                p.vx += Math.cos(angle) * repelPower * 3.5;
                p.vy += Math.sin(angle) * repelPower * 4.5;
              }
            }

            p.vx += (naturalX - p.x) * springStiffness;
            p.vy += (targetY - p.y) * springStiffness;
            p.vx *= damping;
            p.vy *= damping;

            p.x += p.vx;
            p.y += p.vy;
          } else {
            p.x = naturalX;
            p.y = targetY;
          }
        }

        // Gambar kurva kuadratik Bezier
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) * 0.5;
          const yc = (points[i].y + points[i + 1].y) * 0.5;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);

        // Tutup poligon
        const ribbonHeight = 90;
        ctx.lineTo(BUFFER_W, last.y + ribbonHeight);
        ctx.lineTo(0, points[0].y + ribbonHeight);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, currentBaseY - amplitude, 0, currentBaseY + ribbonHeight);
        for (let s = 0; s < colorStops.length; s++) {
          grad.addColorStop(colorStops[s].offset, colorStops[s].color);
        }

        ctx.fillStyle = grad;
        ctx.fill();
      }
    };

    if (prefersReducedMotion) {
      render(0);
    } else {
      startAnimation();
    }

    return () => {
      stopAnimation();
      window.removeEventListener('scroll', handleScroll);
      if (!isTouchOnly) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none contain-strict"
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform',
      }}
    >
      {/* Kanvas subsampled yang sangat ringan dengan blur minimalis 4px */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover filter blur-[4px] opacity-75"
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Static ambient glow yang super ringan */}
      <div className="absolute -top-16 -left-16 w-60 h-60 bg-[#389D9C]/8 rounded-full blur-lg pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-[#2dd4bf]/8 rounded-full blur-lg pointer-events-none" />
    </div>
  );
};
