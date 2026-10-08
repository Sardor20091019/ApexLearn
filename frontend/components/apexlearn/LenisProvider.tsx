'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface LenisCtx {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, opts?: { offset?: number; duration?: number }) => void;
  scrollProgress: number;
}

const LenisContext = createContext<LenisCtx>({
  lenis: null,
  scrollTo: () => {},
  scrollProgress: 0,
});

export const useLenis = () => useContext(LenisContext);

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const instance = new Lenis({
      lerp: 0.075,
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      autoRaf: false,
    });

    lenisRef.current = instance;
    setLenis(instance);

    instance.on('scroll', ({ progress }: { progress: number }) => {
      setScrollProgress(progress);
      ScrollTrigger.update();
    });

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    setTimeout(() => ScrollTrigger.refresh(), 200);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo: LenisCtx['scrollTo'] = (target, opts) => {
    const l = lenisRef.current;
    if (l) {
      l.scrollTo(target, {
        offset: opts?.offset ?? 0,
        duration: opts?.duration ?? 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    }
  };

  return (
    <LenisContext.Provider value={{ lenis, scrollTo, scrollProgress }}>
      {children}
    </LenisContext.Provider>
  );
}
