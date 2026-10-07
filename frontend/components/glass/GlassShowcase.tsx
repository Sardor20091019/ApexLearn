'use client';
import React, { useState } from 'react';
import { GradientBackground } from './GradientBackground';
import { GlassNavbar } from './GlassNavbar';
import { Hero } from './Hero';
import { Features } from './Features';
import { Pricing } from './Pricing';
import { GlassCard } from './GlassCard';
import { GlassInput } from './GlassInput';
import { Footer } from './Footer';

export const GlassShowcase = () => {
  const [activeTab, setActiveTab] = useState<'layer1' | 'layer2' | 'layer3'>('layer2');
  const [interactiveBlur, setInteractiveBlur] = useState<number>(24);
  const [interactiveOpacity, setInteractiveOpacity] = useState<number>(12);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <GradientBackground>
      <GlassNavbar />

      <main className="w-full flex flex-col items-center">
        {/* Floating Hero Section */}
        <Hero />

        {/* Interactive Optical Sandbox */}
        <section id="architecture" className="py-16 px-4 sm:px-8 max-w-7xl w-full mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Interactive Lab
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Optical Calibrator & Layer Hierarchy
            </p>
            <p className="text-white/70 text-sm">
              Adjust the physical refraction parameters and observe how depth separation maintains material fidelity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Control Panel (Layer 2 Glass) */}
            <GlassCard variant="medium" className="lg:col-span-5 p-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🎛️</span> Lens Properties
              </h3>

              <div className="space-y-4 text-xs font-semibold">
                <div className="space-y-2">
                  <div className="flex justify-between text-white/80">
                    <span>Backdrop Blur Intensity</span>
                    <span className="text-purple-300 font-mono">{interactiveBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="64"
                    value={interactiveBlur}
                    onChange={(e) => setInteractiveBlur(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-white/80">
                    <span>Glass Translucency Opacity</span>
                    <span className="text-purple-300 font-mono">{interactiveOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="45"
                    value={interactiveOpacity}
                    onChange={(e) => setInteractiveOpacity(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-white/80 block">Hierarchy Presets</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'layer1', label: 'L1 Light', b: 12, o: 6 },
                      { id: 'layer2', label: 'L2 Medium', b: 24, o: 12 },
                      { id: 'layer3', label: 'L3 Elevated', b: 40, o: 22 },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(p.id as any);
                          setInteractiveBlur(p.b);
                          setInteractiveOpacity(p.o);
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          activeTab === p.id
                            ? 'bg-purple-600/40 border-purple-400 text-white shadow-lg'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
                  >
                    Open Elevated Glass Modal (Layer 4)
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Dynamic Glass Stage */}
            <div className="lg:col-span-7 relative min-h-[380px] rounded-3xl p-8 flex items-center justify-center overflow-hidden border border-white/10">
              {/* Vibrant colorful gradient orbs visible through the dynamic glass */}
              <div className="absolute top-4 left-6 w-44 h-44 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 blur-2xl animate-pulse" />
              <div className="absolute bottom-6 right-8 w-52 h-52 rounded-full bg-gradient-to-bl from-cyan-400 to-blue-500 blur-2xl animate-pulse" />
              <div className="absolute top-1/2 left-1/3 w-36 h-36 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 blur-xl" />

              {/* Dynamically Calibrated Glass Panel */}
              <div
                style={{
                  backdropFilter: `blur(${interactiveBlur}px)`,
                  WebkitBackdropFilter: `blur(${interactiveBlur}px)`,
                  backgroundColor: `rgba(255, 255, 255, ${interactiveOpacity / 100})`,
                }}
                className="relative z-10 w-full max-w-md p-8 rounded-3xl border border-white/30 shadow-[0_24px_50px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.4)] text-center space-y-4"
              >
                <div className="inline-block px-3 py-1 rounded-full bg-white/20 border border-white/30 text-[10px] font-black uppercase tracking-wider text-white">
                  Realtime Optical Shader
                </div>
                <h4 className="text-2xl font-black text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                  Tactile visionOS Glass
                </h4>
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  Watch how background chromatic shapes retain their hue while their high-frequency details dissolve into smooth luminous tones.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-black/30 border border-white/15 text-[11px] font-mono text-purple-200">
                    Blur: {interactiveBlur}px
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-black/30 border border-white/15 text-[11px] font-mono text-pink-200">
                    Alpha: {interactiveOpacity}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Component Grid */}
        <Features />

        {/* Pricing Component with Depth Separation */}
        <Pricing />

        {/* Glass Modal (Elevated Layer) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
            <GlassCard
              variant="elevated"
              borderLuminosity="intense"
              className="max-w-md w-full p-8 relative shadow-[0_32px_64px_rgba(0,0,0,0.7),0_0_30px_rgba(168,85,247,0.4)]"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Elevated Modal (Tier 4)
                </span>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-xl font-black text-white mb-2">Spatial Depth Achieved</h3>
              <p className="text-xs text-white/80 leading-relaxed mb-6">
                This modal represents the highest layer in our glassmorphism elevation matrix. Notice the higher opacity, intense top specular edge, and multi-layered purple ambient glow.
              </p>

              <div className="space-y-3">
                <GlassInput label="Feedback" placeholder="What do you think of the depth?" />
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-extrabold text-xs shadow-lg hover:brightness-110"
                >
                  Dismiss Modal
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </main>

      <Footer />
    </GradientBackground>
  );
};
