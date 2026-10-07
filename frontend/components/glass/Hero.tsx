'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from './GlassCard';
import { GlassInput } from './GlassInput';

export const Hero = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="relative pt-12 pb-24 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      {/* Decorative floating badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)] mb-8 animate-[fade-in_0.6s_ease-out]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-purple-200 via-pink-100 to-cyan-200 bg-clip-text text-transparent">
          Next-Gen Translucent Interface System
        </span>
      </div>

      {/* Main Large Hero Glass Floating Panel */}
      <GlassCard
        variant="heavy"
        borderLuminosity="intense"
        className="w-full max-w-5xl p-8 sm:p-14 lg:p-16 relative shadow-[0_32px_80px_0_rgba(0,0,0,0.6)]"
      >
        {/* Subtle background refraction glow inside the panel */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] [text-shadow:0_2px_20px_rgba(0,0,0,0.4)]">
            Translucent Depth.{' '}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
              Dimensional Elegance.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-white/80 font-normal leading-relaxed max-w-2xl mx-auto [text-shadow:0_1px_3px_rgba(0,0,0,0.3)]">
            Experience spatial user interfaces crafted with multi-tier optical blur, specular edge
            refraction, and luminous light interplay inspired by Apple visionOS.
          </p>

          {/* Interactive Form on Inner Glass Platform */}
          <div className="pt-4 max-w-md mx-auto">
            {submitted ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-xl text-emerald-200 text-sm font-bold flex items-center justify-center gap-2">
                <span>✓</span> Welcome to the spatial preview list!
              </div>
            ) : (
              <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3">
                <GlassInput
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
                <button
                  type="submit"
                  className="shrink-0 px-6 py-3.5 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 border border-white/40 shadow-[0_4px_24px_rgba(168,85,247,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:brightness-110 active:scale-95 transition-all"
                >
                  Request Access
                </button>
              </form>
            )}
          </div>

          {/* Meta metrics bar floating inside hero */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 text-left">
            <div>
              <div className="text-2xl font-black text-white">40px</div>
              <div className="text-xs text-white/60 uppercase font-semibold tracking-wider">Backdrop Blur</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">99.8%</div>
              <div className="text-xs text-white/60 uppercase font-semibold tracking-wider">Contrast Ratio</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">3 Layers</div>
              <div className="text-xs text-white/60 uppercase font-semibold tracking-wider">Depth Hierarchy</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">60 FPS</div>
              <div className="text-xs text-white/60 uppercase font-semibold tracking-wider">GPU Composited</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
};
