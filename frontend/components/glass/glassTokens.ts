/**
 * Glassmorphism Design System Configuration & Type Tokens
 * Inspired by visionOS, Windows 11 Fluent Acrylic, and modern layered interfaces.
 */

export type GlassVariant = 'light' | 'medium' | 'heavy' | 'elevated' | 'inset';

export interface GlassTierStyles {
  /** Background translucent tint */
  bg: string;
  /** Backdrop blur intensity in px and tailwind */
  blur: string;
  /** 1px structural light-catching border */
  border: string;
  /** Inner specular highlight & multi-layered atmospheric ambient shadow */
  shadow: string;
  /** Fallback background for legacy browsers without backdrop-filter support */
  fallbackBg: string;
}

export const GLASS_TIERS: Record<GlassVariant, GlassTierStyles> = {
  // Layer 1: Ambient background panels, quiet tertiary surfaces
  light: {
    bg: 'bg-white/[0.04] dark:bg-white/[0.04]',
    blur: 'backdrop-blur-md',
    border: 'border border-white/[0.08]',
    shadow: 'shadow-[0_8px_32px_0_rgba(0,0,0,0.25),inset_0_1px_1px_0_rgba(255,255,255,0.08)]',
    fallbackBg: 'bg-stone-900/90',
  },
  // Layer 2: Primary interactive content cards, feature sections, standard panels
  medium: {
    bg: 'bg-white/[0.08] dark:bg-white/[0.08]',
    blur: 'backdrop-blur-xl',
    border: 'border border-white/[0.18]',
    shadow: 'shadow-[0_16px_40px_0_rgba(0,0,0,0.35),inset_0_1px_2px_0_rgba(255,255,255,0.20),inset_0_0_0_1px_rgba(255,255,255,0.05)]',
    fallbackBg: 'bg-stone-900/95',
  },
  // Layer 3: Prominent focal panels like Hero card, featured pricing, navigation bar
  heavy: {
    bg: 'bg-white/[0.14] dark:bg-white/[0.12]',
    blur: 'backdrop-blur-2xl',
    border: 'border border-white/[0.28]',
    shadow: 'shadow-[0_24px_50px_0_rgba(0,0,0,0.45),inset_0_1.5px_2px_0_rgba(255,255,255,0.35),inset_0_-1px_2px_0_rgba(0,0,0,0.2)]',
    fallbackBg: 'bg-stone-900',
  },
  // Layer 4: Floating modals, popovers, active tooltips that float above everything
  elevated: {
    bg: 'bg-white/[0.22] dark:bg-white/[0.18]',
    blur: 'backdrop-blur-3xl',
    border: 'border border-white/[0.40]',
    shadow: 'shadow-[0_32px_64px_0_rgba(0,0,0,0.55),0_0_24px_2px_rgba(139,92,246,0.25),inset_0_2px_3px_0_rgba(255,255,255,0.5)]',
    fallbackBg: 'bg-stone-900',
  },
  // Inset Form fields & inputs that look like recessed glass cavities
  inset: {
    bg: 'bg-black/[0.20] dark:bg-black/[0.25]',
    blur: 'backdrop-blur-lg',
    border: 'border border-white/[0.14]',
    shadow: 'shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.4),0_1px_1px_0_rgba(255,255,255,0.1)]',
    fallbackBg: 'bg-black/80',
  },
};
