'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const MARQUEE_ITEMS_PRIMARY = [
  'ARCHITECTURAL COMPUTATION',
  'ZERO REDUNDANCY',
  'EDGES WITHOUT BOUNDARY',
  '60FPS KINETICS',
  'EDITORIAL MINIMALISM',
  'RADICAL GEOMETRY',
  'VOLUMETRIC SHADERS',
];

const MARQUEE_ITEMS_SECONDARY = [
  'EST. 2026',
  'LATENCY < 1MS',
  'AWWWARDS SOTD MECHANICS',
  'SYSTEM: UNBOUND',
  'LENIS SMOOTH PHYSIC',
  'KINETIC SCALE',
  'NOISELESS CANVAS',
];

export function ChronologicalMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track1 = track1Ref.current;
    const track2 = track2Ref.current;
    if (!container || !track1 || !track2) return;

    // High velocity GSAP animations
    let speed1 = 0.8;
    let speed2 = -0.7;

    let x1 = 0;
    let x2 = 0;

    // Velocity booster on scroll
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = (currentScrollY - lastScrollY) * 0.12;
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    let animId: number;
    const updateMarquee = () => {
      // Decay extra scroll velocity
      scrollVelocity *= 0.92;

      // Apply speeds
      x1 -= speed1 + Math.abs(scrollVelocity);
      x2 += speed2 - Math.abs(scrollVelocity);

      // Wrap smoothly around 50%
      const halfWidth1 = track1.scrollWidth / 2;
      const halfWidth2 = track2.scrollWidth / 2;

      if (halfWidth1 > 0) {
        if (x1 <= -halfWidth1) x1 += halfWidth1;
        if (x1 > 0) x1 -= halfWidth1;
        track1.style.transform = `translate3d(${x1}px, 0, 0)`;
      }

      if (halfWidth2 > 0) {
        if (x2 <= -halfWidth2) x2 += halfWidth2;
        if (x2 > 0) x2 -= halfWidth2;
        track2.style.transform = `translate3d(${x2}px, 0, 0)`;
      }

      animId = requestAnimationFrame(updateMarquee);
    };

    animId = requestAnimationFrame(updateMarquee);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full py-5 sm:py-8 border-y border-[#F5F5F3]/15 bg-[#0D0D0D] overflow-hidden select-none my-0"
    >
      {}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-between px-4">
        <span className="font-mono text-[8px] text-[#F5F5F3] self-center">SYS.TICKER // HIGH-VELOCITY RUNTIME</span>
        <span className="font-mono text-[8px] text-[#FF3E00] self-center">ACCELERATION: DYNAMIC</span>
      </div>

      {}
      <div className="flex w-max will-change-transform py-1" ref={track1Ref}>
        {[...MARQUEE_ITEMS_PRIMARY, ...MARQUEE_ITEMS_PRIMARY].map((item, idx) => (
          <div
            key={idx}
            className="flex items-center whitespace-nowrap shrink-0 group cursor-default"
          >
            <span className="font-['Syne',sans-serif] font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter text-[#F5F5F3] px-4 group-hover:text-[#FF3E00] transition-colors duration-200">
              {item}
            </span>
            <span className="text-[#FF3E00] text-xl sm:text-3xl px-3 font-mono">✦</span>
          </div>
        ))}
      </div>

      {}
      <div className="flex w-max will-change-transform mt-2 border-t border-[#F5F5F3]/10 pt-2" ref={track2Ref}>
        {[...MARQUEE_ITEMS_SECONDARY, ...MARQUEE_ITEMS_SECONDARY].map((item, idx) => (
          <div
            key={idx}
            className="flex items-center whitespace-nowrap shrink-0 text-[#F5F5F3]/60 font-mono text-xs sm:text-sm uppercase tracking-widest px-4"
          >
            <span className="text-[#FF3E00] mr-2">[{idx % 7 + 1}]</span>
            <span className="text-[#F5F5F3]/80 hover:text-[#F5F5F3]">{item}</span>
            <span className="text-[#F5F5F3]/20 mx-4">///</span>
          </div>
        ))}
      </div>
    </div>
  );
}
