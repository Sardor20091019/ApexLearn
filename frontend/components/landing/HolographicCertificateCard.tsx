'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

interface HolographicCertificateCardProps {
  isLight?: boolean;
}

export function HolographicCertificateCard({ isLight = false }: HolographicCertificateCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glintPos, setGlintPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 12;

    setRotateX(rX);
    setRotateY(rY);
    setGlintPos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlintPos({ x: 50, y: 50 });
  };

  return (
    <div
      className="relative select-none perspective-1000 py-6"
      style={{ perspective: '1200px' }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        }}
        className={`relative mx-auto max-w-xl w-full rounded-2xl p-6 sm:p-8 transition-colors duration-300 overflow-hidden cursor-crosshair group ${
          isLight
            ? 'bg-white border border-zinc-200/90 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,1)]'
            : 'bg-[#0d0e14] border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)]'
        }`}
      >
        {/* Holographic Specular Sheen Layer */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? (isLight ? 0.6 : 0.85) : (isLight ? 0.15 : 0.25),
            background: isLight
              ? `radial-gradient(circle at ${glintPos.x}% ${glintPos.y}%, rgba(255,255,255,0.9) 0%, rgba(244,63,94,0.18) 25%, rgba(6,182,212,0.18) 50%, rgba(168,85,247,0.15) 70%, transparent 85%)`
              : `radial-gradient(circle at ${glintPos.x}% ${glintPos.y}%, rgba(255,255,255,0.45) 0%, rgba(244,63,94,0.25) 20%, rgba(6,182,212,0.25) 45%, rgba(168,85,247,0.2) 65%, transparent 80%)`,
            mixBlendMode: isLight ? 'multiply' : 'color-dodge',
          }}
        />

        {/* Diagonal Guilloché Pattern Texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${isLight ? '#000' : '#fff'} 0, ${isLight ? '#000' : '#fff'} 1px, transparent 0, transparent 16px)`,
          }}
        />

        {/* Certificate Header Stamp */}
        <div className={`relative z-10 flex items-start justify-between border-b pb-5 ${isLight ? 'border-zinc-200' : 'border-white/10'}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-600 font-bold">
                PROVENANCE LEDGER • VALIDATED
              </span>
            </div>
            <h4 className={`text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              APEX DIPLOMA OF MASTERY
            </h4>
            <p className={`text-[11px] font-mono ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              SERIAL: APX-2026-99482-ED // BLOCK #849,201
            </p>
          </div>

          {/* Golden Seal */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-amber-500/80 bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-amber-200/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-dashed border-amber-500/60 flex items-center justify-center text-center">
              <span className="text-amber-600 font-black text-xs sm:text-sm">★ APX ★</span>
            </div>
          </div>
        </div>

        {/* Recipient & Achievement Body */}
        <div className="relative z-10 py-6 space-y-4">
          <div className="space-y-1">
            <span className={`text-[10px] font-mono uppercase tracking-widest ${isLight ? 'text-zinc-500 font-bold' : 'text-zinc-500'}`}>
              CANDIDATE AWARDED
            </span>
            <div className={`text-xl sm:text-2xl font-black tracking-tight ${
              isLight
                ? 'text-zinc-900'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400'
            }`}>
              ALEXANDER V. VANE
            </div>
          </div>

          <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
            For demonstrating rigorous mastery in <strong className={isLight ? 'text-zinc-950 font-bold' : 'text-white font-bold'}>Distributed Systems & Realtime Raymarching</strong>, completing 100% of physical lecture timelines, submitting cryptographically validated exercises, and passing peer-reviewed code defense.
          </p>

          {/* Cryptographic Hash Bar */}
          <div className={`p-3 rounded-lg font-mono text-[10px] space-y-1 border ${
            isLight
              ? 'bg-zinc-100/80 border-zinc-200 text-zinc-800'
              : 'bg-black/60 border-white/10 text-zinc-300'
          }`}>
            <div className={`uppercase tracking-widest flex justify-between ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
              <span>SHA-256 INTEGRITY DIGEST</span>
              <span className="text-emerald-600 font-bold">PASSED</span>
            </div>
            <div className={`truncate ${isLight ? 'text-zinc-900 font-medium' : 'text-zinc-300'}`}>
              e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
          </div>
        </div>

        {/* Certificate Signatures & Actions */}
        <div className={`relative z-10 pt-4 border-t flex flex-wrap items-center justify-between gap-4 ${isLight ? 'border-zinc-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-[11px] ${
              isLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-700 font-bold'
                : 'bg-white/5 border-white/10 text-zinc-300'
            }`}>
              QR
            </div>
            <div className="text-[10px] font-mono leading-tight">
              <div className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>ISSUED: OCT 2026</div>
              <div className={`font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-200'}`}>PUBLICLY VERIFIABLE</div>
            </div>
          </div>

          <Link
            href="/verify/APX-DEMO-2026"
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <span>Verify Live Ledger</span>
            <span>↗</span>
          </Link>
        </div>
      </div>

      <p className={`text-center font-mono text-[11px] mt-4 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
        Interactive 3D Holographic Proof • Hover to tilt and reflect ambient photons
      </p>
    </div>
  );
}
