'use client';

import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Magnetic } from './Magnetic';
import { useLenis } from './LenisProvider';
import { audioSynth } from './AudioSynth';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function StructuralFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const giantTextRef = useRef<HTMLHeadingElement>(null);
  const { scrollTo } = useLenis();

  const [localTime, setLocalTime] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // GSAP ScrollTrigger for giant typographic unmasking & parallax
  useEffect(() => {
    const footerEl = footerRef.current;
    const textEl = giantTextRef.current;
    if (!footerEl || !textEl) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        textEl,
        {
          yPercent: 30,
          opacity: 0.3,
        },
        {
          yPercent: 0,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerEl,
            start: 'top 85%',
            end: 'bottom bottom',
            scrub: 1,
          },
        }
      );
    }, footerEl);

    return () => ctx.revert();
  }, []);

  const copyEmail = () => {
    audioSynth.playTick(1800, 0.08);
    navigator.clipboard?.writeText('studio@apexlearn.architecture');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const outboundLinks = [
    { label: 'TWITTER / X', href: 'https://twitter.com' },
    { label: 'GITHUB', href: 'https://github.com' },
    { label: 'ARE.NA', href: 'https://are.na' },
    { label: 'AWWWARDS', href: 'https://awwwards.com' },
    { label: 'DOCUMENTATION', href: '/docs' },
  ];

  return (
    <footer
      id="footer"
      ref={footerRef}
      className="relative w-full pt-16 sm:pt-24 pb-6 px-3 sm:px-6 md:px-8 bg-[#0D0D0D] border-t border-[#F5F5F3]/15 overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Viewport extreme edge section label */}
      <div className="w-full flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#F5F5F3]/40 border-b border-[#F5F5F3]/10 pb-4 mb-12">
        <div className="flex items-center gap-3">
          <span className="text-[#FF3E00] font-bold">[04]</span>
          <span>STRUCTURAL FOOTER</span>
          <span className="text-[#F5F5F3]/20">/</span>
          <span>TELEMETRY & ANCHORS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#FF3E00]">●</span>
          <span>EDGE COORDINATES ACTIVE</span>
        </div>
      </div>

      {/* Grid: Coordinates & Dispatch Channel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 sm:mb-24">
        {/* Left Column: System Coordinates & Diagnostics (md: 6 cols) */}
        <div className="md:col-span-6 flex flex-col justify-between font-mono text-xs uppercase text-[#F5F5F3]/70 space-y-4">
          <div>
            <div className="text-[10px] text-[#FF3E00] tracking-widest mb-1">
              PHYSICAL COORDINATES:
            </div>
            <div className="text-[#F5F5F3] text-sm sm:text-base font-bold tracking-tight">
              41.2995° N, 69.2401° E // ELEVATION: 450M
            </div>
            <div className="text-[10px] text-[#F5F5F3]/40 mt-1">
              LATITUDE & LONGITUDE VERIFIED // SPATIAL CANVAS
            </div>
          </div>

          <div className="border-t border-[#F5F5F3]/10 pt-4">
            <div className="text-[10px] text-[#FF3E00] tracking-widest mb-1">
              SYSTEM LOCAL TIME:
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#F5F5F3] tracking-wider">
              {localTime || '16:17:34'} <span className="text-xs text-[#FF3E00]">UTC+05:00</span>
            </div>
          </div>

          <div className="border-t border-[#F5F5F3]/10 pt-4 text-[10px] text-[#F5F5F3]/40 space-y-1">
            <div>FRAME PIPELINE: GSAP TICKER 3.15 + LENIS V1.3</div>
            <div>SECURITY DIGEST: SHA-256 0x904F...B881</div>
            <div>STATUS: ZERO RENDER OVERHEAD</div>
          </div>
        </div>

        {/* Right Column: Floating Magnetic Utility Anchors (md: 6 cols) */}
        <div className="md:col-span-6 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF3E00] mb-3">
              OUTBOUND DIRECTORY:
            </div>

            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              {outboundLinks.map((link) => (
                <Magnetic key={link.label} strength={0.35} asPill>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#F5F5F3]/20 bg-[#0D0D0D] font-mono text-[11px] uppercase tracking-wider text-[#F5F5F3] hover:border-[#FF3E00] hover:text-[#0D0D0D] hover:bg-[#FF3E00] transition-all duration-300"
                  >
                    <span>{link.label}</span>
                    <span className="text-xs">↗</span>
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>

          {/* Copy Address Channel */}
          <div className="mt-8 border-t border-[#F5F5F3]/10 pt-5">
            <div className="font-mono text-[10px] uppercase text-[#F5F5F3]/40 mb-2">
              DISPATCH TERMINAL:
            </div>
            <div className="flex items-center gap-3">
              <Magnetic strength={0.4} asPill>
                <button
                  onClick={copyEmail}
                  className="px-5 py-2.5 rounded-full border border-[#FF3E00] text-[#FF3E00] font-mono text-xs uppercase font-bold tracking-wider hover:bg-[#FF3E00] hover:text-[#0D0D0D] transition-all flex items-center gap-2"
                >
                  <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY DISPATCH FREQUENCY'}</span>
                  <span>{copied ? '✓' : '⎘'}</span>
                </button>
              </Magnetic>

              {/* Back to Top Magnetic Anchor */}
              <Magnetic strength={0.45} asPill>
                <button
                  onClick={() => {
                    audioSynth.playTick(2000, 0.08);
                    scrollTo(0);
                  }}
                  className="w-10 h-10 rounded-full border border-[#F5F5F3]/20 flex items-center justify-center text-[#F5F5F3] hover:border-[#FF3E00] hover:text-[#FF3E00] transition-colors"
                  aria-label="Back to top"
                >
                  ↑
                </button>
              </Magnetic>
            </div>
          </div>
        </div>
      </div>

      {/* Giant Typographic Block kissing the bottom viewport edge */}
      <div className="w-full border-t border-[#F5F5F3]/15 pt-4 sm:pt-6 overflow-hidden">
        <h2
          ref={giantTextRef}
          className="font-['Syne',sans-serif] font-black uppercase text-[#F5F5F3] text-[13.5vw] sm:text-[14.2vw] leading-[0.8] tracking-[-0.05em] text-center will-change-transform select-none"
        >
          RADICAL FORM
        </h2>
      </div>

      {/* Absolute Bottom Border Bar */}
      <div className="w-full flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-[#F5F5F3]/30 pt-3 border-t border-[#F5F5F3]/10 mt-2">
        <span>© 2026 APEX ARCHITECTURE. ALL RIGHTS RESERVED.</span>
        <span className="text-[#FF3E00]">AWWWARDS SOTD ARCHITECTURE</span>
        <span className="hidden sm:inline">END OF TRANSMISSION</span>
      </div>
    </footer>
  );
}
