'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthToken, isTokenExpired } from '../lib/auth';

type ThemeStyle = 'white-glass' | 'dark-glass';

interface Course {
  id: string;
  title: string;
  description: string;
  price: string | number;
  thumbnailUrl?: string;
  imageUrl?: string;
  level?: string;
  ratingAverage?: number;
  enrollmentCount?: number;
  category?: { id: string; name: string };
  author?: { name: string; avatarUrl?: string };
}

export default function RootLandingPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(() => {
    if (typeof window === 'undefined') return 'dark-glass';
    const saved = localStorage.getItem('apex_theme_style');
    return (saved === 'white-glass' || saved === 'dark-glass') ? saved : 'dark-glass';
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (token && !isTokenExpired(token)) {
      setIsLoggedIn(true);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${API_URL}/courses?limit=4&sort=featured`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.data || []);
          setFeaturedCourses(items);
        }
      } catch (err) {
        console.error('Failed to load landing courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCatalog();
  }, [API_URL]);

  const toggleTheme = () => {
    const nextTheme: ThemeStyle = themeStyle === 'dark-glass' ? 'white-glass' : 'dark-glass';
    setThemeStyle(nextTheme);
    localStorage.setItem('apex_theme_style', nextTheme);
  };

  const theme = {
    'white-glass': {
      bg: 'bg-[#f4f6fa] text-slate-900',
      header: 'bg-white/75 border-b border-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
      card: 'bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.95)]',
      subCard: 'bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm',
      pill: 'bg-white/80 rounded-full backdrop-blur-xl border border-white/90 shadow-sm text-slate-900',
      buttonPrimary: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white font-bold rounded-2xl shadow-lg hover:brightness-105 active:scale-95 transition-all',
      textMuted: 'text-slate-600',
      heroGradient: 'from-blue-600/10 via-indigo-500/10 to-teal-400/10',
    },
    'dark-glass': {
      bg: 'bg-[#090b10] text-slate-100',
      header: 'bg-black/40 border-b border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      card: 'bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)]',
      subCard: 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-sm',
      pill: 'bg-white/10 rounded-full backdrop-blur-xl border border-white/15 shadow-sm text-slate-200',
      buttonPrimary: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-[0_8px_25px_rgba(147,51,234,0.35)] hover:brightness-110 active:scale-95 transition-all',
      textMuted: 'text-slate-400',
      heroGradient: 'from-violet-600/20 via-purple-500/15 to-cyan-400/10',
    },
  }[themeStyle];

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-x-clip ${theme.bg}`}>
      {/* Ambient Radial Mesh Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 sm:w-[520px] h-96 sm:h-[520px] rounded-full bg-gradient-to-br from-violet-600/20 to-fuchsia-600/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 sm:w-[500px] h-96 sm:h-[500px] rounded-full bg-gradient-to-bl from-cyan-500/15 to-blue-600/15 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 sm:w-[500px] h-96 sm:h-[500px] rounded-full bg-gradient-to-tr from-indigo-600/15 to-purple-600/15 blur-[130px]" />
      </div>

      {/* Sticky Top Frosted Glass Navbar */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${theme.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg p-0.5 bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400">
              <div className="w-full h-full rounded-[14px] bg-black/60 backdrop-blur-md flex items-center justify-center p-1">
                <img
                  src="/images/image.png"
                  alt="ApexLearn Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight leading-none">
                Apex<span className="text-violet-500">Learn</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                Spatial Academy
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
            <a href="#catalog" className="px-3.5 py-1.5 text-xs font-semibold rounded-full hover:bg-white/10 transition-colors">
              Courses
            </a>
            <a href="#features" className="px-3.5 py-1.5 text-xs font-semibold rounded-full hover:bg-white/10 transition-colors">
              Features
            </a>
            <a href="#pricing" className="px-3.5 py-1.5 text-xs font-semibold rounded-full hover:bg-white/10 transition-colors">
              Pricing
            </a>
            <Link href="/instructor" className="px-3.5 py-1.5 text-xs font-semibold rounded-full hover:bg-white/10 transition-colors text-violet-400 font-bold">
              Instructor Studio
            </Link>
          </nav>

          {/* Theme Switcher & Auth Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-2xl transition-all shadow-sm ${theme.pill} hover:scale-105 active:scale-95`}
              title={`Switch to ${themeStyle === 'dark-glass' ? 'White' : 'Dark'} Glass`}
              aria-label="Toggle Theme"
            >
              {themeStyle === 'dark-glass' ? '☀️' : '🌙'}
            </button>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className={`px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 ${theme.buttonPrimary}`}
              >
                <span>Dashboard</span>
                <span>→</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth"
                  className={`px-4 py-2 text-xs font-bold transition-all ${theme.pill} hover:bg-white/20`}
                >
                  Log In
                </Link>
                <Link
                  href="/auth"
                  className={`px-5 py-2 text-xs sm:text-sm font-bold ${theme.buttonPrimary}`}
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-24">
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-violet-500/15 border border-violet-400/30 text-violet-300 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span>Interactive Video Masterclasses & Verified Certifications</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]">
            Master In-Demand Skills with{' '}
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              Dimensional Clarity
            </span>
          </h1>

          <p className={`text-base sm:text-xl max-w-2xl mx-auto leading-relaxed ${theme.textMuted}`}>
            ApexLearn pairs ultra-crisp HD video streaming, exact duration tracking, and verified cryptographically-signed certificates in an elegant glassmorphism studio.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth"}
              className={`px-8 py-4 text-sm sm:text-base font-black shadow-2xl flex items-center gap-2.5 ${theme.buttonPrimary}`}
            >
              <span>{isLoggedIn ? 'Launch Classroom' : 'Start Learning Today'}</span>
              <span>→</span>
            </Link>
            <a
              href="#catalog"
              className={`px-6 py-4 text-sm font-bold transition-all ${theme.pill} hover:bg-white/20`}
            >
              Browse Catalog
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className={`mt-12 p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 ${theme.card}`}>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-violet-400">100%</div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-70 mt-1">Verified Video</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400">Instant</div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-70 mt-1">Certificates</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-fuchsia-400">Free</div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-70 mt-1">Preview Mode</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">24/7</div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-70 mt-1">Self-Paced</div>
            </div>
          </div>
        </section>

        {/* Live Course Showcase Section */}
        <section id="catalog" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
                Live Catalog
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-1">
                Featured Masterclasses
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5"
            >
              <span>View full catalog ({featuredCourses.length > 0 ? `${featuredCourses.length}+` : ''})</span>
              <span>→</span>
            </Link>
          </div>

          {loadingCourses ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
          ) : featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.map((c) => {
                const numPrice = Number(c.price || 0);
                const isFree = numPrice === 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => router.push(`/courses/${c.id}`)}
                    className={`group cursor-pointer overflow-hidden p-4 space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${theme.card}`}
                  >
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40">
                      <img
                        src={c.thumbnailUrl || c.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase backdrop-blur-md bg-black/60 text-white border border-white/20">
                        {isFree ? 'FREE' : `$${numPrice.toFixed(2)}`}
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md bg-black/60 text-slate-200">
                        {c.level || 'All Levels'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-violet-400">
                        {c.category?.name || 'Curriculum'}
                      </span>
                      <h3 className="text-sm font-bold line-clamp-2 group-hover:text-violet-400 transition-colors">
                        {c.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 ${theme.textMuted}`}>
                        {c.description || 'Comprehensive curriculum with high-definition video walkthroughs and verifiable credentials.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-current/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <span>★</span>
                        <span>{c.ratingAverage ? Number(c.ratingAverage).toFixed(1) : '5.0'}</span>
                      </div>
                      <span className="font-bold text-violet-400 group-hover:underline">
                        Explore →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`p-12 text-center rounded-3xl ${theme.card}`}>
              <p className="text-sm font-semibold opacity-70">
                Catalog initialized. Head to Instructor Studio to upload your first masterclass!
              </p>
            </div>
          )}
        </section>

        {/* Feature Highlights Grid */}
        <section id="features" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
              Platform Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Built for Immersive Mastery
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-8 space-y-4 ${theme.card}`}>
              <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center text-2xl">
                📺
              </div>
              <h3 className="text-lg font-bold">Direct CDN Streaming</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${theme.textMuted}`}>
                High-definition video delivery directly powered by edge networks. Scrub with instant byte-range latency and auto-extract precise durations.
              </p>
            </div>

            <div className={`p-8 space-y-4 ${theme.card}`}>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-2xl">
                🎓
              </div>
              <h3 className="text-lg font-bold">Verifiable Certificates</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${theme.textMuted}`}>
                Instantly generate digital certificates of completion upon 100% lecture progress, complete with QR validation and shareable URLs.
              </p>
            </div>

            <div className={`p-8 space-y-4 ${theme.card}`}>
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <h3 className="text-lg font-bold">Redis-Powered Catalog</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${theme.textMuted}`}>
                Lightning-fast queries, category filtering, search debounce, and instant cache invalidation powered by Upstash Redis.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Architecture */}
        <section id="pricing" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
              Simple Access
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Tuition That Scales With You
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className={`p-8 sm:p-10 space-y-6 flex flex-col justify-between ${theme.card}`}>
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Community Tier
                </span>
                <div className="text-4xl sm:text-5xl font-black">$0 <span className="text-sm font-normal opacity-60">forever</span></div>
                <p className={`text-xs sm:text-sm ${theme.textMuted}`}>
                  Access all free courses, video lectures, and open community modules with unlimited streaming.
                </p>
                <ul className="space-y-2.5 text-xs font-semibold pt-2">
                  <li className="flex items-center gap-2"><span>✓</span> Free tier video masterclasses</li>
                  <li className="flex items-center gap-2"><span>✓</span> Interactive player & speed control</li>
                  <li className="flex items-center gap-2"><span>✓</span> Personal lecture notes & discussion</li>
                </ul>
              </div>
              <Link
                href="/auth"
                className={`w-full py-3 text-center text-xs font-bold rounded-2xl transition-all ${theme.pill} hover:bg-white/20`}
              >
                Join Free Community
              </Link>
            </div>

            <div className={`p-8 sm:p-10 space-y-6 flex flex-col justify-between border-2 border-violet-500/50 relative ${theme.card}`}>
              <div className="absolute top-4 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-400/30">
                Most Popular
              </div>
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                  Masterclass & Certification
                </span>
                <div className="text-4xl sm:text-5xl font-black">Pay Per Course</div>
                <p className={`text-xs sm:text-sm ${theme.textMuted}`}>
                  Lifetime enrollment in premium instructor-led courses with verified credential issuance.
                </p>
                <ul className="space-y-2.5 text-xs font-semibold pt-2">
                  <li className="flex items-center gap-2"><span>✓</span> Everything in Free tier</li>
                  <li className="flex items-center gap-2"><span>✓</span> Cryptographically verified certificates</li>
                  <li className="flex items-center gap-2"><span>✓</span> Downloadable resources & cheat sheets</li>
                  <li className="flex items-center gap-2"><span>✓</span> Lifetime access & future updates</li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className={`w-full py-3.5 text-center text-xs sm:text-sm font-bold ${theme.buttonPrimary}`}
              >
                Explore Catalog
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom Call to Action */}
        <section className={`p-10 sm:p-16 text-center space-y-6 rounded-[36px] ${theme.card}`}>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to Begin Your Journey?
          </h2>
          <p className={`text-sm sm:text-base max-w-xl mx-auto ${theme.textMuted}`}>
            Join thousands of students and creators advancing their careers through ApexLearn today.
          </p>
          <div className="pt-2">
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth"}
              className={`inline-flex px-8 py-4 text-sm sm:text-base font-black ${theme.buttonPrimary}`}
            >
              {isLoggedIn ? 'Launch Dashboard →' : 'Create Free Account →'}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`mt-24 border-t border-current/10 py-12 px-4 sm:px-8 text-xs ${theme.textMuted}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/images/image.png" alt="ApexLearn" className="h-6 w-6 object-contain" />
            <span className="font-bold text-sm tracking-tight text-current">ApexLearn</span>
            <span>• © {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/instructor" className="hover:underline">Instructor Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}