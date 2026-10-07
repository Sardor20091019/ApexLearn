'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from './GlassCard';

export const GlassNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <nav
          className={`
            relative flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300
            ${
              scrolled
                ? 'bg-white/[0.09] dark:bg-black/[0.35] backdrop-blur-2xl border border-white/20 shadow-[0_16px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                : 'bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.15)]'
            }
          `}
        >
          {/* Brand Logo with prismatic glass glow */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow duration-300">
              <div className="w-full h-full rounded-[15px] bg-[#0c0c16]/80 backdrop-blur-sm flex items-center justify-center p-1.5 overflow-hidden">
                <img
                  src="/images/image.png"
                  alt="ApexLearn Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-purple-200 transition-colors">
                Apex<span className="text-purple-400 font-light">Learn</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-white/50 font-bold -mt-1">
                visionOS 2.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-lg">
            {['Overview', 'Architecture', 'Features', 'Pricing', 'Documentation'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/auth"
              className="px-4 py-2 rounded-full text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/dashboard"
              className="relative group overflow-hidden px-5 py-2.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 border border-white/30 shadow-[0_4px_20px_rgba(147,51,234,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:brightness-110 active:scale-95 transition-all duration-200"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Launch Space
                <span className="text-sm font-normal">→</span>
              </span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10 border border-white/15 text-white/80 hover:text-white"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2">
            <GlassCard variant="elevated" className="p-4 space-y-2">
              {['Overview', 'Architecture', 'Features', 'Pricing', 'Documentation'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-white/90 hover:bg-white/10"
                >
                  {item}
                </a>
              ))}
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <Link
                  href="/auth"
                  className="w-full py-2.5 text-center text-sm font-semibold text-white/80 hover:bg-white/10 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full py-2.5 text-center text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl shadow-lg"
                >
                  Launch Space
                </Link>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </header>
  );
};
