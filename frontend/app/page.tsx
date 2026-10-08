'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthToken, isTokenExpired } from '../lib/auth';
import { InteractiveConstellation } from '../components/landing/InteractiveConstellation';
import { HolographicCertificateCard } from '../components/landing/HolographicCertificateCard';
import { CourseCard3D } from '../components/landing/CourseCard3D';
import { SyllabusModal, CourseDossier } from '../components/landing/SyllabusModal';

const CURATED_DOSSIERS: CourseDossier[] = [
  {
    id: 'rust-kernel-systems',
    title: 'Bare-Metal Systems & Kernel Internals in Rust',
    tagline: 'Architecting zero-cost abstractions, memory allocators, and lock-free concurrency.',
    description: 'Bypass the OS runtime to craft high-throughput bare-metal services. You will build a custom slab allocator, SIMD-accelerated parser, and zero-allocation network stack from fundamental principles.',
    price: 149,
    level: 'Advanced / Tier 01',
    category: 'Systems & Kernel',
    duration: '18h 42m',
    rating: 5.0,
    enrolled: 2410,
    instructor: {
      name: 'Dr. Nikolai Vance',
      role: 'Principal Systems Architect (Ex-Mozilla)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    modules: [
      { number: '01', title: 'Memory Hierarchy & Cache Line Alignment', duration: '2h 15m', summary: 'Understanding L1/L2/L3 cache misses, false sharing, and cache-conscious data structures.' },
      { number: '02', title: 'Custom Arena & Slab Memory Allocators', duration: '3h 40m', summary: 'Writing deterministically bound allocators with zero syscall overhead.' },
      { number: '03', title: 'Lock-Free Ring Buffers & Memory Fences', duration: '4h 10m', summary: 'Implementing wait-free single-producer multi-consumer queues with atomic intrinsics.' },
      { number: '04', title: 'SIMD Vectorization & AVX-512 Assembly', duration: '4h 30m', summary: 'Harnessing vector registers to parse binary protocols at 20GB/s line speed.' },
      { number: '05', title: 'Real-World OS Kernel Module Deployment', duration: '4h 07m', summary: 'Deploying high-performance zero-copy driver modules with cryptographic verification.' },
    ],
    capstone: 'Deploy an ultra-low latency, zero-copy TCP packet filter in Rust achieving sub-microsecond roundtrip processing under 100k concurrent connections.',
  },
  {
    id: 'spatial-shaders-webgl',
    title: 'Spatial WebGL Alchemy & Volumetric Raymarching',
    tagline: 'Mastering GPU fragment math, signed distance fields, and physics shaders.',
    description: 'Ditch generic CSS wrappers and step into the computational beauty of direct GPU programming. Construct real-time lighting engines, photorealistic atmospheric scattering, and fluid dynamics directly in GLSL shaders.',
    price: 129,
    level: 'Intermediate / Tier 02',
    category: 'Creative Graphics',
    duration: '15h 18m',
    rating: 4.9,
    enrolled: 3180,
    instructor: {
      name: 'Evelyn Soroka',
      role: 'Creative Director & WebGL Shader Artist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    modules: [
      { number: '01', title: 'Vector Calculus & Ray Marching Geometry', duration: '2h 50m', summary: 'Signed distance fields (SDF), boolean operations, and analytic smooth minimums.' },
      { number: '02', title: 'Physically Based Volumetric Illumination', duration: '3h 30m', summary: 'Rayleigh scattering, subsurface refraction, and ambient occlusion estimation.' },
      { number: '03', title: 'Eulerian Fluid Simulation on the GPU', duration: '4h 00m', summary: 'Jacobi iteration, pressure projection, and velocity advection in WebGL 2.0.' },
      { number: '04', title: 'Compute Shader Post-Processing & Bloom', duration: '2h 45m', summary: 'Dual kawase blur, filmic tone mapping, and chromatic aberration optics.' },
      { number: '05', title: 'Spatial Audio Reactive Visualizer Engine', duration: '2h 13m', summary: 'Binding Web Audio FFT frequencies to vertex displacement uniforms.' },
    ],
    capstone: 'Build an interactive 60FPS volumetric nebula simulator with real-time sound reactivity and zero third-party canvas libraries.',
  },
  {
    id: 'distributed-consensus-crypto',
    title: 'Distributed Consensus & Byzantine Fault Tolerance',
    tagline: 'Designing Raft, Paxos, and Zero-Knowledge verification engines.',
    description: 'How do distributed networks agree on reality across thousands of adversarial nodes? Study state machine replication, leader election, and verifiable cryptographic state transitions without relying on centralized bottlenecks.',
    price: 0,
    level: 'Foundational / Tier 01',
    category: 'Distributed Systems',
    duration: '12h 05m',
    rating: 5.0,
    enrolled: 5490,
    instructor: {
      name: 'Marcus K. Chen',
      role: 'Consensus Researcher & Core Protocol Dev',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
    modules: [
      { number: '01', title: 'The CAP Theorem & Impossibility Proofs', duration: '1h 45m', summary: 'FLP impossibility, network partitions, and network asynchrony models.' },
      { number: '02', title: 'Implementing Raft Leader Election from Scratch', duration: '2h 50m', summary: 'Heartbeat timers, term reconciliation, and split-vote mitigation.' },
      { number: '03', title: 'Log Compaction & Snapshots in Production', duration: '2h 30m', summary: 'State checkpointing and streaming log transfer to lagging nodes.' },
      { number: '04', title: 'Byzantine Fault Tolerance & Lamport Clocks', duration: '2h 40m', summary: 'Handling malicious nodes, double-spend attempts, and sybil resistance.' },
      { number: '05', title: 'Zero-Knowledge Proof Verification Pipelines', duration: '2h 20m', summary: 'Verifying succinct non-interactive arguments (zk-SNARKs) in microseconds.' },
    ],
    capstone: 'Write a fault-tolerant, 5-node distributed key-value store that survives chaos network partitions and self-heals state in real time.',
  },
  {
    id: 'neural-inference-hardware',
    title: 'High-Performance Local AI Inference Engines',
    tagline: 'Quantization, CUDA tensor cores, and running LLMs on consumer silicon.',
    description: 'Demystify machine intelligence by building an inference engine from bare C++ and Metal/CUDA kernels. Learn 4-bit AWQ quantization, flash attention v2, and KV-cache memory optimization.',
    price: 169,
    level: 'Advanced / Tier 03',
    category: 'Machine Cognition',
    duration: '21h 10m',
    rating: 4.9,
    enrolled: 1890,
    instructor: {
      name: 'Sofia Al-Mansoor',
      role: 'Lead ML Compiler Engineer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    modules: [
      { number: '01', title: 'Transformer Computation Graph & Weights', duration: '3h 10m', summary: 'Deconstructing matrix multiplications, self-attention, and rotary embeddings.' },
      { number: '02', title: 'Kernel Optimization & Flash Attention V2', duration: '4h 45m', summary: 'Tiling memory access to fit within SRAM and eliminate HBM bandwidth bottlenecks.' },
      { number: '03', title: '4-bit and 2-bit Weight Quantization (AWQ/GPTQ)', duration: '4h 15m', summary: 'Compressing 70B parameter models down to consumer laptop RAM without loss of perplexity.' },
      { number: '04', title: 'Continuous Batching & Paged Attention', duration: '4h 30m', summary: 'Virtual memory management for KV-cache across concurrent inference streams.' },
      { number: '05', title: 'Bare-Metal Deployment & Benchmarking', duration: '4h 30m', summary: 'Achieving 140 tokens/second on local Apple Silicon unified memory.' },
    ],
    capstone: 'Build a standalone C++ local inference engine capable of loading GGUF model weights and running streaming token generation without dependencies.',
  },
];

export default function RootLandingPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const isLight = themeMode === 'light';

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [courses, setCourses] = useState<CourseDossier[]>(CURATED_DOSSIERS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [inspectedCourse, setInspectedCourse] = useState<CourseDossier | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });

  // Initialize Theme, Auth & Live Time
  useEffect(() => {
    const savedTheme = localStorage.getItem('apex_landing_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeMode(savedTheme);
    }

    const token = getAuthToken();
    if (token && !isTokenExpired(token)) {
      setIsLoggedIn(true);
    }

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'UTC',
        }) + ' UTC'
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMouseCoord({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = isLight ? 'dark' : 'light';
    setThemeMode(nextTheme);
    localStorage.setItem('apex_landing_theme', nextTheme);
  };

  // Fetch API Courses if available
  useEffect(() => {
    const fetchRemoteCourses = async () => {
      try {
        const res = await fetch(`${API_URL}/courses?limit=8&sort=featured`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json) ? json : json.data || [];
          if (items.length > 0) {
            const mapped: CourseDossier[] = items.map((c: any, idx: number) => ({
              id: c.id,
              title: c.title,
              tagline: c.description?.slice(0, 90) || 'Production-grade engineering masterclass.',
              description: c.description || 'Comprehensive curriculum with high-definition video walkthroughs and verifiable credentials.',
              price: Number(c.price || 0),
              level: c.level || 'All Levels',
              category: c.category?.name || 'Systems',
              duration: c.totalDuration ? `${Math.round(c.totalDuration / 60)}m` : '14h 20m',
              rating: Number(c.ratingAverage || 5.0),
              enrolled: Number(c.enrollmentCount || 1200 + idx * 300),
              instructor: {
                name: c.author?.name || 'Apex Faculty Fellow',
                role: 'Principal Staff Engineer',
                avatar: c.author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              },
              modules: [
                { number: '01', title: 'Architectural Foundations', duration: '2h 15m', summary: 'Core constraints, memory topology, and fundamental mental models.' },
                { number: '02', title: 'Deep Implementation', duration: '4h 30m', summary: 'Writing production algorithms line by line with zero shortcuts.' },
                { number: '03', title: 'Benchmarking & Edge Cases', duration: '3h 45m', summary: 'Stress testing throughput, latency profiles, and cache coherence.' },
                { number: '04', title: 'Verifiable Proof Capstone', duration: '4h 00m', summary: 'Submitting cryptographically signed code for peer defense.' },
              ],
              capstone: `Design and ship a production-ready solution solving real-world performance constraints for ${c.title}.`,
            }));

            if (mapped.length >= 4) {
              setCourses(mapped);
            } else {
              setCourses([...mapped, ...CURATED_DOSSIERS.slice(mapped.length)]);
            }
          }
        }
      } catch {
        // Fall back to curated list gracefully
      }
    };
    fetchRemoteCourses();
  }, [API_URL]);

  const categories = useMemo(() => {
    const set = new Set<string>(['ALL']);
    courses.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (selectedCategory === 'ALL') return courses;
    return courses.filter((c) => c.category === selectedCategory);
  }, [courses, selectedCategory]);

  return (
    <div className={`min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#f8f9fa] text-zinc-900 selection:bg-rose-600 selection:text-white' : 'bg-[#070709] text-zinc-100 selection:bg-rose-500 selection:text-white'
    }`}>
      {/* Analog Noise Film Texture */}
      <div className={`fixed inset-0 pointer-events-none z-50 noise-overlay ${isLight ? 'opacity-25' : 'opacity-60'}`} />

      {/* Global Architectural Grid Background */}
      <div className={`fixed inset-0 pointer-events-none z-0 ${isLight ? 'bg-grid-pattern-light opacity-60' : 'bg-grid-pattern opacity-40'}`} />

      {/* Ambient Chromatic Glow Spheres */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] animate-ambient-glow ${isLight ? 'bg-violet-400/10' : 'bg-violet-600/10'}`} />
        <div className={`absolute top-1/2 -right-40 w-[550px] h-[550px] rounded-full blur-[160px] animate-ambient-glow ${isLight ? 'bg-rose-400/10' : 'bg-rose-600/10'}`} style={{ animationDelay: '-3s' }} />
        <div className={`absolute bottom-10 left-10 w-[500px] h-[500px] rounded-full blur-[150px] animate-ambient-glow ${isLight ? 'bg-cyan-400/10' : 'bg-cyan-600/10'}`} style={{ animationDelay: '-5s' }} />
      </div>

      {/* Dynamic Cursor Ambient Spotlight Follower */}
      <div
        className={`fixed pointer-events-none z-10 w-[600px] h-[600px] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
          isLight
            ? 'bg-gradient-to-tr from-rose-500/[0.04] via-indigo-500/[0.035] to-teal-500/[0.035]'
            : 'bg-gradient-to-tr from-rose-500/[0.04] via-violet-500/[0.035] to-cyan-500/[0.035]'
        }`}
        style={{
          left: `${mouseCoord.x}px`,
          top: `${mouseCoord.y}px`,
          opacity: mouseCoord.x > -500 ? 1 : 0,
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. COMMAND BAR (TOP NAVIGATION)
         ───────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 border-b ${
          isScrolled
            ? isLight
              ? 'bg-white/85 backdrop-blur-2xl border-black/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.04)]'
              : 'bg-[#070709]/85 backdrop-blur-2xl border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
            : isLight
              ? 'bg-transparent border-black/[0.05]'
              : 'bg-transparent border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Brand & Telemetry */}
          <Link
            href="/"
            className="flex items-center gap-3.5 group select-none"
          >
            <div className={`relative w-9 h-9 rounded-xl border p-1 flex items-center justify-center transition-colors shadow-sm ${
              isLight
                ? 'bg-white border-zinc-300 group-hover:border-zinc-900 text-zinc-900'
                : 'bg-zinc-900 border-white/20 group-hover:border-white/50 text-white'
            }`}>
              <span className="font-mono font-black text-sm tracking-tighter">
                ▲
              </span>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`font-black text-base sm:text-lg tracking-tight ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                  APEX<span className={`font-light ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>LEARN</span>
                </span>
                <span className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border ${
                  isLight ? 'bg-black/5 border-black/10 text-zinc-600' : 'bg-white/5 border-white/10 text-zinc-400'
                }`}>
                  EST. 2026
                </span>
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-widest leading-none ${isLight ? 'text-zinc-500 font-medium' : 'text-zinc-500'}`}>
                {currentTime || '00:00:00 UTC'} • 42.8K ACTIVE NODES
              </span>
            </div>
          </Link>

          {/* Editorial Nav Pill */}
          <nav className={`hidden lg:flex items-center gap-1 px-4 py-1.5 rounded-full border backdrop-blur-xl shadow-inner font-mono text-xs ${
            isLight
              ? 'bg-white/80 border-black/[0.08]'
              : 'bg-zinc-950/80 border-white/10'
          }`}>
            <a
              href="#manifesto"
              className={`px-3 py-1 rounded-full transition-all ${
                isLight ? 'text-zinc-600 hover:text-black hover:bg-black/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              [ 01 // MANIFESTO ]
            </a>
            <a
              href="#curriculum"
              className={`px-3 py-1 rounded-full transition-all ${
                isLight ? 'text-zinc-600 hover:text-black hover:bg-black/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              [ 02 // ARCHIVES ]
            </a>
            <a
              href="#credentials"
              className={`px-3 py-1 rounded-full transition-all ${
                isLight ? 'text-zinc-600 hover:text-black hover:bg-black/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              [ 03 // PROOF ]
            </a>
            <a
              href="#methodology"
              className={`px-3 py-1 rounded-full transition-all ${
                isLight ? 'text-zinc-600 hover:text-black hover:bg-black/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              [ 04 // METHODOLOGY ]
            </a>
            <a
              href="#tuition"
              className={`px-3 py-1 rounded-full transition-all ${
                isLight ? 'text-zinc-600 hover:text-black hover:bg-black/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              [ 05 // TUITION ]
            </a>
          </nav>

          {/* Theme Switcher & Auth Controls */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              className={`px-3 py-2 rounded-xl font-mono text-[11px] font-bold border transition-all flex items-center gap-1.5 select-none ${
                isLight
                  ? 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm'
                  : 'border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10'
              }`}
              title={`Switch to ${isLight ? 'Dark' : 'White'} Mode`}
              aria-label="Toggle Theme Mode"
            >
              <span>{isLight ? '☀️ LIGHT' : '🌙 DARK'}</span>
            </button>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                  isLight
                    ? 'bg-black text-white hover:bg-zinc-800'
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                <span>Dashboard</span>
                <span>→</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth"
                  className={`hidden sm:inline-flex px-3.5 py-2 rounded-xl font-mono text-xs transition-all ${
                    isLight ? 'text-zinc-600 hover:text-black hover:bg-black/5' : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  href="/auth"
                  className={`px-4 sm:px-5 py-2 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow-md ${
                    isLight
                      ? 'bg-black text-white hover:bg-zinc-800'
                      : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                  }`}
                >
                  <span>Enter Studio</span>
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION: KINETIC CONSTELLATION & EDITORIAL MONUMENT
         ───────────────────────────────────────────────────────────── */}
      <section className={`relative min-h-[92vh] flex flex-col justify-between pt-12 pb-16 px-4 sm:px-8 border-b overflow-hidden ${
        isLight ? 'border-black/[0.08]' : 'border-white/10'
      }`}>
        {/* Interactive Physics Constellation Canvas */}
        <InteractiveConstellation isLight={isLight} />

        {/* Hero Top Meta Bar */}
        <div className="relative z-10 max-w-7xl mx-auto w-full pt-4">
          <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md font-mono text-[11px] ${
            isLight
              ? 'bg-white/80 border-black/10 text-zinc-700 shadow-sm'
              : 'bg-white/[0.04] border-white/15 text-zinc-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className={isLight ? 'text-zinc-500 font-semibold' : 'text-zinc-400'}>[ DISPATCH // COHORT 09 ]</span>
            <span className={`font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>APEX ACADEMY INTAKE IS OPEN</span>
            <span className={`hidden sm:inline ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>• ONLY 18 SEATS ALLOCATED</span>
          </div>
        </div>

        {/* Monumental Hero Headline */}
        <div className="relative z-10 max-w-7xl mx-auto w-full my-auto py-12 space-y-8">
          <div className="space-y-3">
            <div className={`font-mono text-xs sm:text-sm uppercase tracking-widest flex items-center gap-3 ${
              isLight ? 'text-zinc-500 font-semibold' : 'text-zinc-500'
            }`}>
              <span>EST. 2026 // SAN FRANCISCO • TOKYO • BERLIN</span>
              <span className={`h-px w-12 ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
              <span className={`font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>THE ANTIDOTE TO GENERIC NOISE</span>
            </div>

            <h1 className={`text-5xl sm:text-7xl md:text-8xl lg:text-[104px] font-black tracking-[-0.04em] leading-[0.94] uppercase select-none ${
              isLight ? 'text-zinc-950' : 'text-white'
            }`}>
              Craft Over <br />
              <span className={
                isLight
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-500'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500'
              }>
                Credentials.
              </span> <br />
              <span className={`font-serif italic font-normal tracking-normal lowercase text-4xl sm:text-6xl md:text-7xl lg:text-8xl ${
                isLight ? 'text-rose-600' : 'text-rose-300/90'
              }`}>
                depth over noise.
              </span>
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end pt-4">
            <p className={`md:col-span-7 text-base sm:text-xl font-light leading-relaxed max-w-2xl ${
              isLight ? 'text-zinc-700' : 'text-zinc-300'
            }`}>
              We reject auto-generated tutorial sludge and 40-hour passive slide decks. <strong className={isLight ? 'text-zinc-950 font-bold' : 'text-white font-medium'}>ApexLearn</strong> is an avant-garde conservatory for engineers, creative technologists, and system architects who crave bare-metal understanding, direct GPU alchemy, and cryptographically verified proof-of-work.
            </p>

            <div className="md:col-span-5 flex flex-wrap items-center gap-3 md:justify-end">
              <Link
                href={isLoggedIn ? "/dashboard" : "/auth"}
                className={`px-8 py-4 rounded-2xl font-mono text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 group shadow-xl ${
                  isLight
                    ? 'bg-black text-white hover:bg-zinc-800'
                    : 'bg-white text-black hover:bg-zinc-200 shadow-[0_10px_35px_rgba(255,255,255,0.3)]'
                }`}
              >
                <span>{isLoggedIn ? 'Launch Classroom' : 'Claim Seat in Cohort'}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              <a
                href="#curriculum"
                className={`px-6 py-4 rounded-2xl font-mono text-xs uppercase tracking-wider border transition-all ${
                  isLight
                    ? 'bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-300 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/15'
                }`}
              >
                Inspect Archives ↓
              </a>
            </div>
          </div>
        </div>

        {/* Hero Bottom Telemetry Grid */}
        <div className={`relative z-10 max-w-7xl mx-auto w-full pt-8 border-t ${
          isLight ? 'border-black/[0.08]' : 'border-white/10'
        }`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono">
            <div className="space-y-1">
              <div className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-zinc-500 font-bold' : 'text-zinc-500'}`}>
                STREAMING LATENCY
              </div>
              <div className={`text-xl sm:text-2xl font-black flex items-center gap-2 ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                <span>0.014s</span>
                <span className={`text-[10px] font-normal ${isLight ? 'text-emerald-600 font-bold' : 'text-emerald-400'}`}>BYTE-RANGE</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-zinc-500 font-bold' : 'text-zinc-500'}`}>
                VERIFIABLE CREDENTIALS
              </div>
              <div className={`text-xl sm:text-2xl font-black flex items-center gap-2 ${isLight ? 'text-rose-600' : 'text-rose-300'}`}>
                <span>SHA-256</span>
                <span className={`text-[10px] font-normal ${isLight ? 'text-zinc-500 font-semibold' : 'text-zinc-400'}`}>ON-CHAIN</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-zinc-500 font-bold' : 'text-zinc-500'}`}>
                COMPLETION VELOCITY
              </div>
              <div className={`text-xl sm:text-2xl font-black flex items-center gap-2 ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
                <span>94.8%</span>
                <span className={`text-[10px] font-normal ${isLight ? 'text-emerald-600 font-bold' : 'text-emerald-400'}`}>+18.2%</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-zinc-500 font-bold' : 'text-zinc-500'}`}>
                PRODUCTION ARTIFACTS
              </div>
              <div className={`text-xl sm:text-2xl font-black flex items-center gap-2 ${isLight ? 'text-violet-700' : 'text-violet-300'}`}>
                <span>8,420+</span>
                <span className={`text-[10px] font-normal ${isLight ? 'text-zinc-500 font-semibold' : 'text-zinc-400'}`}>SHIPPED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. DUAL INFINITE EDITORIAL MARQUEE TICKERS
         ───────────────────────────────────────────────────────────── */}
      <section className={`relative z-20 border-b overflow-hidden py-3 select-none ${
        isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-700' : 'bg-black border-white/10 text-zinc-400'
      }`}>
        <div className="animate-marquee-left font-mono text-xs uppercase tracking-widest flex items-center gap-8 whitespace-nowrap">
          <span>BARE-METAL RUST & KERNEL SYSTEMS ✦</span>
          <span className={`font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>COMPUTATIONAL SHADERS & RAYMARCHING ✦</span>
          <span>DISTRIBUTED CONSENSUS RAFT / PAXOS ✦</span>
          <span className={`font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>ZERO SYNTHESIZED CODE SLOP ✦</span>
          <span>SPATIAL visionOS & METAL COMPUTE ✦</span>
          <span>4-BIT LOCAL AI INFERENCE ✦</span>
          <span className={`font-bold ${isLight ? 'text-teal-600' : 'text-cyan-400'}`}>CRYPTOGRAPHIC PROOF OF WORK ✦</span>
          <span>BARE-METAL RUST & KERNEL SYSTEMS ✦</span>
          <span className={`font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>COMPUTATIONAL SHADERS & RAYMARCHING ✦</span>
          <span>DISTRIBUTED CONSENSUS RAFT / PAXOS ✦</span>
          <span className={`font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>ZERO SYNTHESIZED CODE SLOP ✦</span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. THE MANIFESTO: OUR ANTIDOTE TO MEDIOCRITY
         ───────────────────────────────────────────────────────────── */}
      <section id="manifesto" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-16">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8 ${
          isLight ? 'border-zinc-200' : 'border-white/10'
        }`}>
          <div className="space-y-2">
            <span className={`font-mono text-xs uppercase tracking-widest font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
              [ 01 // MANIFESTO OF INTENT ]
            </span>
            <h2 className={`text-3xl sm:text-5xl font-black tracking-tight uppercase ${isLight ? 'text-zinc-950' : 'text-white'}`}>
              The Digital World is Drowning in Slop. <br />
              <span className={`font-serif italic font-normal lowercase text-3xl sm:text-5xl ${
                isLight ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                this is our rebellion.
              </span>
            </h2>
          </div>
          <p className={`max-w-md font-mono text-xs leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Anyone can prompt a model to vomit unverified boilerplate. True leverage belongs to those who understand cache lines, GPU render loops, and fault-tolerant network partitions.
          </p>
        </div>

        {/* Contrasting Comparison Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column A: Generic Tutorial Mills */}
          <div className={`p-8 sm:p-10 rounded-3xl border space-y-6 relative overflow-hidden ${
            isLight
              ? 'bg-rose-50/50 border-rose-200/80 shadow-sm'
              : 'bg-white/[0.02] border-white/10'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-rose-200' : 'border-white/10'}`}>
              <span className={`font-mono text-xs uppercase tracking-wider font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                ✕ THE COMMODITY TUTORIAL COMPLEX
              </span>
              <span className={`text-xs font-mono ${isLight ? 'text-rose-500 font-semibold' : 'text-zinc-500'}`}>CONSUMER LEVEL</span>
            </div>

            <ul className={`space-y-4 font-mono text-xs ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>
              <li className="flex items-start gap-3">
                <span className="text-rose-500 font-bold">✕</span>
                <span>40 hours of sleep-inducing slideshow lectures with zero live debugging.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Toy "todo app" examples that crash the moment you touch high concurrency.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Useless unverified PDF certificates easily faked by inspecting DOM elements.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Over-reliant on AI copilot crutches without knowing what the compiler is doing.</span>
              </li>
            </ul>
          </div>

          {/* Column B: The Apex Conservatory */}
          <div className={`p-8 sm:p-10 rounded-3xl border-2 space-y-6 relative overflow-hidden ${
            isLight
              ? 'bg-white border-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.06)]'
              : 'bg-zinc-950 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-zinc-200' : 'border-white/10'}`}>
              <span className={`font-mono text-xs uppercase tracking-wider font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                ✓ THE APEX CONSERVATORY
              </span>
              <span className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>ARCHITECT TIER</span>
            </div>

            <ul className={`space-y-4 font-mono text-xs ${isLight ? 'text-zinc-900 font-medium' : 'text-zinc-200'}`}>
              <li className="flex items-start gap-3">
                <span className={`font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>✓</span>
                <span>Direct production codebases engineered under real latency constraints.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>✓</span>
                <span>Hardware empathy: SIMD registers, memory allocators, GPU threadgroups.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>✓</span>
                <span>Cryptographically signed proof-of-work certificates on a public ledger.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>✓</span>
                <span>Frame-accurate byte-range HD streaming with exact lecture duration meters.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. THE SYLLABUS MATRIX (FEATURED ARCHIVES)
         ───────────────────────────────────────────────────────────── */}
      <section id="curriculum" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8 ${
          isLight ? 'border-zinc-200' : 'border-white/10'
        }`}>
          <div>
            <span className={`font-mono text-xs uppercase tracking-widest font-bold ${isLight ? 'text-violet-700' : 'text-violet-400'}`}>
              [ 02 // MASTERCLASS ARCHIVES ]
            </span>
            <h2 className={`text-3xl sm:text-5xl font-black tracking-tight uppercase mt-1 ${isLight ? 'text-zinc-950' : 'text-white'}`}>
              Curriculum Dossiers
            </h2>
            <p className={`font-mono text-xs mt-2 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Hover to tilt cards in 3D space. Click "Inspect Syllabus" to dissect modules and capstones.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-all border ${
                  selectedCategory === cat
                    ? isLight
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-white text-black border-white shadow-md'
                    : isLight
                      ? 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-black'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCourses.map((c, idx) => (
            <CourseCard3D
              key={c.id}
              course={c}
              index={idx}
              onInspect={(selected) => setInspectedCourse(selected)}
              isLight={isLight}
            />
          ))}
        </div>

        {/* Bottom Catalog Redirect Pill */}
        <div className={`p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isLight
            ? 'bg-white border-zinc-200/90 shadow-sm'
            : 'bg-white/[0.02] border-white/10'
        }`}>
          <div className={`font-mono text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            <span>LOOKING FOR INSTRUCTOR STUDIO OR SPECIALTY MODULES?</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/instructor"
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider border transition-all ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300'
                  : 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              Instructor Studio ↗
            </Link>
            <Link
              href="/dashboard"
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                isLight
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              Browse Full Catalog →
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. THE HOLOGRAPHIC CERTIFICATE PROOF VAULT
         ───────────────────────────────────────────────────────────── */}
      <section id="credentials" className={`py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-12 border-t ${
        isLight ? 'border-zinc-200' : 'border-white/10'
      }`}>
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className={`font-mono text-xs uppercase tracking-widest font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            [ 03 // THE CRYPTOGRAPHIC PROOF VAULT ]
          </span>
          <h2 className={`text-3xl sm:text-5xl font-black tracking-tight uppercase ${isLight ? 'text-zinc-950' : 'text-white'}`}>
            Proof of Work, Not Paper
          </h2>
          <p className={`font-mono text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Every masterclass completion generates an immutable cryptographic credential. Move your cursor over the credential to inspect the 3D optical foil glint.
          </p>
        </div>

        {/* 3D Holographic Tilt Card */}
        <HolographicCertificateCard isLight={isLight} />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. THE 4 PILLARS OF MASTERY (ARCHITECTURAL METHODOLOGY)
         ───────────────────────────────────────────────────────────── */}
      <section id="methodology" className={`py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-16 border-t ${
        isLight ? 'border-zinc-200' : 'border-white/10'
      }`}>
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className={`font-mono text-xs uppercase tracking-widest font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
            [ 04 // ARCHITECTURAL METHODOLOGY ]
          </span>
          <h2 className={`text-3xl sm:text-5xl font-black tracking-tight uppercase ${isLight ? 'text-zinc-950' : 'text-white'}`}>
            Four Foundational Tenets
          </h2>
          <p className={`font-mono text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Engineered from first principles to ensure your time translates directly into undeniable engineering leverage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 01 */}
          <div className={`p-8 rounded-3xl border space-y-4 transition-all group ${
            isLight
              ? 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md'
              : 'bg-zinc-950/80 border-white/10 hover:border-white/30'
          }`}>
            <div className={`font-mono text-xs font-bold flex justify-between items-center ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
              <span>[ 01 // BYTE-RANGE ]</span>
              <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-rose-500' : 'bg-rose-400'}`} />
            </div>
            <h3 className={`text-lg font-black transition-colors ${
              isLight ? 'text-zinc-950 group-hover:text-rose-600' : 'text-white group-hover:text-rose-300'
            }`}>
              Microsecond Video Scrubbing
            </h3>
            <p className={`text-xs leading-relaxed font-light ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Edge-delivered byte-range streaming allows instant frame-by-frame scrub without buffering. Track your exact physical duration down to the second.
            </p>
          </div>

          {/* Pillar 02 */}
          <div className={`p-8 rounded-3xl border space-y-4 transition-all group ${
            isLight
              ? 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md'
              : 'bg-zinc-950/80 border-white/10 hover:border-white/30'
          }`}>
            <div className={`font-mono text-xs font-bold flex justify-between items-center ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
              <span>[ 02 // HARDWARE ]</span>
              <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-cyan-600' : 'bg-cyan-400'}`} />
            </div>
            <h3 className={`text-lg font-black transition-colors ${
              isLight ? 'text-zinc-950 group-hover:text-cyan-600' : 'text-white group-hover:text-cyan-300'
            }`}>
              Mechanical Empathy
            </h3>
            <p className={`text-xs leading-relaxed font-light ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Learn how your code executes at the silicon level: cache lines, memory ordering semantics, branch predictors, and GPU threadgroup dispatch.
            </p>
          </div>

          {/* Pillar 03 */}
          <div className={`p-8 rounded-3xl border space-y-4 transition-all group ${
            isLight
              ? 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md'
              : 'bg-zinc-950/80 border-white/10 hover:border-white/30'
          }`}>
            <div className={`font-mono text-xs font-bold flex justify-between items-center ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              <span>[ 03 // VERIFIABLE ]</span>
              <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
            </div>
            <h3 className={`text-lg font-black transition-colors ${
              isLight ? 'text-zinc-950 group-hover:text-emerald-600' : 'text-white group-hover:text-emerald-300'
            }`}>
              Cryptographic Proofs
            </h3>
            <p className={`text-xs leading-relaxed font-light ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Permanent SHA-256 digital diplomas with QR resolution. Shareable proofs of authentic mastery that employers and collaborators can verify on-chain.
            </p>
          </div>

          {/* Pillar 04 */}
          <div className={`p-8 rounded-3xl border space-y-4 transition-all group ${
            isLight
              ? 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md'
              : 'bg-zinc-950/80 border-white/10 hover:border-white/30'
          }`}>
            <div className={`font-mono text-xs font-bold flex justify-between items-center ${isLight ? 'text-violet-700' : 'text-violet-400'}`}>
              <span>[ 04 // CRITIQUE ]</span>
              <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-violet-600' : 'bg-violet-400'}`} />
            </div>
            <h3 className={`text-lg font-black transition-colors ${
              isLight ? 'text-zinc-950 group-hover:text-violet-600' : 'text-white group-hover:text-violet-300'
            }`}>
              Staff Engineer Teardowns
            </h3>
            <p className={`text-xs leading-relaxed font-light ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Submit your capstone code for rigorous asynchronous review by engineers who have shipped distributed systems and low-level graphics at scale.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. TUITION ARCHITECTURE (HONEST & TRANSPARENT)
         ───────────────────────────────────────────────────────────── */}
      <section id="tuition" className={`py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-16 border-t ${
        isLight ? 'border-zinc-200' : 'border-white/10'
      }`}>
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className={`font-mono text-xs uppercase tracking-widest font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
            [ 05 // TUITION ARCHITECTURE ]
          </span>
          <h2 className={`text-3xl sm:text-5xl font-black tracking-tight uppercase ${isLight ? 'text-zinc-950' : 'text-white'}`}>
            Transparent Tuition
          </h2>
          <p className={`font-mono text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Zero hidden recurring traps. Either learn for free in the commons or invest in lifelong mastery passes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Commons Tier */}
          <div className={`p-8 sm:p-10 rounded-3xl border flex flex-col justify-between space-y-8 ${
            isLight
              ? 'bg-white border-zinc-200 shadow-sm'
              : 'bg-zinc-950/70 border-white/10'
          }`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs uppercase tracking-widest ${isLight ? 'text-zinc-500 font-bold' : 'text-zinc-400'}`}>
                  COMMONS TIER
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase border ${
                  isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-700 font-medium' : 'bg-white/5 border-white/10 text-zinc-400'
                }`}>
                  OPEN SOURCE
                </span>
              </div>

              <div>
                <div className={`text-4xl sm:text-5xl font-black ${isLight ? 'text-zinc-950' : 'text-white'}`}>$0</div>
                <div className={`text-xs font-mono uppercase tracking-widest mt-1 ${isLight ? 'text-zinc-500 font-medium' : 'text-zinc-500'}`}>
                  PERPETUAL ACCESS
                </div>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Free open-access masterclasses, community discussion channels, and streaming video player with precise duration logging.
              </p>

              <ul className={`space-y-3 font-mono text-xs pt-2 border-t ${
                isLight ? 'text-zinc-700 border-zinc-150' : 'text-zinc-300 border-white/10'
              }`}>
                <li className="flex items-center gap-2.5">
                  <span className={`font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>✓</span> Free tier video masterclasses
                </li>
                <li className="flex items-center gap-2.5">
                  <span className={`font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>✓</span> Interactive HD video player
                </li>
                <li className="flex items-center gap-2.5">
                  <span className={`font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>✓</span> Community code repositories
                </li>
              </ul>
            </div>

            <Link
              href="/auth"
              className={`w-full py-3.5 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider text-center border transition-all ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 shadow-sm'
                  : 'border-white/15 bg-white/5 hover:bg-white/15 text-white'
              }`}
            >
              Join Free Commons →
            </Link>
          </div>

          {/* Masterclass & Credential Tier */}
          <div className={`p-8 sm:p-10 rounded-3xl border-2 flex flex-col justify-between space-y-8 relative overflow-hidden ${
            isLight
              ? 'bg-white border-rose-500/50 shadow-[0_25px_60px_rgba(244,63,94,0.08)]'
              : 'bg-zinc-950 border-rose-500/40 shadow-[0_25px_60px_rgba(244,63,94,0.15)]'
          }`}>
            <div className={`absolute top-4 right-6 px-3 py-1 rounded-full font-mono text-[10px] font-black uppercase tracking-wider border ${
              isLight
                ? 'bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              FELLOWSHIP TIER
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs uppercase tracking-widest font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
                  MASTERCLASS PASS
                </span>
              </div>

              <div>
                <div className={`text-4xl sm:text-5xl font-black ${isLight ? 'text-zinc-950' : 'text-white'}`}>PAY PER CRAFT</div>
                <div className={`text-xs font-mono uppercase tracking-widest mt-1 ${isLight ? 'text-rose-600 font-bold' : 'text-rose-400'}`}>
                  LIFETIME REPO ACCESS & VERIFICATION
                </div>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                Full production repo code, direct instructor feedback on your capstone submission, and permanent cryptographic SHA-256 certificate issuance.
              </p>

              <ul className={`space-y-3 font-mono text-xs pt-2 border-t ${
                isLight ? 'text-zinc-800 border-zinc-150' : 'text-zinc-200 border-white/10'
              }`}>
                <li className="flex items-center gap-2.5">
                  <span className={`font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>✓</span> Everything in Commons tier
                </li>
                <li className="flex items-center gap-2.5">
                  <span className={`font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>✓</span> Cryptographic SHA-256 verified diplomas
                </li>
                <li className="flex items-center gap-2.5">
                  <span className={`font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>✓</span> Production GitHub repo access & CI templates
                </li>
                <li className="flex items-center gap-2.5">
                  <span className={`font-bold ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>✓</span> Direct asynchronous code defense review
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className={`w-full py-4 rounded-2xl font-mono text-xs font-black uppercase tracking-wider text-center transition-all shadow-xl active:scale-95 ${
                isLight
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              Explore Masterclass Catalog →
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. MONUMENTAL CTA BANNER
         ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className={`relative rounded-[36px] border p-10 sm:p-20 text-center space-y-8 overflow-hidden shadow-2xl ${
          isLight
            ? 'bg-gradient-to-br from-white via-zinc-50 to-zinc-100 border-zinc-300 shadow-[0_25px_60px_rgba(0,0,0,0.06)]'
            : 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-white/20'
        }`}>
          {/* Background Ambient Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-rose-500/15 blur-[120px] pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <span className={`font-mono text-xs uppercase tracking-widest ${isLight ? 'text-zinc-500 font-bold' : 'text-zinc-500'}`}>
              [ ADMISSIONS 2026 ]
            </span>
            <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight ${isLight ? 'text-zinc-950' : 'text-white'}`}>
              Ready to Forge Real Mastery?
            </h2>
            <p className={`font-light text-base sm:text-lg max-w-xl mx-auto leading-relaxed ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
              Step beyond the noise. Join the conservatory of builders shaping the next era of high-performance software.
            </p>
          </div>

          <div className="relative z-10 pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth"}
              className={`px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-mono text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 group shadow-xl ${
                isLight
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-white text-black hover:bg-zinc-200 shadow-[0_15px_40px_rgba(255,255,255,0.3)]'
              }`}
            >
              <span>{isLoggedIn ? 'Launch Classroom Dashboard' : 'Create Free Account'}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          10. EDITORIAL FOOTER & SYSTEM TELEMETRY
         ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/80 pt-16 pb-12 px-4 sm:px-8 bg-zinc-950 text-zinc-100 select-none">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Huge Typographic Watermark */}
          <div className="border-b border-zinc-900 pb-12">
            <div className="text-[14vw] font-black tracking-tighter leading-none text-zinc-900 select-none overflow-hidden text-center sm:text-left pointer-events-none">
              APEXLEARN
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 font-mono text-xs">
            {/* Identity Column */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <span>▲ APEXLEARN CONSERVATORY</span>
              </div>
              <p className="text-zinc-400 max-w-sm leading-relaxed">
                An avant-garde academy dedicated to depth, mechanical empathy, and verifiable engineering craftsmanship.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-emerald-400 pt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>GLOBAL EDGE CDN NODES OPERATIONAL • 100% HEALTH</span>
              </div>
            </div>

            {/* Navigation Column */}
            <div className="md:col-span-3 space-y-2 text-zinc-400">
              <div className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
                ARCHIVES
              </div>
              <div><a href="#curriculum" className="hover:text-white transition-colors">Masterclasses</a></div>
              <div><a href="#credentials" className="hover:text-white transition-colors">Proof of Work</a></div>
              <div><a href="#methodology" className="hover:text-white transition-colors">Methodology</a></div>
              <div><Link href="/instructor" className="hover:text-white transition-colors">Instructor Portal</Link></div>
            </div>

            {/* Legal & Telemetry Column */}
            <div className="md:col-span-4 space-y-2 text-zinc-500">
              <div className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
                TELEMETRY & LEGAL
              </div>
              <div><Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Ledger</Link></div>
              <div><Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Verification</Link></div>
              <div className="pt-2 text-[11px] text-zinc-600">
                © {new Date().getFullYear()} APEXLEARN INC. ALL RIGHTS RESERVED.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          11. INTERACTIVE SYLLABUS INSPECTION MODAL
         ───────────────────────────────────────────────────────────── */}
      <SyllabusModal
        course={inspectedCourse}
        onClose={() => setInspectedCourse(null)}
        isLight={isLight}
      />
    </div>
  );
}