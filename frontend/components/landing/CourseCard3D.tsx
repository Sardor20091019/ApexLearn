'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { CourseDossier } from './SyllabusModal';

interface CourseCard3DProps {
  course: CourseDossier;
  index: number;
  onInspect: (course: CourseDossier) => void;
  isLight?: boolean;
}

export function CourseCard3D({ course, index, onInspect, isLight = false }: CourseCard3DProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glintPos, setGlintPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -8;
    const rY = ((x - centerX) / centerX) * 8;

    setRotateX(rX);
    setRotateY(rY);
    setGlintPos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlintPos({ x: 50, y: 50 });
  };

  return (
    <div
      style={{ perspective: '1000px' }}
      className="relative select-none"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.015 : 1}, ${isHovered ? 1.015 : 1}, 1)`,
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out',
        }}
        className={`relative flex flex-col justify-between h-full rounded-2xl border p-5 overflow-hidden group transition-all duration-300 ${
          isLight
            ? 'bg-white border-zinc-200/90 shadow-[0_12px_35px_rgba(0,0,0,0.06)] hover:border-zinc-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.1)]'
            : 'bg-zinc-950/90 border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)] hover:border-white/25 hover:shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_25px_rgba(168,85,247,0.15)]'
        }`}
      >
        {/* Dynamic Specular Glint */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? (isLight ? 0.2 : 0.35) : 0,
            background: isLight
              ? `radial-gradient(circle at ${glintPos.x}% ${glintPos.y}%, rgba(0,0,0,0.1) 0%, rgba(244,63,94,0.1) 30%, transparent 70%)`
              : `radial-gradient(circle at ${glintPos.x}% ${glintPos.y}%, rgba(255,255,255,0.4) 0%, rgba(168,85,247,0.2) 30%, transparent 70%)`,
            mixBlendMode: isLight ? 'multiply' : 'screen',
          }}
        />

        {/* Card Header Metadata */}
        <div>
          <div className={`flex items-center justify-between font-mono text-[10px] pb-3 border-b ${
            isLight ? 'text-zinc-500 border-zinc-100' : 'text-zinc-500 border-white/5'
          }`}>
            <span className={`uppercase tracking-widest font-bold ${isLight ? 'text-rose-600' : 'text-violet-400'}`}>
              [{String(index + 1).padStart(2, '0')} // {course.category}]
            </span>
            <span className={`px-2 py-0.5 rounded border ${
              isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-700 font-medium' : 'bg-white/5 border-white/10 text-zinc-300'
            }`}>
              {course.level}
            </span>
          </div>

          {/* Media Preview Box */}
          <div className={`relative aspect-video rounded-xl overflow-hidden mt-3 border ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-black/80 border-white/10'
          }`}>
            <img
              src={`https://images.unsplash.com/photo-${
                index === 0 ? '1550751827-4bd374c3f58b' :
                index === 1 ? '1526374965328-7f61d4dc18c5' :
                index === 2 ? '1518770660439-4636190af475' :
                '1618005182384-a83a8bd57fbe'
              }?auto=format&fit=crop&w=800&q=80`}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
            />
            
            {/* Live Indicator Overlay */}
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[9px] font-mono text-zinc-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{course.duration}</span>
            </div>

            <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-white">
              {course.price === 0 ? 'FREE' : `$${course.price.toFixed(2)}`}
            </div>

            {/* Quick Inspect Lens Hover Overlay */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspect(course);
              }}
              type="button"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 text-white font-mono text-xs font-bold uppercase tracking-wider"
            >
              <span className="px-3 py-1.5 rounded-xl bg-white/20 border border-white/30 backdrop-blur-md hover:bg-white/30 transition-all flex items-center gap-1.5">
                <span>🔍 Inspect Syllabus</span>
              </span>
            </button>
          </div>

          {/* Titles & Description */}
          <div className="mt-4 space-y-1.5">
            <h3 className={`text-base sm:text-lg font-black tracking-tight transition-colors ${
              isLight
                ? 'text-zinc-900 group-hover:text-rose-600'
                : 'text-white group-hover:text-violet-300'
            }`}>
              {course.title}
            </h3>
            <p className={`text-xs line-clamp-2 leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {course.description}
            </p>
          </div>
        </div>

        {/* Footer Meta & Actions */}
        <div className={`pt-5 mt-4 border-t space-y-3 ${isLight ? 'border-zinc-100' : 'border-white/5'}`}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-5 h-5 rounded-full object-cover border border-zinc-300"
              />
              <span className={`text-[11px] font-medium ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>{course.instructor.name}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-amber-500 font-bold">
              <span>★</span>
              <span>{course.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onInspect(course)}
              className={`py-2.5 px-3 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-all text-center border ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200 font-semibold'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10'
              }`}
            >
              Curriculum
            </button>
            <Link
              href={`/courses/${course.id}`}
              className={`py-2.5 px-3 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-all text-center shadow-sm flex items-center justify-center gap-1 ${
                isLight
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              <span>Enroll</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
