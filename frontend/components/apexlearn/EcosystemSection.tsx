'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Magnetic } from './Magnetic';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const CREATOR_TOOLS = [
  {
    icon: '⬆',
    title: 'INSTANT UPLOAD ENGINE',
    desc: 'Drag, drop, and broadcast. Multi-format video ingestion with automatic transcoding to HLS adaptive bitrate — live within minutes.',
  },
  {
    icon: '⬡',
    title: 'STRUCTURAL CURRICULUM',
    desc: 'Section-based course architecture. Gate content by order, drip by schedule, or open all chapters on purchase. Your logic, fully enforced.',
  },
  {
    icon: '▤',
    title: 'PAYMENT INFRASTRUCTURE',
    desc: 'One-time, subscription, or tiered access. Stripe Connect wired directly to your account — no platform cut beyond the base 8% fee.',
  },
  {
    icon: '◈',
    title: 'ANALYTICS COMMAND',
    desc: 'Per-lesson watch depth, drop-off heatmaps, revenue attribution, student demographics. Raw signal, no vanity metrics.',
  },
];

const PREMIUM_COURSES = [
  { tag: 'GRAPHICS', title: 'Spatial WebGL Alchemy & Raymarching', creator: 'E. Soroka', price: '$129', duration: '15h 18m' },
  { tag: 'AI/ML', title: 'Local AI Inference Engines on Consumer Hardware', creator: 'S. Al-Mansoor', price: '$169', duration: '21h 10m' },
  { tag: 'CRYPTO', title: 'Distributed Consensus & Byzantine Fault Tolerance', creator: 'M. K. Chen', price: 'FREE', duration: '12h 05m' },
  { tag: 'DESIGN', title: 'Awwwards SOTD — Editorial Frontend Mastery', creator: 'Y. Tanaka', price: '$89', duration: '9h 30m' },
  { tag: 'SYSTEMS', title: 'Bare-Metal Rust: Kernel Architecture & Zero-Cost Abstractions', creator: 'N. Vance', price: '$149', duration: '18h 40m' },
];

export function EcosystemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  useEffect(() => {
    if (!sectionRef.current || !leftPanelRef.current || !rightPanelRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: false,
        scrub: 1.2,
        onUpdate: (self) => {
          const p = self.progress;
          if (leftPanelRef.current) {
            gsap.set(leftPanelRef.current, { y: p * -60 });
          }
          if (rightPanelRef.current) {
            gsap.set(rightPanelRef.current, { y: p * 60 });
          }
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="ecosystem"
      ref={(el) => {
        (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
        (ref as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
      className="relative z-10 w-full bg-[#070709] border-t border-[#252529]"
      style={{ minHeight: '150vh' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(7,7,9,0.7) 0%, rgba(7,7,9,0.95) 30%, rgba(7,7,9,0.98) 100%)',
        }}
      />

      <div className="sticky top-0 z-20">
        <div className="flex items-center justify-between px-[2vw] py-4 border-b border-[#252529] bg-[#070709]/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2563EB]">[02]</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#F3F4F6]/45">DUAL ENGINE ECOSYSTEM</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#F3F4F6]/25 hidden sm:block">
            CREATOR ↔ LEARNER PLATFORM
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-2 border-b border-[#252529]">
        <div
          ref={leftPanelRef}
          className="border-b lg:border-b-0 lg:border-r border-[#252529] will-change-transform"
        >
          <div className="px-[2vw] md:px-[3vw] pt-16 pb-10 border-b border-[#252529]">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2563EB] mb-5">
              SIDE A — FOR CREATORS
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
              className="font-display font-black uppercase leading-[0.86] tracking-tight text-[#F3F4F6]"
              style={{ fontSize: 'clamp(44px, 6vw, 96px)' }}
            >
              UPLOAD &<br />MONETIZE
            </motion.h2>
            <p className="mt-5 font-body text-[#F3F4F6]/55 text-base leading-relaxed max-w-sm">
              The infrastructure for independent knowledge entrepreneurs. Build your revenue engine in under 20 minutes.
            </p>
          </div>

          <div className="divide-y divide-[#252529]">
            {CREATOR_TOOLS.map((tool, i) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, x: -28 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                className="group flex items-start gap-6 px-[2vw] md:px-[3vw] py-6 hover:bg-[#252529]/20 transition-colors cursor-pointer"
              >
                <span className="shrink-0 font-display font-black text-xl text-[#2563EB] mt-0.5">
                  {tool.icon}
                </span>
                <div>
                  <h3 className="font-display font-bold text-lg uppercase tracking-wide text-[#F3F4F6] group-hover:text-[#2563EB] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-1.5 font-body text-sm text-[#F3F4F6]/50 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="px-[2vw] md:px-[3vw] py-8 border-t border-[#252529]">
            <Magnetic strength={0.35}>
              <a
                href="/instructor"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#2563EB] text-white font-display font-black text-sm uppercase tracking-widest hover:bg-[#F3F4F6] hover:text-[#070709] transition-colors"
              >
                LAUNCH YOUR COURSE →
              </a>
            </Magnetic>
          </div>
        </div>

        <div ref={rightPanelRef} className="will-change-transform">
          <div className="px-[2vw] md:px-[3vw] pt-16 pb-10 border-b border-[#252529]">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#F3F4F6]/35 mb-5">
              SIDE B — FOR LEARNERS
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.76, 0, 0.24, 1] }}
              className="font-display font-black uppercase leading-[0.86] tracking-tight text-[#F3F4F6]"
              style={{ fontSize: 'clamp(44px, 6vw, 96px)' }}
            >
              RAW<br />INTELLECT
            </motion.h2>
            <p className="mt-5 font-body text-[#F3F4F6]/55 text-base leading-relaxed max-w-sm">
              Stream courses from world-class independent instructors. No filler content, no academia overhead.
            </p>
          </div>

          <div className="divide-y divide-[#252529]">
            {PREMIUM_COURSES.map((course, i) => (
              <motion.div
                key={course.title}
                initial={{ opacity: 0, x: 28 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.09 }}
                className="group flex items-center justify-between gap-4 px-[2vw] md:px-[3vw] py-5 hover:bg-[#252529]/20 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[#2563EB] mt-0.5 w-16">
                    {course.tag}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-lg uppercase tracking-tight text-[#F3F4F6] group-hover:text-[#2563EB] transition-colors truncate">
                      {course.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-[#F3F4F6]/35 uppercase tracking-wider">
                      <span>{course.creator}</span>
                      <span className="text-[#252529]">•</span>
                      <span>{course.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <span className={`font-display font-black text-xl ${course.price === 'FREE' ? 'text-[#2563EB]' : 'text-[#F3F4F6]'}`}>
                    {course.price}
                  </span>
                  <span className="text-[#F3F4F6]/25 group-hover:text-[#2563EB] transition-colors">→</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="px-[2vw] md:px-[3vw] py-8 border-t border-[#252529]">
            <Magnetic strength={0.35}>
              <a
                href="/courses"
                className="inline-flex items-center gap-3 px-8 py-4 border border-[#252529] text-[#F3F4F6] font-display font-black text-sm uppercase tracking-widest hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
              >
                VIEW ALL COURSES →
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
