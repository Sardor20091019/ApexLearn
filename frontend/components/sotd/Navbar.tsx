'use client';

import React, { useState, useEffect } from 'react';
import { Magnetic } from './Magnetic';
import { audioSynth } from './AudioSynth';
import { useLenis } from './LenisProvider';

interface NavbarProps {
  onOpenDossier?: () => void;
}

export function Navbar({ onOpenDossier }: NavbarProps) {
  const { scrollTo } = useLenis();
  const [audioActive, setAudioActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSound = () => {
    const muted = audioSynth.toggleMute();
    setAudioActive(!muted);
  };

  const navLinks = [
    { label: 'ARCH // 01', target: '#hero' },
    { label: 'MOSAIC', target: '#mosaic' },
    { label: 'SHOWCASE', target: '#showcase' },
    { label: 'STRUCTURAL', target: '#footer' },
  ];

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex items-center justify-center px-3 sm:px-6 pointer-events-none">

      <nav
        className={`pointer-events-auto flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-7 py-2.5 sm:py-3 rounded-full border border-[#F5F5F3]/15 bg-[#0D0D0D]/65 backdrop-blur-[20px] transition-all duration-500 shadow-2xl ${
          scrolled
            ? 'scale-[0.98] border-[#F5F5F3]/25 bg-[#0D0D0D]/85 shadow-[#0D0D0D]/80'
            : 'scale-100'
        }`}
      >
        {}
        <Magnetic strength={0.25} asPill>
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollTo(0);
            }}
            className="flex items-center gap-2 group font-mono text-xs uppercase tracking-tight text-[#F5F5F3]"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF3E00] animate-pulse" />
            <span className="font-bold tracking-widest text-[#F5F5F3] group-hover:text-[#FF3E00] transition-colors">
              APEX
            </span>
            <span className="text-[10px] text-[#F5F5F3]/40 hidden md:inline font-mono">
              [SOTD-26]
            </span>
          </a>
        </Magnetic>

        {}
        <div className="h-3 w-[1px] bg-[#F5F5F3]/15 hidden sm:block" />

        {}
        <div className="flex items-center gap-1 sm:gap-2 text-[11px] font-mono uppercase tracking-wider text-[#F5F5F3]/70">
          {navLinks.map((item) => (
            <Magnetic key={item.label} strength={0.3} textStrength={0.15} asPill>
              <button
                onClick={() => scrollTo(item.target)}
                className="px-2.5 py-1 rounded-full hover:text-[#0D0D0D] hover:bg-[#F5F5F3] transition-colors duration-200"
              >
                {item.label}
              </button>
            </Magnetic>
          ))}
        </div>

        {}
        <div className="h-3 w-[1px] bg-[#F5F5F3]/15 hidden sm:block" />

        {}
        <div className="flex items-center gap-2">
          {}
          <Magnetic strength={0.35} asPill>
            <button
              onClick={toggleSound}
              aria-label="Toggle haptic audio"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase border transition-all ${
                audioActive
                  ? 'border-[#FF3E00] text-[#FF3E00] bg-[#FF3E00]/10'
                  : 'border-[#F5F5F3]/20 text-[#F5F5F3]/50 hover:text-[#F5F5F3]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${audioActive ? 'bg-[#FF3E00]' : 'bg-[#F5F5F3]/30'}`} />
              <span className="hidden sm:inline">HAPTICS</span>
              <span>{audioActive ? 'ON' : 'OFF'}</span>
            </button>
          </Magnetic>

          {}
          <Magnetic strength={0.4} asPill>
            <a
              href="#footer"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('#footer');
              }}
              className="px-3.5 py-1 rounded-full text-[11px] font-mono uppercase font-bold text-[#0D0D0D] bg-[#FF3E00] hover:bg-[#F5F5F3] hover:text-[#0D0D0D] transition-colors shadow-lg"
            >
              DISPATCH
            </a>
          </Magnetic>
        </div>
      </nav>
    </header>
  );
}
