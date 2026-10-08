'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Magnetic } from './Magnetic';
import { audioSynth } from './AudioSynth';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function AsymmetricMosaic({ onSelectProject }: { onSelectProject?: (id: string) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const media70Ref = useRef<HTMLDivElement>(null);
  const media60Ref = useRef<HTMLDivElement>(null);
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const vectorCanvasRef = useRef<HTMLCanvasElement>(null);

  // Audio spectrum mock bars
  const [frequencies, setFrequencies] = useState<number[]>([40, 65, 80, 55, 95, 70, 45, 85, 30, 60]);

  // Frequency bar simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setFrequencies((prev) =>
        prev.map(() => Math.floor(20 + Math.random() * 75))
      );
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // GSAP ScrollTrigger for scale-down & unmasking
  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const ctx = gsap.context(() => {
      // 70% Block: Scale from 1.08 down to 1.0 as it enters viewport
      if (media70Ref.current) {
        gsap.fromTo(
          media70Ref.current,
          {
            scale: 1.08,
            clipPath: 'polygon(0% 15%, 100% 15%, 100% 100%, 0% 100%)',
          },
          {
            scale: 1.0,
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            ease: 'none',
            scrollTrigger: {
              trigger: media70Ref.current,
              start: 'top 85%',
              end: 'top 20%',
              scrub: 1,
            },
          }
        );
      }

      // 60% Block: Scale from 1.08 down to 1.0
      if (media60Ref.current) {
        gsap.fromTo(
          media60Ref.current,
          {
            scale: 1.08,
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 0% 85%)',
          },
          {
            scale: 1.0,
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            ease: 'none',
            scrollTrigger: {
              trigger: media60Ref.current,
              start: 'top 85%',
              end: 'top 20%',
              scrub: 1,
            },
          }
        );
      }
    }, sectionEl);

    return () => ctx.revert();
  }, []);

  // Interactive Shader Simulation Canvas (70% Block)
  useEffect(() => {
    const canvas = shaderCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let mouse = { x: 0.5, y: 0.5 };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = (e.clientY - rect.top) / rect.height;
    };

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });

    const render = () => {
      time += 0.015;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#0D0D0D';
      ctx.fillRect(0, 0, w, h);

      // Render concentric brutalist volumetric rings
      const cx = w * (0.35 + mouse.x * 0.3);
      const cy = h * (0.35 + mouse.y * 0.3);

      for (let i = 12; i > 0; i--) {
        const radius = i * 28 + Math.sin(time + i * 0.4) * 14;
        const alpha = (1 - i / 14) * 0.25;

        ctx.strokeStyle = i % 3 === 0 ? 'rgba(255, 62, 0, 0.65)' : `rgba(245, 245, 243, ${alpha})`;
        ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.8;

        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * 1.6, radius, time * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Dynamic cross lines
      ctx.strokeStyle = 'rgba(245, 245, 243, 0.06)';
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // Interactive Vector Deformer Canvas (60% Block)
  useEffect(() => {
    const canvas = vectorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let pointerX = -100;
    let pointerY = -100;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
    };

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });

    const render = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Render interactive geometric lattice
      const cols = 8;
      const rows = 6;
      const gapX = w / (cols + 1);
      const gapY = h / (rows + 1);

      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          const baseX = c * gapX;
          const baseY = r * gapY;

          // Warp based on pointer distance
          const dx = pointerX - baseX;
          const dy = pointerY - baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pull = Math.max(0, 1 - dist / 180) * 40;

          const angle = Math.atan2(dy, dx);
          const x = baseX - Math.cos(angle) * pull + Math.sin(time + r) * 3;
          const y = baseY - Math.sin(angle) * pull + Math.cos(time + c) * 3;

          // Render crosshair point
          const isNear = dist < 120;
          ctx.strokeStyle = isNear ? '#FF3E00' : 'rgba(245, 245, 243, 0.3)';
          ctx.lineWidth = isNear ? 1.5 : 0.8;

          const size = isNear ? 8 : 4;
          ctx.beginPath();
          ctx.moveTo(x - size, y);
          ctx.lineTo(x + size, y);
          ctx.moveTo(x, y - size);
          ctx.lineTo(x, y + size);
          ctx.stroke();

          // Connect with diagonal line
          if (c < cols && r < rows) {
            ctx.strokeStyle = 'rgba(245, 245, 243, 0.05)';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo((c + 1) * gapX, (r + 1) * gapY);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <section
      id="mosaic"
      ref={sectionRef}
      className="relative w-full py-16 sm:py-24 px-3 sm:px-6 md:px-8 border-b border-[#F5F5F3]/10 bg-[#0D0D0D] overflow-hidden"
    >
      {/* Extreme edge section index */}
      <div className="w-full flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#F5F5F3]/40 border-b border-[#F5F5F3]/10 pb-4 mb-10">
        <div className="flex items-center gap-3">
          <span className="text-[#FF3E00] font-bold">[02]</span>
          <span>ASYMMETRIC MOSAIC</span>
          <span className="text-[#F5F5F3]/20">/</span>
          <span>RATIO 70:30 & 40:60</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#FF3E00]">✦</span>
          <span>SPATIAL TENSION MATRIX</span>
        </div>
      </div>

      {/* Row 1: 70 / 30 Asymmetric Split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 sm:gap-8 mb-12 sm:mb-16">
        {/* 70% Block: Monolithic Volumetric Raymarcher */}
        <div className="lg:col-span-7 flex flex-col justify-between border border-[#F5F5F3]/15 p-5 sm:p-8 bg-[#0D0D0D] relative group">
          {/* Header Bar */}
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#F5F5F3]/60 mb-6">
            <span className="text-[#FF3E00] font-bold">[MOSAIC // 01]</span>
            <span>VOLUMETRIC MONOLITH</span>
            <span>RES: 8192×4320</span>
          </div>

          {/* Fluid Media Container with Scale-Down GSAP ScrollTrigger */}
          <div
            ref={media70Ref}
            className="relative w-full h-[320px] sm:h-[440px] border border-[#F5F5F3]/10 overflow-hidden bg-[#0D0D0D] will-change-transform"
          >
            <canvas
              ref={shaderCanvasRef}
              width={800}
              height={500}
              className="w-full h-full block cursor-crosshair"
            />
            {/* Overlay Specs */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-[#F5F5F3]/60 pointer-events-none">
              <span>RAYMARCH DENSITY: 128 PASS</span>
              <span className="text-[#FF3E00]">POINTER DISPLACEMENT ACTIVE</span>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-[#F5F5F3]/10 pt-4">
            <div>
              <h2 className="font-['Syne',sans-serif] text-2xl sm:text-3xl font-extrabold uppercase text-[#F5F5F3] tracking-tight">
                MONOLITHIC RUNTIME
              </h2>
              <p className="font-mono text-xs text-[#F5F5F3]/60 uppercase mt-1">
                Zero boilerplate wrappers. Direct computational raymarching geometry.
              </p>
            </div>
            <Magnetic strength={0.3} asPill>
              <button
                onClick={() => {
                  audioSynth.playTick();
                  onSelectProject?.('spatial-shaders-webgl');
                }}
                className="px-4 py-2 rounded-full border border-[#F5F5F3]/25 font-mono text-[11px] uppercase text-[#F5F5F3] hover:border-[#FF3E00] hover:text-[#FF3E00] transition-colors"
              >
                INSPECT SHADER →
              </button>
            </Magnetic>
          </div>
        </div>

        {/* 30% Block: Kinetic Typography Pillar */}
        <div className="lg:col-span-3 flex flex-col justify-between border border-[#F5F5F3]/15 p-5 sm:p-7 bg-[#0D0D0D] relative">
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase text-[#FF3E00] mb-4">
              <span>[MOSAIC // 02]</span>
              <span>KINETICS</span>
            </div>

            <h3 className="font-['Syne',sans-serif] text-3xl sm:text-4xl font-extrabold uppercase text-[#F5F5F3] leading-[0.9] tracking-tight mb-4">
              KINETIC SPECTRUM
            </h3>

            <p className="font-mono text-xs text-[#F5F5F3]/60 uppercase leading-relaxed mb-6">
              Live haptic signal analyzer. Real-time audio frequency telemetry rendered via
              procedural tick vectors.
            </p>

            {/* Live Audio Frequency Spectrum Mock */}
            <div className="border border-[#F5F5F3]/10 p-4 bg-[#0D0D0D]/60 mb-6">
              <div className="flex items-end justify-between h-24 gap-1.5">
                {frequencies.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center h-full">
                    <div
                      className="w-full bg-[#F5F5F3]/30 hover:bg-[#FF3E00] transition-all duration-100 rounded-t-xs"
                      style={{
                        height: `${h}%`,
                        backgroundColor: i === 4 || i === 7 ? '#FF3E00' : undefined,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center font-mono text-[8px] text-[#F5F5F3]/40 mt-2 uppercase">
                <span>0.1 KHZ</span>
                <span className="text-[#FF3E00]">PEAK 144 HZ</span>
                <span>24 KHZ</span>
              </div>
            </div>
          </div>

          <div className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F3]/40 border-t border-[#F5F5F3]/10 pt-3 flex justify-between">
            <span>CHANNELS: STEREO</span>
            <span className="text-[#FF3E00]">SYNTH V2.4</span>
          </div>
        </div>
      </div>

      {/* Row 2: 40 / 60 Asymmetric Split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 sm:gap-8">
        {/* 40% Block: Spatial Manifesto */}
        <div className="lg:col-span-4 flex flex-col justify-between border border-[#F5F5F3]/15 p-5 sm:p-8 bg-[#0D0D0D] relative">
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase text-[#FF3E00] mb-4">
              <span>[MOSAIC // 03]</span>
              <span>MANIFESTO</span>
            </div>

            <h3 className="font-['Syne',sans-serif] text-4xl sm:text-5xl font-black uppercase text-[#F5F5F3] leading-[0.88] tracking-tight mb-6">
              VOID PROTOCOL
            </h3>

            <blockquote className="font-mono text-xs sm:text-sm text-[#F5F5F3]/75 uppercase leading-relaxed border-l-2 border-[#FF3E00] pl-4 mb-6">
              &quot;We reject generic container cards, bootstrap margins, and repetitive commercial
              templates. Every layout must kiss the physical edge of the display.&quot;
            </blockquote>

            <div className="space-y-2 font-mono text-[10px] text-[#F5F5F3]/50 uppercase">
              <div className="flex justify-between border-b border-[#F5F5F3]/10 pb-1">
                <span>PRINCIPLE:</span>
                <span className="text-[#F5F5F3]">EDGE ALIGNMENT</span>
              </div>
              <div className="flex justify-between border-b border-[#F5F5F3]/10 pb-1">
                <span>CHROMATICS:</span>
                <span className="text-[#F5F5F3]">3-TONE STRICT</span>
              </div>
              <div className="flex justify-between border-b border-[#F5F5F3]/10 pb-1">
                <span>FRAME PHYSICS:</span>
                <span className="text-[#FF3E00]">LENIS INTERPOLATION</span>
              </div>
            </div>
          </div>

          <div className="mt-8 font-mono text-[9px] uppercase tracking-widest text-[#F5F5F3]/40 border-t border-[#F5F5F3]/10 pt-3 flex justify-between">
            <span>SIGNED: APEX STUDIO</span>
            <span>MMXXVI</span>
          </div>
        </div>

        {/* 60% Block: Interactive Vector Deformer */}
        <div className="lg:col-span-6 flex flex-col justify-between border border-[#F5F5F3]/15 p-5 sm:p-8 bg-[#0D0D0D] relative group">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#F5F5F3]/60 mb-6">
            <span className="text-[#FF3E00] font-bold">[MOSAIC // 04]</span>
            <span>VECTOR TOPOLOGY DEFORMER</span>
            <span>48 NODES</span>
          </div>

          {/* Fluid Media Container with Scale-Down GSAP ScrollTrigger */}
          <div
            ref={media60Ref}
            className="relative w-full h-[280px] sm:h-[380px] border border-[#F5F5F3]/10 overflow-hidden bg-[#0D0D0D] will-change-transform"
          >
            <canvas
              ref={vectorCanvasRef}
              width={700}
              height={400}
              className="w-full h-full block cursor-crosshair"
            />
            <div className="absolute top-3 left-4 font-mono text-[9px] uppercase tracking-wider text-[#F5F5F3]/40 pointer-events-none">
              MOVE CURSOR TO PERTURB TOPOLOGY
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-[#F5F5F3]/10 pt-4">
            <div>
              <h2 className="font-['Syne',sans-serif] text-2xl sm:text-3xl font-extrabold uppercase text-[#F5F5F3] tracking-tight">
                DYNAMIC DEFORMATION
              </h2>
              <p className="font-mono text-xs text-[#F5F5F3]/60 uppercase mt-1">
                Proximity calculations running on requestAnimationFrame ticker.
              </p>
            </div>
            <Magnetic strength={0.3} asPill>
              <button
                onClick={() => {
                  audioSynth.playTick();
                  onSelectProject?.('neural-inference-hardware');
                }}
                className="px-4 py-2 rounded-full border border-[#F5F5F3]/25 font-mono text-[11px] uppercase text-[#F5F5F3] hover:border-[#FF3E00] hover:text-[#FF3E00] transition-colors"
              >
                INSPECT SYSTEM →
              </button>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
