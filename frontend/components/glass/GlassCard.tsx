'use client';
import React, { forwardRef } from 'react';
import { GlassVariant, GLASS_TIERS } from './glassTokens';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  interactive?: boolean;
  borderLuminosity?: 'subtle' | 'vibrant' | 'intense';
  glowColor?: string;
  className?: string;
  children: React.ReactNode;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  {
    variant = 'medium',
    interactive = false,
    borderLuminosity = 'subtle',
    glowColor = 'rgba(168, 85, 247, 0.4)',
    className = '',
    children,
    ...props
  },
  ref
) {
  const tier = GLASS_TIERS[variant];

  const luminosityBorder =
    borderLuminosity === 'intense'
      ? 'border-white/40 hover:border-white/60'
      : borderLuminosity === 'vibrant'
      ? 'border-white/25 hover:border-white/40'
      : 'border-white/15 hover:border-white/25';

  const interactiveStyles = interactive
    ? 'transition-all duration-300 ease-out cursor-pointer hover:-translate-y-1 hover:brightness-110 hover:shadow-[0_22px_45px_0_rgba(0,0,0,0.5),0_0_30px_0_var(--glow-color)] active:scale-[0.98]'
    : 'transition-all duration-300';

  return (
    <div
      ref={ref}
      style={{ '--glow-color': glowColor } as React.CSSProperties}
      className={`
        relative rounded-3xl overflow-hidden
        ${tier.bg} ${tier.blur} ${tier.shadow}
        border ${luminosityBorder}
        ${interactiveStyles}
        supports-[not(backdrop-filter:blur(1px))]:${tier.fallbackBg}
        before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent
        ${className}
      `}
      {...props}
    >
      {/* Light sheen refraction overlay on hover */}
      {interactive && (
        <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
      )}
      {children}
    </div>
  );
});
