'use client';
import React from 'react';
import { GlassCard } from './GlassCard';

const FEATURES = [
  {
    icon: '🔮',
    title: 'Optical Refraction',
    description:
      'Physically simulated frosted acrylic finishes with specular highlights along upper bevels for authentic material response.',
    tag: 'Materials',
    tier: 'medium' as const,
    glow: 'rgba(168, 85, 247, 0.45)',
  },
  {
    icon: '✨',
    title: 'Multi-Tier Blur Hierarchy',
    description:
      'Three decoupled optical blur depths (12px, 24px, 40px) that instantly signal spatial elevation and interaction priority.',
    tag: 'Spatial',
    tier: 'heavy' as const,
    glow: 'rgba(236, 72, 153, 0.45)',
  },
  {
    icon: '⚡',
    title: 'GPU Accelerated 60 FPS',
    description:
      'Backdrop filters composited with will-change and transform isolation to ensure fluid scroll without compositor frame drops.',
    tag: 'Performance',
    tier: 'medium' as const,
    glow: 'rgba(14, 165, 233, 0.45)',
  },
  {
    icon: '🎯',
    title: 'Sub-Pixel Contrast Guard',
    description:
      'Engineered text shadow offsets and adaptive opacity backplates that guarantee WCAG AAA readability against any gradient.',
    tag: 'Accessibility',
    tier: 'medium' as const,
    glow: 'rgba(52, 211, 153, 0.45)',
  },
  {
    icon: '🌌',
    title: 'Luminous Ambient Shadows',
    description:
      'Shadows infused with ambient chroma from the underlying backdrop rather than muddy flat black drop shadows.',
    tag: 'Lighting',
    tier: 'medium' as const,
    glow: 'rgba(244, 114, 182, 0.45)',
  },
  {
    icon: '🛡️',
    title: 'Graceful Fallback Matrix',
    description:
      'CSS @supports progressive enhancement with solid dark acrylic fills for legacy environments lacking backdrop filters.',
    tag: 'Compatibility',
    tier: 'medium' as const,
    glow: 'rgba(251, 191, 36, 0.45)',
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400">
          Engineering Architecture
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          A Layered System of Light and Transparency
        </p>
        <p className="text-white/70 text-sm sm:text-base">
          Each component is calibrated like a physical optic lens, balancing light refraction, blur diffusion, and typography clarity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feat) => (
          <GlassCard
            key={feat.title}
            variant={feat.tier}
            interactive={true}
            glowColor={feat.glow}
            borderLuminosity="vibrant"
            className="p-7 flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/20 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {feat.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                  {feat.tag}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">
                {feat.title}
              </h3>

              <p className="text-sm text-white/70 leading-relaxed font-normal">
                {feat.description}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold text-purple-300 group-hover:text-white transition-colors">
              <span>Inspect Token Spec</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};
