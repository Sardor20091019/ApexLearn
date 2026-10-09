'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LenisProvider, useLenis } from '../components/apexlearn/LenisProvider';
import { ThemeProvider, useTheme } from '../components/apexlearn/ThemeProvider';
import { Magnetic } from '../components/apexlearn/Magnetic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Courses', href: '#courses' },
  { label: 'Creators', href: '#creators' },
  { label: 'Contact', href: '#contact' },
];

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors"
      style={{ color: 'var(--text-muted)' }}
    >
      <span
        className="relative inline-flex w-9 h-5 rounded-full transition-colors duration-400 shrink-0"
        style={{ background: isDark ? 'var(--accent)' : 'var(--border)', border: '1px solid var(--border)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300"
          style={{
            background: isDark ? '#fff' : 'var(--text)',
            transform: isDark ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
      </span>
      <span className="hidden sm:block">{isDark ? 'red' : 'Light'}</span>
    </button>
  );
}

function Navbar() {
  const { scrollTo, scrollProgress } = useLenis();
  const { isDark } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setScrolled(scrollProgress > 0.015); }, [scrollProgress]);

  const go = (href: string) => {
    setMenuOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) scrollTo(el, { offset: -64 });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
      style={{
        background: scrolled ? (isDark ? 'rgba(7,7,9,0.82)' : 'rgba(240,237,230,0.88)') : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      <div className="flex items-center justify-between px-8 md:px-12 h-16">
        <button
          onClick={() => scrollTo(0)}
          className="font-display font-black text-xl uppercase tracking-widest transition-colors"
          style={{ color: 'var(--text)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}
        >
          APEX<span style={{ color: 'var(--accent)' }}>LEARN</span>
        </button>

        <div className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map(l => (
            <button
              key={l.label}
              onClick={() => go(l.href)}
              className="font-mono text-[11px] uppercase tracking-[0.2em] transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <ThemeToggle />
          <a
            href="/auth"
            className="hidden md:block font-mono text-[11px] uppercase tracking-widest transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Log in
          </a>
          <Magnetic strength={0.3}>
            <a
              href="/auth"
              className="font-display font-bold text-[12px] uppercase tracking-widest px-5 py-2.5 transition-colors"
              style={{ background: 'var(--accent)', color: '#fff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--text)'; (e.currentTarget as HTMLElement).style.color = 'var(--bg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            >
              Start Free
            </a>
          </Magnetic>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden font-mono text-[11px] uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {menuOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 z-40 flex flex-col pt-8"
          style={{ background: 'var(--bg)' }}
        >
          {NAV_LINKS.map(l => (
            <button
              key={l.label}
              onClick={() => go(l.href)}
              className="px-8 py-6 text-left font-display font-black text-[11vw] uppercase tracking-tight transition-colors"
              style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}
            >
              {l.label}
            </button>
          ))}
          <div className="px-8 py-8 mt-auto">
            <a
              href="/auth"
              className="block text-center py-4 font-display font-black text-xl uppercase tracking-widest text-white"
              style={{ background: 'var(--accent)' }}
            >
              START FREE
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

function ScrollIndicator() {
  const { scrollProgress } = useLenis();
  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3 pointer-events-none">
      <div className="w-px h-24 relative overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: `${scrollProgress * 100}%`, background: 'var(--accent)' }}
        />
      </div>
      <span
        className="font-mono text-[8px] uppercase tracking-widest [writing-mode:vertical-rl]"
        style={{ color: 'var(--text-faint)' }}
      >
        {String(Math.round(scrollProgress * 100)).padStart(3, '0')}
      </span>
    </div>
  );
}

function ScrollChapterText({ children, id, align = 'left' }: {
  children: React.ReactNode;
  id: string;
  align?: 'left' | 'right' | 'center';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    gsap.set(el, { opacity: 0, y: 40 });
    ScrollTrigger.create({
      trigger: el.parentElement,
      start: 'top 70%',
      end: 'bottom 30%',
      onEnter:     () => gsap.to(el, { opacity: 1, y: 0,   duration: 1.1, ease: 'power3.out' }),
      onLeave:     () => gsap.to(el, { opacity: 0, y: -30, duration: 0.6, ease: 'power2.in' }),
      onEnterBack: () => gsap.to(el, { opacity: 1, y: 0,   duration: 0.8, ease: 'power2.out' }),
      onLeaveBack: () => gsap.to(el, { opacity: 0, y: 40,  duration: 0.5, ease: 'power2.in' }),
    });
    return () => ScrollTrigger.getAll().forEach(t => t.vars.trigger === el.parentElement && t.kill());
  }, []);

  const alignClass = align === 'right' ? 'items-end text-right' : align === 'center' ? 'items-center text-center' : 'items-start text-left';
  return (
    <div id={id} className={`flex flex-col ${alignClass}`}>
      <div ref={ref}>{children}</div>
    </div>
  );
}

function HeroChapter() {
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el,
        { y: '100%', opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, delay: 0.2 + i * 0.14, ease: 'power4.out' }
      );
    });
  }, []);

  return (
    <section className="relative flex flex-col justify-end min-h-screen px-8 md:px-16 pb-20">
      <div className="max-w-3xl">
        {['LEARN', 'CREATE', 'INVENT'].map((word, i) => (
          <div key={word} className="overflow-hidden">
            <div
              ref={el => { lineRefs.current[i] = el; }}
              className="font-display font-black uppercase leading-[0.87] tracking-tighter"
              style={{ fontSize: 'clamp(76px, 13vw, 200px)', color: 'var(--text)' }}
            >
              {word}
            </div>
          </div>
        ))}
        <div className="overflow-hidden mt-8">
          <div
            ref={el => { lineRefs.current[3] = el; }}
            className="font-body text-lg leading-relaxed max-w-md"
            style={{ color: 'var(--text-muted)' }}
          >
           Learn from the best minds in tech, design, and science. Build your skills, create your own courses, and share your knowledge with the world. LEARN ON APEXLEARN.
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce-slow pointer-events-none">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-faint)' }}>
          Scroll 
        </span>
        <div className="w-px h-12" style={{ background: 'linear-gradient(to bottom, var(--text-muted), transparent)' }} />
      </div>
    </section>
  );
}

function PlatformChapter() {
  return (
    <section id="platform" className="min-h-screen flex flex-col justify-center px-8 md:px-16 py-32">
      <ScrollChapterText id="platform-text">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] mb-6" style={{ color: 'var(--accent)' }}>
          01 — Platform
        </p>
        <h2
          className="font-display font-black uppercase leading-[0.87] tracking-tighter mb-8"
          style={{ fontSize: 'clamp(48px, 7vw, 110px)', color: 'var(--text)' }}
        >
          UPLOAD<br />&amp; MONETIZE
        </h2>
        <p className="font-body text-lg leading-relaxed max-w-lg mb-12" style={{ color: 'var(--text-muted)' }}>
          The infrastructure for independent knowledge entrepreneurs. Go from zero to revenue in under 20 minutes. Multi-format video, adaptive streaming, Stripe Connect, full analytics.
        </p>
        <div className="grid grid-cols-2 max-w-lg" style={{ gap: '1px', background: 'var(--border)' }}>
          {[
            ['⬆', 'Instant Upload', 'HLS adaptive bitrate, any format'],
            ['▤', 'Course Builder', 'Sections, drip, gating — your logic'],
            ['◈', 'Payments', 'Stripe Connect, 8% platform fee only'],
            ['∿', 'Analytics', 'Per-lesson watch depth, drop-off maps'],
          ].map(([icon, title, desc]) => (
            <div key={title as string} className="p-6" style={{ background: 'var(--bg)' }}>
              <div className="text-lg mb-2" style={{ color: 'var(--accent)' }}>{icon}</div>
              <div className="font-display font-bold text-sm uppercase tracking-wide mb-1" style={{ color: 'var(--text)' }}>{title}</div>
              <div className="font-mono text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </ScrollChapterText>
    </section>
  );
}

function CoursesChapter() {
  const COURSES = [
    { tag: 'GRAPHICS',  title: 'SPATIAL WEBGL ALCHEMY',      creator: 'Evelyn Soroka',    price: '$129' },
    { tag: 'SYSTEMS',   title: 'BARE-METAL RUST',             creator: 'Dr. Nikolai Vance', price: '$149' },
    { tag: 'AI / ML',   title: 'LOCAL AI INFERENCE',          creator: 'Sofia Al-Mansoor',  price: '$169' },
    { tag: 'PROTOCOLS', title: 'DISTRIBUTED CONSENSUS',       creator: 'Marcus K. Chen',    price: 'FREE' },
    { tag: 'DESIGN',    title: 'EDITORIAL FRONTEND',          creator: 'Yuki Tanaka',       price: '$89' },
    { tag: 'CRYPTO',    title: 'BYZANTINE FAULT TOLERANCE',   creator: 'M. K. Chen',        price: 'FREE' },
  ];

  return (
    <section id="courses" className="min-h-screen flex flex-col justify-center px-8 md:px-16 py-32">
      <ScrollChapterText id="courses-text" align="right">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] mb-6" style={{ color: 'var(--accent)' }}>
          02 — Courses
        </p>
        <h2
          className="font-display font-black uppercase leading-[0.87] tracking-tighter mb-12"
          style={{ fontSize: 'clamp(48px, 7vw, 110px)', color: 'var(--text)' }}
        >
          RAW<br />INTELLECT
        </h2>
        <div className="w-full max-w-2xl ml-auto" style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
          {COURSES.map(c => (
            <div
              key={c.title}
              className="group flex items-center justify-between gap-6 px-6 py-4 cursor-pointer transition-colors"
              style={{ background: 'var(--bg)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg)')}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="font-mono text-[9px] uppercase tracking-widest w-14 shrink-0" style={{ color: 'var(--accent)' }}>
                  {c.tag}
                </span>
                <span className="font-display font-bold text-base uppercase tracking-tight truncate transition-colors" style={{ color: 'var(--text)' }}>
                  {c.title}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="font-mono text-[10px] hidden sm:block" style={{ color: 'var(--text-muted)' }}>{c.creator}</span>
                <span className="font-display font-black text-base" style={{ color: c.price === 'FREE' ? 'var(--accent)' : 'var(--text)' }}>
                  {c.price}
                </span>
                <span className="transition-colors" style={{ color: 'var(--text-faint)' }}>→</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <Magnetic strength={0.3}>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-3 px-7 py-3 font-display font-bold text-sm uppercase tracking-widest transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            >
              View all courses →
            </a>
          </Magnetic>
        </div>
      </ScrollChapterText>
    </section>
  );
}

function CreatorsChapter() {
  const STATS = [
    { value: '4,200+', label: 'Elite Creators' },
    { value: '18,400+', label: 'Courses Live' },
    { value: '1.2M', label: 'Knowledge Hours' },
    { value: '8%', label: 'Platform Fee Only' },
  ];

  return (
    <section id="creators" className="min-h-screen flex flex-col justify-center px-8 md:px-16 py-32">
      <ScrollChapterText id="creators-text">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] mb-6" style={{ color: 'var(--accent)' }}>
          03 — Creators
        </p>
        <h2
          className="font-display font-black uppercase leading-[0.87] tracking-tighter mb-8"
          style={{ fontSize: 'clamp(48px, 7vw, 110px)', color: 'var(--text)' }}
        >
          BUILD YOUR<br />REVENUE ENGINE
        </h2>
        <p className="font-body text-lg leading-relaxed max-w-lg mb-14" style={{ color: 'var(--text-muted)' }}>
          Independent creators keep what they earn. One platform, direct to your audience. No approval committees, no restrictions.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 max-w-2xl mb-12" style={{ gap: '1px', background: 'var(--border)' }}>
          {STATS.map(s => (
            <div key={s.label} className="px-6 py-7" style={{ background: 'var(--bg)' }}>
              <div
                className="font-display font-black leading-none mb-2"
                style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', color: 'var(--accent)' }}
              >
                {s.value}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <Magnetic strength={0.35}>
          <a
            href="/instructor"
            className="inline-flex items-center gap-3 px-9 py-4 font-display font-black text-sm uppercase tracking-widest transition-colors text-white"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--text)'; (e.currentTarget as HTMLElement).style.color = 'var(--bg)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          >
            Launch your course →
          </a>
        </Magnetic>
      </ScrollChapterText>
    </section>
  );
}

function ContactChapter() {
  const [copied, setCopied] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const upd = () => setTime(new Date().toLocaleTimeString('en-US', {
      timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hour12: false,
    }));
    upd();
    const iv = setInterval(upd, 1000);
    return () => clearInterval(iv);
  }, []);

  const copy = () => {
    navigator.clipboard.writeText('+998990991112');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contact" className="min-h-screen flex flex-col justify-end px-8 md:px-16 pb-20 py-32">
      <ScrollChapterText id="contact-text">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] mb-6" style={{ color: 'var(--accent)' }}>
          04 — Contact
        </p>

        {[
          { text: "LET'S", accent: false },
          { text: 'CONNECT', accent: true },
          { text: 'NOW.', faint: true },
        ].map(({ text, accent, faint }) => (
          <h2
            key={text}
            className="font-display font-black uppercase leading-[0.87] tracking-tighter mb-2"
            style={{
              fontSize: 'clamp(52px, 10vw, 170px)',
              color: accent ? 'var(--accent)' : faint ? 'var(--text-faint)' : 'var(--text)',
            }}
          >
            {text}
          </h2>
        ))}

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 max-w-4xl mb-12" style={{ gap: '1px', background: 'var(--border)' }}>
          {[
            { label: 'Direct Line', content: '+998 99 099 1112', sub: copied ? '✓ Copied' : '⎘ Copy', onClick: copy },
            { label: 'Telegram', content: '@astro_spectrum', sub: '↗ Open', href: 'https://t.me/astro_spectrum' },
            { label: 'LinkedIn', content: '@astro_spectrum', sub: '↗ Open', href: 'https://linkedin.com/in/astrospectrum' },
          ].map(item => (
            <div key={item.label} className="p-8" style={{ background: 'var(--bg)' }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-4" style={{ color: 'var(--text-faint)' }}>
                {item.label}
              </p>
              <Magnetic strength={0.3}>
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="group block">
                    <span
                      className="font-display font-black block transition-colors"
                      style={{ fontSize: 'clamp(16px, 2vw, 26px)', color: 'var(--text)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}
                    >
                      {item.content}
                    </span>
                    <span className="block font-mono text-[9px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-faint)' }}>
                      {item.sub}
                    </span>
                  </a>
                ) : (
                  <button onClick={item.onClick} className="text-left">
                    <span
                      className="font-display font-black block transition-colors"
                      style={{ fontSize: 'clamp(16px, 2vw, 26px)', color: 'var(--text)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}
                    >
                      {item.content}
                    </span>
                    <span className="block font-mono text-[9px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-faint)' }}>
                      {item.sub}
                    </span>
                  </button>
                )}
              </Magnetic>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-16">
          <Magnetic strength={0.4}>
            <a
              href="/auth"
              className="inline-flex items-center gap-3 px-9 py-4 font-display font-black text-sm uppercase tracking-widest transition-colors text-white"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--text)'; (e.currentTarget as HTMLElement).style.color = 'var(--bg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            >
              Begin your journey →
            </a>
          </Magnetic>
          <Magnetic strength={0.28}>
            <a
              href="/instructor"
              className="inline-flex items-center gap-3 px-9 py-4 font-display font-bold text-sm uppercase tracking-widest transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            >
              Become a creator
            </a>
          </Magnetic>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-y-4 gap-x-10 pt-10"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {[['Platform', '/courses'], ['Creators', '/instructor'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
              <a
                key={l} href={h}
                className="font-mono text-[10px] uppercase tracking-widest transition-colors"
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
              >
                {l}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-1 font-mono text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            <span>{time} UTC+05</span>
            <span>© 2026 APEXLEARN</span>
          </div>
        </div>

        <div className="overflow-hidden mt-8 -mx-8 md:-mx-16">
          <div
            className="font-display font-black uppercase leading-none tracking-tighter select-none whitespace-nowrap"
            style={{ fontSize: 'clamp(80px, 18vw, 300px)', color: 'var(--text-faint)', opacity: 0.35 }}
          >
            APEXLEARN
          </div>
        </div>
      </ScrollChapterText>
    </section>
  );
}

function PageContent() {
  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `linear-gradient(to right, var(--vignette-l) 0%, var(--vignette-m) 50%, var(--vignette-r) 100%)`,
        }}
      />

      <div className="relative z-10">
        <Navbar />
        <ScrollIndicator />
        <HeroChapter />
        <PlatformChapter />
        <CoursesChapter />
        <CreatorsChapter />
        <ContactChapter />
      </div>
    </>
  );
}

function LandingContainer() {
  const { theme } = useTheme();
  return (
    <div
      data-theme={theme}
      className="overflow-x-hidden min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <PageContent />
    </div>
  );
}

export default function ApexLearnLandingPage() {
  return (
    <ThemeProvider defaultTheme="light">
      <LenisProvider>
        <LandingContainer />
      </LenisProvider>
    </ThemeProvider>
  );
}