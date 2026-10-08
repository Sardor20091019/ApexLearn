'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export interface CourseDossier {
  id: string;
  title: string;
  tagline: string;
  description: string;
  price: number;
  level: string;
  category: string;
  duration: string;
  rating: number;
  enrolled: number;
  instructor: {
    name: string;
    role: string;
    avatar: string;
  };
  modules: {
    number: string;
    title: string;
    duration: string;
    summary: string;
  }[];
  capstone: string;
}

interface SyllabusModalProps {
  course: CourseDossier | null;
  onClose: () => void;
  isLight?: boolean;
}

export function SyllabusModal({ course, onClose, isLight = false }: SyllabusModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!course) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl animate-[fade-in_0.2s_ease-out] ${
      isLight ? 'bg-black/40' : 'bg-black/80'
    }`}>
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border overflow-hidden shadow-2xl ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-900 shadow-[0_32px_80px_rgba(0,0,0,0.18)]'
            : 'bg-[#0c0d12] border-white/20 text-zinc-100 shadow-[0_32px_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className={`p-6 sm:p-8 border-b flex items-start justify-between gap-4 ${
          isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/60 border-white/10'
        }`}>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className={`px-2.5 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-rose-100 text-rose-700 border-rose-200 font-semibold'
                  : 'bg-violet-500/20 text-violet-300 border-violet-500/30'
              }`}>
                {course.category}
              </span>
              <span className={isLight ? 'text-zinc-400' : 'text-zinc-500'}>•</span>
              <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>{course.level}</span>
              <span className={isLight ? 'text-zinc-400' : 'text-zinc-500'}>•</span>
              <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>{course.duration} TOTAL RUNTIME</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-zinc-950' : 'text-white'}`}>
              {course.title}
            </h2>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
              {course.tagline}
            </p>
          </div>

          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all shrink-0 ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                : 'bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white border-white/10'
            }`}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8 flex-1">
          {/* Overview */}
          <div className="space-y-2">
            <h4 className={`text-[11px] font-mono uppercase tracking-widest ${isLight ? 'text-zinc-500 font-bold' : 'text-zinc-500'}`}>
              [ 01 // SYNOPSIS & RATIONALE ]
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
              {course.description}
            </p>
          </div>

          {/* Module Timeline */}
          <div className="space-y-4">
            <h4 className={`text-[11px] font-mono uppercase tracking-widest ${isLight ? 'text-zinc-500 font-bold' : 'text-zinc-500'}`}>
              [ 02 // CURRICULUM ARCHITECTURE ]
            </h4>
            <div className="space-y-3">
              {course.modules.map((m) => (
                <div
                  key={m.number}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isLight
                      ? 'bg-zinc-50/80 border-zinc-200/80 hover:border-zinc-300'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`font-mono text-xs font-bold pt-0.5 ${isLight ? 'text-rose-600' : 'text-violet-400'}`}>
                      {m.number}
                    </span>
                    <div>
                      <h5 className={`text-sm font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>{m.title}</h5>
                      <p className={`text-xs mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{m.summary}</p>
                    </div>
                  </div>
                  <div className={`font-mono text-xs whitespace-nowrap self-end sm:self-center ${isLight ? 'text-zinc-500 font-medium' : 'text-zinc-500'}`}>
                    {m.duration}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capstone Project */}
          <div className={`p-5 rounded-2xl border space-y-2 ${
            isLight
              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
              : 'bg-gradient-to-br from-violet-950/40 via-purple-900/20 to-zinc-950/80 border-violet-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-rose-700' : 'text-violet-300'}`}>
                Capstone Proof-of-Work
              </h4>
            </div>
            <p className={`text-xs leading-relaxed font-mono ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
              {course.capstone}
            </p>
          </div>

          {/* Faculty Dossier */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/10'
          }`}>
            <img
              src={course.instructor.avatar}
              alt={course.instructor.name}
              className="w-12 h-12 rounded-full object-cover border border-zinc-300"
            />
            <div>
              <div className={`text-sm font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>{course.instructor.name}</div>
              <div className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{course.instructor.role}</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/80 border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-black ${isLight ? 'text-zinc-950' : 'text-white'}`}>
              {course.price === 0 ? 'FREE' : `$${course.price.toFixed(2)}`}
            </div>
            <span className={`text-xs font-mono ${isLight ? 'text-zinc-500 font-medium' : 'text-zinc-500'}`}>
              {course.price === 0 ? 'OPEN ACCESS' : 'LIFETIME ACCESS & CERTIFICATE'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={`px-5 py-3 rounded-2xl text-xs font-mono uppercase tracking-wider border transition-all flex-1 sm:flex-none text-center ${
                isLight
                  ? 'text-zinc-700 hover:text-black border-zinc-300 hover:bg-zinc-100'
                  : 'text-zinc-400 hover:text-white border-white/10 hover:bg-white/5'
              }`}
            >
              Close
            </button>
            <Link
              href={`/courses/${course.id}`}
              className={`px-6 py-3 rounded-2xl text-xs font-mono uppercase font-bold tracking-wider transition-all flex-1 sm:flex-none text-center shadow-lg ${
                isLight
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              Enter Masterclass →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
