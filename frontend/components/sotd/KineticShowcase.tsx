'use client';

import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { audioSynth } from './AudioSynth';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ShowcaseItem {
  id: string;
  num: string;
  title: string;
  category: string;
  year: string;
  spec: string;
  img: string;
  tagline: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'neural-inference-hardware',
    num: '01',
    title: 'NEURAL TOPOLOGY',
    category: 'MACHINE COGNITION',
    year: '2026',
    spec: 'CUDA KERNEL / 4-BIT AWQ',
    img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    tagline: 'High-performance local AI inference engine with flash attention v2.',
  },
  {
    id: 'spatial-shaders-webgl',
    num: '02',
    title: 'KINETIC VOID',
    category: 'WEBGL ALCHEMY',
    year: '2025',
    spec: 'GLSL SHADERS / SDF MATH',
    img: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
    tagline: 'Direct GPU fragment shaders, raymarching, and Eulerian fluid dynamics.',
  },
  {
    id: 'rust-kernel-systems',
    num: '03',
    title: 'MONOLITH CHRONICLES',
    category: 'KERNEL & SYSTEMS',
    year: '2026',
    spec: 'BARE-METAL RUST / ZERO-ALLOC',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    tagline: 'Architecting memory allocators, lock-free queues, and custom slab drivers.',
  },
  {
    id: 'distributed-consensus-crypto',
    num: '04',
    title: 'RAYMARCH ENGINE',
    category: 'DISTRIBUTED PROTOCOLS',
    year: '2025',
    spec: 'RAFT CONSENSUS / ZK-SNARKS',
    img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    tagline: 'Zero-knowledge verification pipelines and fault-tolerant state consensus.',
  },
  {
    id: 'zero-gravity-ui',
    num: '05',
    title: 'ZERO-GRAVITY UI',
    category: 'INTERACTION DESIGN',
    year: '2026',
    spec: 'GSAP TICKER / LENIS FORCES',
    img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    tagline: 'Sub-pixel fluid physics, magnetic haptics, and spatial micro-motion.',
  },
];

