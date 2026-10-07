'use client';
import React, { forwardRef, useState } from 'react';
import { GLASS_TIERS } from './glassTokens';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(function GlassInput(
  { label, error, icon, rightElement, className = '', id, ...props },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const tier = GLASS_TIERS.inset;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-white/80 select-none pl-1"
        >
          {label}
        </label>
      )}

      <div
        className={`
          relative flex items-center w-full rounded-2xl transition-all duration-200
          ${tier.bg} ${tier.blur} ${tier.border} ${tier.shadow}
          supports-[not(backdrop-filter:blur(1px))]:${tier.fallbackBg}
          ${
            isFocused
              ? 'border-purple-400/80 shadow-[0_0_20px_2px_rgba(168,85,247,0.35),inset_0_2px_4px_0_rgba(0,0,0,0.5)] ring-1 ring-purple-400/50'
              : 'hover:border-white/30'
          }
          ${error ? 'border-rose-500/80 ring-1 ring-rose-500/50' : ''}
        `}
      >
        {icon && <div className="pl-4 text-white/50 pointer-events-none flex items-center">{icon}</div>}

        <input
          id={inputId}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full bg-transparent px-4 py-3.5 text-sm text-white placeholder-white/40
            outline-none font-medium transition-colors
            ${icon ? 'pl-2.5' : ''}
            ${rightElement ? 'pr-12' : ''}
            ${className}
          `}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 flex items-center text-white/60">{rightElement}</div>
        )}
      </div>

      {error && <p className="text-xs text-rose-400 pl-1 font-medium">{error}</p>}
    </div>
  );
});
