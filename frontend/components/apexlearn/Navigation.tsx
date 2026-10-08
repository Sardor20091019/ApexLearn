'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLenis } from './LenisProvider';
import { Magnetic } from './Magnetic';

const NAV_LINKS = [
  { label: 'PLATFORM', href: '#ecosystem' },
  { label: 'COURSES', href: '#marketplace' },
  { label: 'CREATORS', href: '#ecosystem' },
  { label: 'INDEX', href: '#footer' },
];

export function Navigation() {
  const { scrollTo, scrollProgress } = useLenis();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setScrolled(scrollProgress > 0.02);
  }, [scrollProgress]);

  const goTo = (href: string) => {
    setMenuOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) scrollTo(el, { offset: -60 });
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#070709]/90 backdrop-blur-md border-b border-[#252529]'
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-stretch justify-between h-[60px] border-b border-[#252529]">
          {/* Brand */}
          <div className="flex items-center px-6 border-r border-[#252529] shrink-0">
            <button
              onClick={() => scrollTo(0)}
              className="font-display font-black text-2xl tracking-[0.06em] text-[#F3F4F6] uppercase hover:text-[#2563EB] transition-colors"
            >
              APEX<span className="text-[#2563EB]">LEARN</span>
            </button>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-stretch flex-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => goTo(link.href)}
                className="flex items-center px-6 font-mono text-[11px] font-medium uppercase tracking-widest text-[#F3F4F6]/60 hover:text-[#F3F4F6] hover:bg-[#252529]/30 border-r border-[#252529] transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex-1" />
          </div>

          {/* Right CTA */}
          <div className="flex items-stretch border-l border-[#252529]">
            <a
              href="/auth"
              className="hidden md:flex items-center px-5 font-mono text-[11px] uppercase tracking-widest text-[#F3F4F6]/60 hover:text-[#F3F4F6] border-r border-[#252529] hover:bg-[#252529]/30 transition-colors"
            >
              LOG IN
            </a>
            <Magnetic strength={0.3}>
              <a
                href="/auth"
                className="flex items-center px-6 h-[60px] font-display font-bold text-[13px] uppercase tracking-widest text-[#070709] bg-[#2563EB] hover:bg-[#F3F4F6] transition-colors"
              >
                START FREE
              </a>
            </Magnetic>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden flex items-center px-5 text-[#F3F4F6] border-l border-[#252529]"
          >
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {menuOpen ? 'CLOSE' : 'MENU'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-40 bg-[#070709] pt-[60px] flex flex-col"
          >
            <div className="flex-1 flex flex-col border-t border-[#252529]">
              {NAV_LINKS.map((link, i) => (
                <button
                  key={link.label}
                  onClick={() => goTo(link.href)}
                  className="flex items-center justify-between px-6 py-8 border-b border-[#252529] font-display font-bold text-[9vw] uppercase tracking-tight text-[#F3F4F6] hover:text-[#2563EB] text-left transition-colors"
                >
                  <span>{link.label}</span>
                  <span className="font-mono text-[11px] text-[#F3F4F6]/30">0{i + 1}</span>
                </button>
              ))}
            </div>
            <div className="px-6 py-8">
              <a
                href="/auth"
                className="block w-full text-center py-4 font-display font-black text-xl uppercase tracking-widest text-[#070709] bg-[#2563EB]"
              >
                START FOR FREE
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
