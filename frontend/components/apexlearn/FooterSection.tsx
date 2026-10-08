'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Magnetic } from './Magnetic';

const MARQUEE_ITEMS = [
  'UPLOAD', '✦', 'MONETIZE', '✦', 'STREAM', '✦', 'LEARN', '✦',
  'CREATE', '✦', 'GROW', '✦', 'TEACH', '✦', 'EARN', '✦',
  'UPLOAD', '✦', 'MONETIZE', '✦', 'STREAM', '✦', 'LEARN', '✦',
];

const LINKS = [
  { label: 'PLATFORM', href: '/courses' },
  { label: 'FOR CREATORS', href: '/instructor' },
  { label: 'PRICING', href: '/pricing' },
  { label: 'PRIVACY', href: '/privacy' },
  { label: 'TERMS', href: '/terms' },
];

export function FooterSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-12% 0px' });
  const [copied, setCopied] = useState(false);
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const update = () => {
      setLocalTime(
        new Date().toLocaleTimeString('en-US', {
          timeZone: 'Asia/Tashkent',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  const copyPhone = () => {
    navigator.clipboard.writeText('+998990991112');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer
      id="contact"
      ref={ref}
      className="relative z-10 w-full bg-[#070709] border-t border-[#252529] overflow-hidden"
    >
      <div className="overflow-hidden border-b border-[#252529]">
        <div className="flex animate-marquee-rtl whitespace-nowrap py-3">
          {MARQUEE_ITEMS.map((item, i) => (
            <span
              key={i}
              className={`shrink-0 px-5 font-display font-black text-xl uppercase tracking-wide ${
                item === '✦' ? 'text-[#2563EB]' : 'text-[#F3F4F6]/70'
              }`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="px-[2vw]">
        <div className="pt-16 pb-12 border-b border-[#252529]">
          <div className="flex items-center gap-3 mb-10">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2563EB]">[04]</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#F3F4F6]/35">CONTACT & DISPATCH</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
          >
            <h2
              className="font-display font-black uppercase text-[#F3F4F6] leading-[0.82] tracking-tighter"
              style={{ fontSize: 'clamp(52px, 10vw, 168px)' }}
            >
              LET'S
            </h2>
            <h2
              className="font-display font-black uppercase text-[#2563EB] leading-[0.82] tracking-tighter"
              style={{ fontSize: 'clamp(52px, 10vw, 168px)' }}
            >
              CONNECT
            </h2>
            <h2
              className="font-display font-black uppercase text-[#F3F4F6]/12 leading-[0.82] tracking-tighter"
              style={{ fontSize: 'clamp(52px, 10vw, 168px)' }}
            >
              NOW.
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#252529] divide-y md:divide-y-0 md:divide-x divide-[#252529]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.15 }}
            className="py-10 md:pr-10"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#F3F4F6]/30 mb-4">
              DIRECT LINE
            </div>
            <Magnetic strength={0.35}>
              <button onClick={copyPhone} className="group flex items-center gap-3 text-left">
                <span className="font-display font-black text-[#F3F4F6] tracking-tight group-hover:text-[#2563EB] transition-colors" style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}>
                  +998 99 099 1112
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#F3F4F6]/25 group-hover:text-[#2563EB] transition-colors">
                  {copied ? '✓ COPIED' : '⎘ COPY'}
                </span>
              </button>
            </Magnetic>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.26 }}
            className="py-10 md:px-10"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#F3F4F6]/30 mb-4">
              TELEGRAM NETWORK
            </div>
            <Magnetic strength={0.36}>
              <a
                href="https://t.me/astro_spectrum"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2"
              >
                <span className="font-display font-black text-[#F3F4F6] group-hover:text-[#2563EB] transition-colors" style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}>
                  @astro_spectrum
                </span>
                <span className="font-mono text-[10px] text-[#F3F4F6]/25 group-hover:text-[#2563EB] transition-colors">↗</span>
              </a>
            </Magnetic>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[#F3F4F6]/25">
              Join the community channel
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.37 }}
            className="py-10 md:pl-10"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#F3F4F6]/30 mb-4">
              LINKEDIN NETWORK
            </div>
            <Magnetic strength={0.36}>
              <a
                href="https://linkedin.com/in/astro_spectrum"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2"
              >
                <span className="font-display font-black text-[#F3F4F6] group-hover:text-[#2563EB] transition-colors" style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}>
                  @astro_spectrum
                </span>
                <span className="font-mono text-[10px] text-[#F3F4F6]/25 group-hover:text-[#2563EB] transition-colors">↗</span>
              </a>
            </Magnetic>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[#F3F4F6]/25">
              Professional network profile
            </div>
          </motion.div>
        </div>

        <div className="py-10 border-b border-[#252529] flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Magnetic strength={0.42}>
            <a
              href="/auth"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#2563EB] text-white font-display font-black text-base uppercase tracking-widest hover:bg-[#F3F4F6] hover:text-[#070709] transition-colors"
            >
              BEGIN YOUR JOURNEY →
            </a>
          </Magnetic>
          <Magnetic strength={0.32}>
            <a
              href="/instructor"
              className="inline-flex items-center gap-3 px-10 py-5 border border-[#252529] text-[#F3F4F6] font-display font-bold text-base uppercase tracking-widest hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
            >
              BECOME A CREATOR
            </a>
          </Magnetic>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between py-8 gap-8">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-mono text-[11px] uppercase tracking-widest text-[#F3F4F6]/35 hover:text-[#2563EB] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 font-mono text-[10px] uppercase tracking-widest text-[#F3F4F6]/25">
            <span>LOCAL: {localTime} UTC+05</span>
            <span>© 2026 APEXLEARN. ALL RIGHTS RESERVED.</span>
          </div>
        </div>

        <div className="overflow-hidden pb-0 -mx-[2vw]">
          <div
            className="font-display font-black uppercase text-[#F3F4F6]/[0.025] leading-none tracking-tight select-none whitespace-nowrap"
            style={{ fontSize: 'clamp(80px, 18vw, 280px)' }}
          >
            APEXLEARN
          </div>
        </div>
      </div>
    </footer>
  );
}
