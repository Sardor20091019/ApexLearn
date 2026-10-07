'use client';
import React from 'react';
import Link from 'next/link';
import { GlassCard } from './GlassCard';

export const Footer = () => {
  return (
    <footer className="w-full px-4 sm:px-8 py-12 max-w-7xl mx-auto">
      <GlassCard
        variant="medium"
        className="p-8 sm:p-12 relative overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-0.5 flex items-center justify-center shadow-md overflow-hidden">
                <img
                  src="/images/image.png"
                  alt="ApexLearn Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                Apex<span className="text-purple-400 font-light">Learn</span>
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed font-normal">
              Spatial design system and layered translucent component library engineered for modern web and spatial apps.
            </p>
          </div>

          {/* Links Columns */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/90">Components</h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li><a href="#overview" className="hover:text-white transition-colors">GlassCard</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Backdrop Mesh</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Specular Bevels</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">GlassInput Inset</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/90">Design System</h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Token Specs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">visionOS Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Fluent Acrylic Mapping</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contrast Ratio Rules</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/90">Product</h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Learner Space</Link></li>
              <li><Link href="/auth" className="hover:text-white transition-colors">Account Portal</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Principles</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} ApexGlass UI. Layered Translucent Interfaces. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-300 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              All Optical Shaders Active
            </span>
          </div>
        </div>
      </GlassCard>
    </footer>
  );
};
