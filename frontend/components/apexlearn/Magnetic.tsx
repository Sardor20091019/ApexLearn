'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}

export function Magnetic({ children, strength = 0.42, className = '', onClick }: MagneticProps) {
  const el = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = el.current;
    const innerEl = inner.current;
    if (!outer) return;

    const xTo = gsap.quickTo(outer, 'x', { duration: 0.7, ease: 'power3.out' });
    const yTo = gsap.quickTo(outer, 'y', { duration: 0.7, ease: 'power3.out' });
    const ixTo = innerEl ? gsap.quickTo(innerEl, 'x', { duration: 0.5, ease: 'power3.out' }) : null;
    const iyTo = innerEl ? gsap.quickTo(innerEl, 'y', { duration: 0.5, ease: 'power3.out' }) : null;

    const onMove = (e: PointerEvent) => {
      const rect = outer.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      xTo(dx);
      yTo(dy);
      ixTo?.(dx * 0.2);
      iyTo?.(dy * 0.2);
    };

    const onLeave = () => {
      xTo(0); yTo(0);
      ixTo?.(0); iyTo?.(0);
    };

    outer.addEventListener('pointermove', onMove);
    outer.addEventListener('pointerleave', onLeave);
    return () => {
      outer.removeEventListener('pointermove', onMove);
      outer.removeEventListener('pointerleave', onLeave);
    };
  }, [strength]);

  return (
    <div
      ref={el}
      onClick={onClick}
      className={`inline-block cursor-pointer will-change-transform ${className}`}
    >
      <div ref={inner} className="will-change-transform">{children}</div>
    </div>
  );
}
