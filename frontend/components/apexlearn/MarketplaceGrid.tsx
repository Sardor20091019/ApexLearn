'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Magnetic } from './Magnetic';

interface CourseTile {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  creator: string;
  price: string;
  level: string;
  img: string;
  span?: 'wide' | 'tall' | 'normal';
}

const MARKETPLACE_TILES: CourseTile[] = [
  {
    id: 'webgl',
    tag: 'GRAPHICS',
    title: 'SPATIAL WEBGL ALCHEMY',
    subtitle: 'Volumetric Raymarching & SDF Physics',
    creator: 'Evelyn Soroka',
    price: '$129',
    level: 'INTERMEDIATE',
    img: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=900&q=80',
    span: 'wide',
  },
  {
    id: 'rust',
    tag: 'SYSTEMS',
    title: 'BARE-METAL RUST',
    subtitle: 'Kernel Architecture & Zero-Cost Abstractions',
    creator: 'Dr. Nikolai Vance',
    price: '$149',
    level: 'ADVANCED',
    img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80',
    span: 'tall',
  },
  {
    id: 'aiml',
    tag: 'AI / ML',
    title: 'LOCAL AI INFERENCE',
    subtitle: 'CUDA Kernels, Flash Attention & Quantization',
    creator: 'Sofia Al-Mansoor',
    price: '$169',
    level: 'ADVANCED',
    img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'distributed',
    tag: 'PROTOCOLS',
    title: 'DISTRIBUTED CONSENSUS',
    subtitle: 'Raft, Paxos & Byzantine Fault Tolerance',
    creator: 'Marcus K. Chen',
    price: 'FREE',
    level: 'FOUNDATIONAL',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'editorial',
    tag: 'DESIGN',
    title: 'EDITORIAL FRONTEND',
    subtitle: 'Awwwards SOTD Motion & Brutalist Layouts',
    creator: 'Yuki Tanaka',
    price: '$89',
    level: 'INTERMEDIATE',
    img: 'https://images.unsplash.com/photo-1618609378039-b572f64c5b42?auto=format&fit=crop&w=900&q=80',
    span: 'wide',
  },
];

function CourseTile({ tile, index }: { tile: CourseTile; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  const [hovered, setHovered] = useState(false);

  const colSpan =
    tile.span === 'wide' ? 'md:col-span-2' : tile.span === 'tall' ? 'row-span-2' : '';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, delay: index * 0.08, ease: [0.76, 0, 0.24, 1] }}
      className={`relative group border border-[#252529] overflow-hidden cursor-pointer ${colSpan}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ minHeight: tile.span === 'tall' ? '480px' : '280px' }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          src={tile.img}
          alt={tile.title}
          className="w-full h-full object-cover"
          animate={{ scale: hovered ? 1.0 : 1.05 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          style={{ filter: 'brightness(0.28) saturate(0.5)' }}
        />
      </div>

      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: hovered
            ? 'linear-gradient(to top, rgba(37,99,235,0.25) 0%, transparent 60%)'
            : 'linear-gradient(to top, rgba(7,7,9,0.85) 0%, transparent 60%)',
          opacity: 1,
        }}
      />

      <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20 px-2 py-0.5">
              {tile.tag}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#F3F4F6]/35">
              {tile.level}
            </span>
          </div>
          <motion.span
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 8 }}
            transition={{ duration: 0.3 }}
            className="font-mono text-[#2563EB] text-sm"
          >
            →
          </motion.span>
        </div>

        <div>
          <h3
            className="font-display font-black uppercase text-[#F3F4F6] leading-[0.9] tracking-tight mb-2 group-hover:text-white transition-colors"
            style={{ fontSize: 'clamp(22px, 2.8vw, 40px)' }}
          >
            {tile.title}
          </h3>
          <p className="font-body text-sm text-[#F3F4F6]/50 leading-snug mb-4">
            {tile.subtitle}
          </p>
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#F3F4F6]/35">
              {tile.creator}
            </div>
            <div
              className={`font-display font-black text-xl ${
                tile.price === 'FREE' ? 'text-[#2563EB]' : 'text-[#F3F4F6]'
              }`}
            >
              {tile.price}
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500"
        style={{
          background: 'linear-gradient(to right, transparent, #2563EB, transparent)',
          opacity: hovered ? 1 : 0,
        }}
      />
    </motion.div>
  );
}

export function MarketplaceGrid() {
  const headerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headerRef, { once: true, margin: '-15% 0px' });

  return (
    <section id="courses" className="relative z-10 w-full bg-[#070709] border-t border-[#252529]">
      <div className="flex items-center justify-between px-[2vw] py-4 border-b border-[#252529]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2563EB]">[03]</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#F3F4F6]/45">ASYMMETRIC MARKETPLACE</span>
        </div>
        <div className="hidden sm:flex items-center gap-5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#F3F4F6]/25">
            {MARKETPLACE_TILES.length} FEATURED COURSES
          </span>
          <Magnetic strength={0.3}>
            <a
              href="/courses"
              className="font-mono text-[10px] uppercase tracking-widest text-[#2563EB] hover:text-[#F3F4F6] transition-colors"
            >
              VIEW ALL →
            </a>
          </Magnetic>
        </div>
      </div>

      <div ref={headerRef} className="px-[2vw] py-16">
        <div className="flex items-end justify-between gap-8 mb-12">
          <div className="overflow-hidden">
            <motion.h2
              initial={{ y: '100%' }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
              className="font-display font-black uppercase text-[#F3F4F6] leading-[0.86] tracking-tight"
              style={{ fontSize: 'clamp(52px, 8vw, 130px)' }}
            >
              THE GRID
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="font-body text-sm text-[#F3F4F6]/40 max-w-[280px] text-right leading-relaxed hidden md:block"
          >
            Every tile is a vetted, creator-owned knowledge asset. No filler. No padding.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[#252529]">
          {MARKETPLACE_TILES.map((tile, i) => (
            <CourseTile key={tile.id} tile={tile} index={i} />
          ))}
        </div>
      </div>

      <div className="px-[2vw] pb-12 flex items-center justify-between border-t border-[#252529] pt-8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[#F3F4F6]/25">
          APEXLEARN MARKETPLACE — SERIES II — 2026
        </div>
        <Magnetic strength={0.4}>
          <a
            href="/courses"
            className="inline-flex items-center gap-3 px-8 py-4 border border-[#252529] text-[#F3F4F6] font-display font-black text-sm uppercase tracking-widest hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
          >
            EXPLORE ALL COURSES →
          </a>
        </Magnetic>
      </div>
    </section>
  );
}
