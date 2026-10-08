'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Magnetic } from './Magnetic';
import { useLenis } from './LenisProvider';

const HEADLINE_LINES = ['STREAM', 'RAW', 'INTELLECT'];

const HERO_STATS = [
  { label: 'ELITE CREATORS', value: '4,200+' },
  { label: 'COURSES LIVE', value: '18,400+' },
  { label: 'KNOWLEDGE HOURS', value: '1.2M' },
];

export function HeroSection() {
  const { scrollTo } = useLenis();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      id="hero"
      className="relative z-10 min-h-screen w-full bg-transparent pt-[60px] overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(37,37,41,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(37,37,41,0.18) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(37,99,235,0.07) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(7,7,9,0.96) 0%, rgba(7,7,9,0.65) 45%, transparent 75%)',
        }}
      />

      <div className="relative z-10 flex flex-col justify-between min-h-[calc(100vh-60px)] px-[2vw] md:px-[3vw] py-10 md:py-16 max-w-[55vw] lg:max-w-[52vw]">
        {mounted && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#F3F4F6]/45">
              Series II — Inaugural Drop — 2026
            </span>
          </motion.div>
        )}

        <div className="flex-1 flex flex-col justify-center py-8">
          <div>
            {HEADLINE_LINES.map((line, i) => (
              <div key={line} className="overflow-hidden">
                {mounted ? (
                  <motion.div
                    initial={{ y: '105%' }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 1.05,
                      delay: 0.18 + i * 0.13,
                      ease: [0.76, 0, 0.24, 1],
                    }}
                  >
                    <h1
                      className="font-display font-black uppercase leading-[0.86] tracking-[-0.02em] text-[#F3F4F6]"
                      style={{ fontSize: 'clamp(72px, 11vw, 176px)' }}
                    >
                      {line}
                    </h1>
                  </motion.div>
                ) : (
                  <h1
                    className="font-display font-black uppercase leading-[0.86] tracking-[-0.02em] text-[#F3F4F6]"
                    style={{ fontSize: 'clamp(72px, 11vw, 176px)' }}
                  >
                    {line}
                  </h1>
                )}
              </div>
            ))}
          </div>

          {mounted && (
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="mt-7 max-w-sm font-body text-base md:text-lg text-[#F3F4F6]/55 leading-relaxed"
            >
              Independent creators upload elite knowledge. Premium learners access it on demand.
              The marketplace that rewards ambition on both sides.
            </motion.p>
          )}
        </div>

        {mounted && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.78 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10"
            >
              <Magnetic strength={0.38}>
                <a
                  href="/auth"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#2563EB] text-white font-display font-black text-base uppercase tracking-widest hover:bg-[#F3F4F6] hover:text-[#070709] transition-colors"
                >
                  START CREATING
                  <span className="text-xl">→</span>
                </a>
              </Magnetic>
              <Magnetic strength={0.3}>
                <a
                  href="/courses"
                  className="inline-flex items-center gap-3 px-8 py-4 border border-[#252529] text-[#F3F4F6] font-display font-bold text-base uppercase tracking-widest hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
                >
                  BROWSE COURSES
                </a>
              </Magnetic>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.95 }}
              className="grid grid-cols-3 border-t border-[#252529]"
            >
              {HERO_STATS.map((s, i) => (
                <div
                  key={s.label}
                  className={`py-5 pr-5 ${i > 0 ? 'border-l border-[#252529] pl-5' : ''}`}
                >
                  <div
                    className="font-display font-black text-[#2563EB]"
                    style={{ fontSize: 'clamp(24px, 3vw, 40px)' }}
                  >
                    {s.value}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[#F3F4F6]/35 mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </div>

      <div className="absolute right-[2vw] bottom-[12vh] z-20 flex flex-col items-end gap-2 pointer-events-none">
        <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#F3F4F6]/25 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-[#2563EB] animate-pulse" />
          KOENIGSEGG AGERA R
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-[#F3F4F6]/15">
          INTERACTIVE 3D — SCROLL TO DRIVE
        </div>
      </div>

      <div className="absolute bottom-6 left-[2vw] z-20 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#F3F4F6]/30">
        <span className="animate-bounce inline-block">↓</span>
        <span>SCROLL FOR MORE</span>
      </div>

      <div className="absolute top-6 right-[2vw] z-20 text-[#2563EB]/50 font-mono text-xs leading-none">+</div>
      <div className="absolute bottom-6 right-[2vw] z-20 text-[#2563EB]/50 font-mono text-xs leading-none">+</div>
    </section>
  );
}
