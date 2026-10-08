'use client';

import React, { useEffect, useState } from 'react';

export function EdgeCoordinates() {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      setCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
    };

    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress(Math.round((window.scrollY / total) * 100));
      }
    };

    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none text-[#F5F5F3]/50 font-mono text-[9px] uppercase tracking-widest">
       
      <div className="absolute inset-0 border border-[#F5F5F3]/10" />

       
      <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[#F5F5F3]/70">
        <span className="text-[#FF3E00] font-bold text-xs leading-none">+</span>
        <span className="tracking-tighter">ARCH // 01</span>
        <span className="text-[#F5F5F3]/20">|</span>
        <span className="hidden sm:inline">41.2995° N, 69.2401° E</span>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[#F5F5F3]/70">
        <span className="hidden sm:inline">FPS: 60 // GLSL ENGINE</span>
        <span className="text-[#F5F5F3]/20 hidden sm:inline">|</span>
        <span className="text-[#FF3E00] font-mono">{timeStr || '16:17:34'}</span>
        <span className="text-[#FF3E00] font-bold text-xs leading-none">+</span>
      </div>

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[#F5F5F3]/70">
        <span className="text-[#FF3E00] font-bold text-xs leading-none">+</span>
        <span>SYS: 0x8F94</span>
        <span className="text-[#F5F5F3]/20">|</span>
        <span className="hidden md:inline">SPATIAL MINIMALISM</span>
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[#F5F5F3]/70">
        <span className="hidden sm:inline font-mono">
          X:{coords.x.toString().padStart(4, '0')} Y:{coords.y.toString().padStart(4, '0')}
        </span>
        <span className="text-[#F5F5F3]/20 hidden sm:inline">|</span>
        <span className="text-[#FF3E00] font-mono font-semibold">
          {scrollProgress.toString().padStart(3, '0')}%
        </span>
        <span className="text-[#FF3E00] font-bold text-xs leading-none">+</span>
      </div>

       
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-[#F5F5F3]/10">
        <div
          className="w-full bg-[#FF3E00] transition-all duration-75"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>

       
      <div className="hidden lg:flex flex-col justify-between absolute left-1 top-16 bottom-16 w-3 pointer-events-none text-[7px] text-[#F5F5F3]/20">
        <span>00</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>99</span>
      </div>
    </div>
  );
}