export function KineticShowcase({ onSelectItem }: { onSelectItem?: (item: ShowcaseItem) => void }) {
  const containerRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const [activeItem, setActiveItem] = useState<ShowcaseItem | null>(null);

  // GSAP quickTo setters for floating preview thumbnail cursor tracking
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const xTo = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3.out' });
    const rotTo = gsap.quickTo(preview, 'rotation', { duration: 0.6, ease: 'power3.out' });

    let lastX = 0;

    const handlePointerMove = (e: PointerEvent) => {
      // Offset preview so cursor does not obscure thumbnail
      xTo(e.clientX + 24);
      yTo(e.clientY - 120);

      const deltaX = e.clientX - lastX;
      lastX = e.clientX;
      // Tilt preview based on mouse horizontal velocity
      const clampRot = Math.max(-14, Math.min(14, deltaX * 0.45));
      rotTo(clampRot);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // GSAP ScrollTrigger for list entry reveal
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const rows = container.querySelectorAll('.showcase-row');
      gsap.fromTo(
        rows,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 75%',
          },
        }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  const handleMouseEnter = (item: ShowcaseItem) => {
    setActiveItem(item);
    audioSynth.playHover();

    if (previewRef.current) {
      gsap.to(previewRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.35,
        ease: 'power2.out',
      });
    }
  };

  const handleMouseLeave = () => {
    setActiveItem(null);
    if (previewRef.current) {
      gsap.to(previewRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
      });
    }
  };

  return (
    <section
      id="showcase"
      ref={containerRef}
      className="relative w-full py-16 sm:py-24 px-3 sm:px-6 md:px-8 border-b border-[#F5F5F3]/10 bg-[#0D0D0D] overflow-hidden"
    >
      {/* Viewport extreme edge section label */}
      <div className="w-full flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#F5F5F3]/40 border-b border-[#F5F5F3]/10 pb-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-[#FF3E00] font-bold">[03]</span>
          <span>KINETIC LIST INTERACTION</span>
          <span className="text-[#F5F5F3]/20">/</span>
          <span>HOVER TELEMETRY</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#FF3E00]">●</span>
          <span>5 ACTIVE DOSSIERS</span>
        </div>
      </div>

      {/* Section Massive Header */}
      <div className="mb-10 sm:mb-14">
        <h2 className="font-['Syne',sans-serif] font-black uppercase text-[#F5F5F3] text-4xl sm:text-6xl lg:text-7xl leading-[0.88] tracking-tight">
          SYSTEM SHOWCASE
        </h2>
        <p className="font-mono text-xs sm:text-sm text-[#F5F5F3]/60 uppercase mt-3 max-w-xl">
          Cursor-synchronized preview floating on quick-smoothing spring equations. Hover any
          entry to unmask high-density architectural dossiers.
        </p>
      </div>

      {/* Vertical Menu Block spanning full width with hairline dividers */}
      <div className="w-full border-t border-[#F5F5F3]/15">
        {SHOWCASE_ITEMS.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => handleMouseEnter(item)}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
              audioSynth.playTick(1500, 0.08);
              onSelectItem?.(item);
            }}
            className="showcase-row group relative w-full flex flex-col md:flex-row md:items-center justify-between py-6 sm:py-8 border-b border-[#F5F5F3]/15 cursor-pointer transition-colors duration-300 hover:bg-[#F5F5F3]/[0.02]"
          >
            {/* Left Column: Number & Title with Kinetic Slide */}
            <div className="flex items-baseline gap-4 sm:gap-8">
              <span className="font-mono text-sm sm:text-base text-[#FF3E00] font-bold">
                [{item.num}]
              </span>

              <div className="flex flex-col">
                <h3 className="font-['Syne',sans-serif] text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-[#F5F5F3] tracking-tighter transition-all duration-300 group-hover:text-[#FF3E00] group-hover:translate-x-3">
                  {item.title}
                </h3>
                <span className="font-mono text-[10px] sm:text-xs text-[#F5F5F3]/50 uppercase mt-1 transition-all duration-300 group-hover:translate-x-3">
                  {item.tagline}
                </span>
              </div>
            </div>

            {/* Right Column: Category, Specs & Arrow */}
            <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-6 sm:gap-10 font-mono text-xs uppercase tracking-wider text-[#F5F5F3]/60">
              <div className="flex flex-col md:text-right">
                <span className="text-[#F5F5F3] font-semibold">{item.category}</span>
                <span className="text-[10px] text-[#F5F5F3]/40">{item.spec}</span>
              </div>

              <span className="text-sm font-mono text-[#F5F5F3]/30 hidden sm:inline">
                {item.year}
              </span>

              {/* Arrow glyph with hover kinetic shift */}
              <div className="w-9 h-9 rounded-full border border-[#F5F5F3]/20 flex items-center justify-center text-[#F5F5F3] group-hover:border-[#FF3E00] group-hover:bg-[#FF3E00] group-hover:text-[#0D0D0D] transition-all duration-300">
                <span className="transform group-hover:rotate-45 transition-transform duration-300">
                  ↗
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Preview Thumbnail (Moves Dynamically with Mouse Cursor) */}
      <div
        ref={previewRef}
        className="fixed top-0 left-0 pointer-events-none z-50 w-[240px] sm:w-[320px] h-[170px] sm:h-[220px] rounded-xs border border-[#F5F5F3]/30 bg-[#0D0D0D] shadow-2xl overflow-hidden opacity-0 scale-75 will-change-transform"
        style={{ transformOrigin: 'center center' }}
      >
        {activeItem && (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={previewImgRef}
              src={activeItem.img}
              alt={activeItem.title}
              className="w-full h-full object-cover filter contrast-125 brightness-90 grayscale group-hover:grayscale-0 transition-all"
            />
            {/* Image Overlay HUD */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent opacity-80" />
            <div className="absolute top-2 left-3 right-3 flex justify-between font-mono text-[9px] uppercase tracking-widest text-[#F5F5F3]">
              <span className="text-[#FF3E00]">[{activeItem.num}] PREVIEW</span>
              <span>{activeItem.year}</span>
            </div>
            <div className="absolute bottom-2 left-3 right-3 font-mono text-[10px] uppercase text-[#F5F5F3]">
              <div className="font-bold text-xs">{activeItem.title}</div>
              <div className="text-[9px] text-[#F5F5F3]/60">{activeItem.spec}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
