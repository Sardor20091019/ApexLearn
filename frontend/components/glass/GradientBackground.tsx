'use client';
import React, { memo } from 'react';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  theme?: 'cosmic' | 'sunset' | 'aurora';
}

export const GradientBackground = memo(function GradientBackground({
  children,
  theme = 'cosmic',
}: GradientBackgroundProps) {
  return (
    <div className="relative min-h-screen w-full bg-[#07070F] text-white overflow-hidden selection:bg-purple-500/40 selection:text-white">
      {/* 
        Atmospheric Multi-layer Mesh & Radial Gradient Foundation
        Provides the luminous backdrop that shines through frosted glass panels
      */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Ambient base lighting */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `
              radial-gradient(at 10% 20%, rgba(76, 29, 149, 0.5) 0px, transparent 50%),
              radial-gradient(at 90% 15%, rgba(14, 165, 233, 0.45) 0px, transparent 55%),
              radial-gradient(at 50% 50%, rgba(147, 51, 234, 0.35) 0px, transparent 65%),
              radial-gradient(at 25% 85%, rgba(236, 72, 153, 0.4) 0px, transparent 55%),
              radial-gradient(at 80% 85%, rgba(59, 130, 246, 0.45) 0px, transparent 60%)
            `,
          }}
        />

        {/* Floating GPU-composited animated light orbs with heavy gaussian blur */}
        <div
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-violet-600/45 to-fuchsia-500/45 blur-[120px] will-change-transform animate-[pulse_10s_ease-in-out_infinite]"
          style={{ animationDuration: '14s' }}
        />

        <div
          className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-cyan-500/40 via-blue-600/35 to-indigo-600/40 blur-[140px] will-change-transform animate-[pulse_12s_ease-in-out_infinite]"
          style={{ animationDuration: '18s', animationDelay: '2s' }}
        />

        <div
          className="absolute top-2/3 left-1/5 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-500/35 via-purple-600/30 to-violet-800/40 blur-[130px] will-change-transform animate-[pulse_11s_ease-in-out_infinite]"
          style={{ animationDuration: '16s', animationDelay: '4s' }}
        />

        <div
          className="absolute -bottom-36 right-1/4 w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-emerald-500/30 via-teal-600/30 to-cyan-500/35 blur-[140px] will-change-transform animate-[pulse_13s_ease-in-out_infinite]"
          style={{ animationDuration: '20s', animationDelay: '1s' }}
        />

        {/* Subtle noise texture layer for physical material tactility */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient top & bottom light vignettes */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-[#07070F]/80 pointer-events-none" />
      </div>

      {/* Foreground Content Stack */}
      <div className="relative z-10 w-full flex flex-col">{children}</div>
    </div>
  );
});
