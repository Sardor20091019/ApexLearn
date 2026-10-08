'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { audioSynth } from './AudioSynth';

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
  textStrength?: number;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  asPill?: boolean;
}

export function Magnetic({
  children,
  strength = 0.45,
  textStrength = 0.2,
  className = '',
  onClick,
  asPill = false,
}: MagneticProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    const content = contentRef.current;
    if (!el) return;

    // Fast GSAP quickTo setters for 60FPS fluid physics
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' });

    const contentXTo = content
      ? gsap.quickTo(content, 'x', { duration: 0.6, ease: 'power3.out' })
      : null;
    const contentYTo = content
      ? gsap.quickTo(content, 'y', { duration: 0.6, ease: 'power3.out' })
      : null;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distX = (e.clientX - centerX) * strength;
      const distY = (e.clientY - centerY) * strength;

      xTo(distX);
      yTo(distY);

      if (contentXTo && contentYTo) {
        contentXTo(distX * textStrength);
        contentYTo(distY * textStrength);
      }
    };

    const handlePointerLeave = () => {
      xTo(0);
      yTo(0);
      if (contentXTo && contentYTo) {
        contentXTo(0);
        contentYTo(0);
      }
    };

    const handlePointerEnter = () => {
      audioSynth.playHover();
    };

    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerleave', handlePointerLeave);
    el.addEventListener('pointerenter', handlePointerEnter);

    return () => {
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerleave', handlePointerLeave);
      el.removeEventListener('pointerenter', handlePointerEnter);
    };
  }, [strength, textStrength]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`inline-block cursor-pointer select-none transition-transform will-change-transform ${asPill ? 'rounded-full' : ''} ${className}`}
    >
      <div ref={contentRef} className="w-full h-full will-change-transform">
        {children}
      </div>
    </div>
  );
}
