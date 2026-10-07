'use client';
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  recommended?: boolean;
  ctaText: string;
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    description: 'Perfect for exploring glassmorphism UI tokens and experiments.',
    features: [
      'Basic frosted glass tokens (Light variant)',
      'Single-stage backdrop blur (12px)',
      'Community mesh presets',
      'Standard web typography contrast guide',
    ],
    ctaText: 'Get Started',
  },
  {
    name: 'Pro Spatial',
    price: '$29',
    period: 'per month',
    description: 'Advanced visionOS depth engine for production applications.',
    recommended: true,
    features: [
      'Complete 4-tier glass system (Light, Medium, Heavy, Elevated)',
      'Dynamic specular edge highlights & inner bevels',
      'Multi-stop chroma-infused atmospheric shadows',
      'GPU composition optimizer & mobile low-power mode',
      'Figma & Tailwind token sync',
      'Priority Discord community access',
    ],
    ctaText: 'Upgrade to Pro',
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: 'per month',
    description: 'Tailored spatial design system for high-scale enterprise platforms.',
    features: [
      'Custom shader mesh gradients with WebGL',
      'Bespoke multi-tenant theme generator',
      'Full source code & custom design tokens',
      'Automated WCAG contrast compliance testing',
      'Dedicated UI engineer pairing sessions',
    ],
    ctaText: 'Contact Spatial Team',
  },
];

export const Pricing = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-pink-400">
          Transparent Investment
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Spatial Plans for Teams of Every Dimension
        </p>
        <p className="text-white/70 text-sm sm:text-base">
          Choose the glass tier that matches your product elevation requirements.
        </p>

        {/* Toggle billing switch */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-bold ${!annual ? 'text-white' : 'text-white/50'}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="w-12 h-6 rounded-full bg-white/10 border border-white/20 p-1 flex items-center transition-colors backdrop-blur-md"
            aria-label="Toggle annual billing"
          >
            <div
              className={`w-4 h-4 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 shadow-md transform transition-transform ${
                annual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-bold ${annual ? 'text-white' : 'text-white/50'} flex items-center gap-1.5`}>
            Annual <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30">Save 25%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {PLANS.map((plan) => {
          const isRec = plan.recommended;

          return (
            <GlassCard
              key={plan.name}
              variant={isRec ? 'elevated' : 'medium'}
              borderLuminosity={isRec ? 'intense' : 'subtle'}
              glowColor={isRec ? 'rgba(236, 72, 153, 0.5)' : 'rgba(168, 85, 247, 0.25)'}
              interactive={true}
              className={`p-8 sm:p-10 flex flex-col justify-between relative ${
                isRec
                  ? 'lg:-translate-y-3 shadow-[0_32px_64px_rgba(0,0,0,0.6),0_0_40px_rgba(236,72,153,0.25)] border-white/40'
                  : ''
              }`}
            >
              {isRec && (
                <div className="absolute top-0 inset-x-0 -translate-y-1/2 flex justify-center">
                  <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-fuchsia-500 via-pink-500 to-purple-600 text-white shadow-lg border border-white/40">
                    Most Popular Tier
                  </span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {annual && plan.price !== '$0'
                      ? `$${Math.round(parseInt(plan.price.slice(1)) * 0.75)}`
                      : plan.price}
                  </span>
                  <span className="text-xs text-white/60 font-semibold">{plan.period}</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50 block">
                    Included Capabilities
                  </span>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs text-white/80 leading-normal">
                        <span className="text-purple-400 shrink-0 font-bold">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  className={`w-full py-3.5 px-6 rounded-2xl text-xs font-extrabold transition-all duration-200 active:scale-95 shadow-lg ${
                    isRec
                      ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white border border-white/40 hover:brightness-110 shadow-fuchsia-600/30'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
};
