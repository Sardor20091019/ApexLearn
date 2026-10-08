'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroCanvas } from './HeroCanvas';
import { Magnetic } from './Magnetic';
import { useLenis } from './LenisProvider';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const titleLinesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const metaRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useLenis();

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    const ctx = gsap.context(() => {
      // Line-by-line reveal animation using clipping paths & translation
      const tl = gsap.timeline({
        defaults: { ease: 'power4.out', duration: 1.2 },
      });

      tl.fromTo(
        titleLinesRef.current,
        {
          yPercent: 120,
          clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)',
          opacity: 0,
        },
        {
          yPercent: 0,
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          opacity: 1,
          stagger: 0.12,
          delay: 0.2,
        }
      )
        .fromTo(
          metaRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' },
          '-=0.7'
        )
        .fromTo(
          rightColRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' },
          '-=0.8'
        );

      // Scroll-driven subtle kinetic exit parallax
      gsap.to(titleLinesRef.current, {
        scrollTrigger: {
          trigger: heroEl,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        },
        y: -60,
        opacity: 0.2,
        stagger: 0.05,
      });
    }, heroEl);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-screen w-full flex flex-col justify-between pt-24 sm:pt-28 pb-8 px-3 sm:px-6 md:px-8 border-b border-[#F5F5F3]/10 bg-[#0D0D0D] overflow-hidden"
    >
       
      <div className="w-full flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#F5F5F3]/40 border-b border-[#F5F5F3]/10 pb-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <span className="text-[#FF3E00] font-bold">[01]</span>
          <span>SPATIAL EXPERIMENT</span>
          <span className="text-[#F5F5F3]/20">/</span>
          <span className="hidden sm:inline">EDITION 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline">INDEX NO: #SOTD-88</span>
          <span className="text-[#FF3E00]">● LIVE PROTOTYPE</span>
        </div>
      </div>

       
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-8 items-center my-auto w-full">
         
        <div className="lg:col-span-7 flex flex-col justify-center select-none">
           
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#FF3E00] mb-3">
            <span className="w-2.5 h-[1px] bg-[#FF3E00]" />
            <span>KINETIC TYPOGRAPHY ARCHITECTURE</span>
          </div>

           
          <h1 className="font-['Syne',sans-serif] font-extrabold uppercase text-[#F5F5F3] leading-[0.84] tracking-[-0.04em] text-[13vw] sm:text-[11vw] lg:text-[8.5vw] xl:text-[9.2vw]">
            <div className="overflow-hidden pb-1">
              <span
                ref={(el) => {
                  titleLinesRef.current[0] = el;
                }}
                className="inline-block will-change-transform"
              >
                RADICAL
              </span>
            </div>
            <div className="overflow-hidden pb-1">
              <span
                ref={(el) => {
                  titleLinesRef.current[1] = el;
                }}
                className="inline-block text-[#FF3E00] will-change-transform"
              >
                SPATIAL
              </span>
            </div>
            <div className="overflow-hidden pb-1">
              <span
                ref={(el) => {
                  titleLinesRef.current[2] = el;
                }}
                className="inline-block will-change-transform"
              >
                SYNTHESIS
              </span>
            </div>
          </h1>

           
          <div
            ref={metaRef}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-t border-[#F5F5F3]/15 pt-5 sm:pt-6"
          >
            <p className="max-w-md font-mono text-xs sm:text-sm text-[#F5F5F3]/70 leading-relaxed uppercase">
              Bypassing generic containers for edge-anchored spatial kinetics. Designed with
              zero redundant decoration, strict 3-tone chromatic precision, and fluid GSAP physics.
            </p>

             
            <div className="flex items-center gap-3 shrink-0">
              <Magnetic strength={0.4} asPill>
                <button
                  onClick={() => scrollTo('#mosaic')}
                  className="px-5 py-2.5 rounded-full bg-[#FF3E00] text-[#0D0D0D] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#F5F5F3] hover:text-[#0D0D0D] transition-colors flex items-center gap-2 group shadow-lg"
                >
                  <span>EXPLORE GRID</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </Magnetic>

              <Magnetic strength={0.3} asPill>
                <button
                  onClick={() => scrollTo('#showcase')}
                  className="px-4 py-2.5 rounded-full border border-[#F5F5F3]/25 text-[#F5F5F3] font-mono text-xs uppercase tracking-wider hover:border-[#FF3E00] hover:text-[#FF3E00] transition-colors"
                >
                  INDEX [05]
                </button>
              </Magnetic>
            </div>
          </div>
        </div>

         
        <div ref={rightColRef} className="lg:col-span-5 w-full">
          <HeroCanvas />
        </div>
      </div>

       
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between font-mono text-[9px] uppercase tracking-widest text-[#F5F5F3]/40 border-t border-[#F5F5F3]/10 pt-4 mt-6 gap-2">
        <div className="flex items-center gap-4">
          <span className="text-[#FF3E00]">COORD:</span>
          <span>LAT 41.2995° // LONG 69.2401°</span>
          <span className="text-[#F5F5F3]/20 hidden sm:inline">|</span>
          <span className="hidden sm:inline">RESOLUTION: FLUID 100VW</span>
        </div>
        <div className="flex items-center gap-2 text-[#F5F5F3]/60">
          <span>SCROLL FOR REVEAL</span>
          <span className="animate-bounce text-[#FF3E00]">↓</span>
        </div>
      </div>
    </section>
  );
}
