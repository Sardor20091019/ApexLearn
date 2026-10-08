'use client';

import React, { useEffect } from 'react';
import { Magnetic } from './Magnetic';
import { audioSynth } from './AudioSynth';

export interface DossierData {
  id: string;
  number?: string;
  title: string;
  tagline: string;
  category: string;
  spec: string;
  description: string;
  modules?: Array<{ number: string; title: string; summary: string }>;
  capstone?: string;
  image?: string;
}

const DOSSIER_REGISTRY: Record<string, DossierData> = {
  'neural-inference-hardware': {
    id: 'neural-inference-hardware',
    number: '01',
    title: 'NEURAL TOPOLOGY & CUDA INFERENCE',
    tagline: 'Quantization, CUDA tensor cores, and running LLMs on consumer silicon.',
    category: 'MACHINE COGNITION',
    spec: 'CUDA KERNEL / 4-BIT AWQ / KV-CACHE',
    description:
      'Demystify machine intelligence by building an inference engine from bare C++ and Metal/CUDA kernels. Learn 4-bit AWQ quantization, flash attention v2, and continuous batching without external runtimes.',
    modules: [
      { number: '01', title: 'Transformer Computation Graph & Weights', summary: 'Deconstructing matrix multiplications, self-attention, and rotary embeddings.' },
      { number: '02', title: 'Kernel Optimization & Flash Attention V2', summary: 'Tiling memory access to fit within SRAM and eliminate HBM bandwidth bottlenecks.' },
      { number: '03', title: '4-bit and 2-bit Weight Quantization (AWQ)', summary: 'Compressing 70B parameter models down to consumer laptop RAM.' },
      { number: '04', title: 'Continuous Batching & Paged Attention', summary: 'Virtual memory management for KV-cache across concurrent inference streams.' },
    ],
    capstone: 'Build a standalone C++ local inference engine capable of loading GGUF model weights and running streaming token generation at 140 tokens/sec.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  },
  'spatial-shaders-webgl': {
    id: 'spatial-shaders-webgl',
    number: '02',
    title: 'SPATIAL WEBGL & VOLUMETRIC RAYMARCHING',
    tagline: 'Mastering GPU fragment math, signed distance fields, and physics shaders.',
    category: 'WEBGL ALCHEMY',
    spec: 'GLSL SHADERS / SDF MATH / VOLUMETRICS',
    description:
      'Ditch generic CSS wrappers and step into direct GPU programming. Construct real-time lighting engines, photorealistic atmospheric scattering, and fluid dynamics directly in GLSL shaders.',
    modules: [
      { number: '01', title: 'Vector Calculus & Ray Marching Geometry', summary: 'Signed distance fields (SDF), boolean operations, and analytic smooth minimums.' },
      { number: '02', title: 'Physically Based Volumetric Illumination', summary: 'Rayleigh scattering, subsurface refraction, and ambient occlusion estimation.' },
      { number: '03', title: 'Eulerian Fluid Simulation on the GPU', summary: 'Jacobi iteration, pressure projection, and velocity advection in WebGL 2.0.' },
      { number: '04', title: 'Compute Shader Post-Processing & Bloom', summary: 'Dual kawase blur, filmic tone mapping, and chromatic aberration optics.' },
    ],
    capstone: 'Build an interactive 60FPS volumetric nebula simulator with real-time sound reactivity and zero third-party canvas libraries.',
    image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
  },
  'rust-kernel-systems': {
    id: 'rust-kernel-systems',
    number: '03',
    title: 'BARE-METAL SYSTEMS & KERNEL IN RUST',
    tagline: 'Architecting zero-cost abstractions, memory allocators, and lock-free concurrency.',
    category: 'SYSTEMS & KERNEL',
    spec: 'BARE-METAL RUST / ZERO-ALLOC / SIMD',
    description:
      'Bypass the OS runtime to craft high-throughput bare-metal services. You will build a custom slab allocator, SIMD-accelerated parser, and zero-allocation network stack from fundamental principles.',
    modules: [
      { number: '01', title: 'Memory Hierarchy & Cache Line Alignment', summary: 'Understanding L1/L2/L3 cache misses, false sharing, and cache-conscious structures.' },
      { number: '02', title: 'Custom Arena & Slab Memory Allocators', summary: 'Writing deterministically bound allocators with zero syscall overhead.' },
      { number: '03', title: 'Lock-Free Ring Buffers & Memory Fences', summary: 'Implementing wait-free single-producer multi-consumer queues with atomic intrinsics.' },
    ],
    capstone: 'Deploy an ultra-low latency, zero-copy TCP packet filter achieving sub-microsecond roundtrip processing under 100k concurrent connections.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
  'distributed-consensus-crypto': {
    id: 'distributed-consensus-crypto',
    number: '04',
    title: 'DISTRIBUTED CONSENSUS & RAFT PROTOCOLS',
    tagline: 'Designing Raft, Paxos, and Zero-Knowledge verification engines.',
    category: 'DISTRIBUTED SYSTEMS',
    spec: 'RAFT CONSENSUS / ZK-SNARKS / BYZANTINE',
    description:
      'How do distributed networks agree on reality across thousands of adversarial nodes? Study state machine replication, leader election, and verifiable cryptographic state transitions without relying on centralized bottlenecks.',
    modules: [
      { number: '01', title: 'The CAP Theorem & Impossibility Proofs', summary: 'FLP impossibility, network partitions, and network asynchrony models.' },
      { number: '02', title: 'Implementing Raft Leader Election', summary: 'Heartbeat timers, term reconciliation, and split-vote mitigation.' },
      { number: '03', title: 'Zero-Knowledge Proof Pipelines', summary: 'Verifying succinct non-interactive arguments (zk-SNARKs) in microseconds.' },
    ],
    capstone: 'Write a fault-tolerant, 5-node distributed key-value store that survives chaos network partitions and self-heals state in real time.',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  },
  'zero-gravity-ui': {
    id: 'zero-gravity-ui',
    number: '05',
    title: 'ZERO-GRAVITY UI & INTERACTION PHYSICS',
    tagline: 'Sub-pixel fluid physics, magnetic haptics, and spatial micro-motion.',
    category: 'INTERACTION DESIGN',
    spec: 'GSAP TICKER / LENIS FORCES / WEB AUDIO',
    description:
      'Crafting high-order kinetic interaction architectures that break free from static DOM paradigms. Unifying pointer velocity with spring interpolation and procedural auditory feedback.',
    modules: [
      { number: '01', title: 'Spring Interpolation & Quick-Smoothing', summary: 'Zero-lag pointer attraction and momentum conservation models.' },
      { number: '02', title: 'Lenis Virtual Scroll Architecture', summary: 'Synchronizing custom tickers with requestAnimationFrame.' },
      { number: '03', title: 'Procedural Audio Synthesis in the Browser', summary: 'Synthesizing subtle haptic acoustic feedback via Web Audio API.' },
    ],
    capstone: 'Engineer an Awwwards SOTD-grade architectural portfolio site achieving consistent 60FPS fluid motion on all viewports.',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
  },
};

interface ProjectDossierModalProps {
  projectId: string | null;
  onClose: () => void;
}

export function ProjectDossierModal({ projectId, onClose }: ProjectDossierModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!projectId) return null;
  const dossier = DOSSIER_REGISTRY[projectId] || {
    id: projectId,
    title: projectId.toUpperCase().replace(/-/g, ' '),
    tagline: 'Architectural research dossier.',
    category: 'SYSTEMS',
    spec: '60FPS ARCHITECTURE',
    description: 'Detailed technical specification and execution framework.',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0D0D0D]/85 backdrop-blur-[24px] overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl border border-[#F5F5F3]/20 bg-[#0D0D0D] p-6 sm:p-10 my-auto shadow-2xl">
        {/* Extreme Corner Crosshairs */}
        <div className="absolute top-2 left-2 text-[#FF3E00] font-mono text-xs">+</div>
        <div className="absolute top-2 right-2 text-[#FF3E00] font-mono text-xs">+</div>
        <div className="absolute bottom-2 left-2 text-[#FF3E00] font-mono text-xs">+</div>
        <div className="absolute bottom-2 right-2 text-[#FF3E00] font-mono text-xs">+</div>

        {/* Top Bar with Close Anchor */}
        <div className="flex items-center justify-between border-b border-[#F5F5F3]/15 pb-4 mb-6 font-mono text-xs uppercase tracking-widest text-[#F5F5F3]/60">
          <div className="flex items-center gap-3">
            <span className="text-[#FF3E00] font-bold">[{dossier.number || '00'}]</span>
            <span>SYSTEM DOSSIER</span>
            <span className="text-[#F5F5F3]/20">/</span>
            <span>{dossier.category}</span>
          </div>

          <Magnetic strength={0.4} asPill>
            <button
              onClick={() => {
                audioSynth.playTick(1000, 0.05);
                onClose();
              }}
              className="px-3 py-1 rounded-full border border-[#F5F5F3]/30 text-[#F5F5F3] hover:border-[#FF3E00] hover:text-[#FF3E00] transition-colors"
            >
              [ESC / CLOSE]
            </button>
          </Magnetic>
        </div>

        {/* Title & Tagline */}
        <h2 className="font-['Syne',sans-serif] text-3xl sm:text-5xl font-black uppercase text-[#F5F5F3] leading-[0.9] tracking-tight mb-3">
          {dossier.title}
        </h2>
        <div className="font-mono text-xs text-[#FF3E00] uppercase tracking-wider mb-6">
          {dossier.spec}
        </div>

        <p className="font-mono text-xs sm:text-sm text-[#F5F5F3]/80 uppercase leading-relaxed mb-8 border-l-2 border-[#FF3E00] pl-4">
          {dossier.description}
        </p>

        {/* Modules Breakdown */}
        {dossier.modules && dossier.modules.length > 0 && (
          <div className="mb-8">
            <div className="font-mono text-[10px] uppercase text-[#F5F5F3]/40 tracking-widest mb-3">
              TECHNICAL ARCHITECTURE MODULES:
            </div>
            <div className="space-y-2 border-t border-[#F5F5F3]/10 pt-2">
              {dossier.modules.map((m) => (
                <div
                  key={m.number}
                  className="flex flex-col sm:flex-row sm:items-baseline justify-between py-2 border-b border-[#F5F5F3]/10 font-mono text-xs uppercase"
                >
                  <span className="text-[#F5F5F3] font-bold">
                    <span className="text-[#FF3E00] mr-2">[{m.number}]</span>
                    {m.title}
                  </span>
                  <span className="text-[10px] text-[#F5F5F3]/50 sm:max-w-md sm:text-right mt-1 sm:mt-0">
                    {m.summary}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capstone */}
        {dossier.capstone && (
          <div className="border border-[#F5F5F3]/15 p-4 bg-[#0D0D0D]/60 mb-8 font-mono text-xs uppercase">
            <div className="text-[10px] text-[#FF3E00] font-bold mb-1">CAPSTONE OBJECTIVE:</div>
            <div className="text-[#F5F5F3]/80">{dossier.capstone}</div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#F5F5F3]/15 pt-6">
          <div className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F3]/40">
            SECURITY VERIFIED // ALLOCATED MEMORY: ZERO LEAK
          </div>

          <div className="flex items-center gap-3">
            <Magnetic strength={0.35} asPill>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-[#F5F5F3]/30 text-[#F5F5F3] font-mono text-xs uppercase tracking-wider hover:border-[#FF3E00] hover:text-[#FF3E00] transition-colors"
              >
                RETURN
              </button>
            </Magnetic>

            <Magnetic strength={0.45} asPill>
              <a
                href="/courses"
                className="px-6 py-2.5 rounded-full bg-[#FF3E00] text-[#0D0D0D] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#F5F5F3] hover:text-[#0D0D0D] transition-colors shadow-lg"
              >
                ACCESS REPOSITORY →
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </div>
  );
}
