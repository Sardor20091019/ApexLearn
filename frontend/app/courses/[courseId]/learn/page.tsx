'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface Lesson {
  id: string;
  title: string;
  duration?: string;
  videoUrl?: string;
  isFree?: boolean;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description?: string;
  instructorName?: string;
  instructorAvatar?: string;
  thumbnailUrl?: string;
  sections: Section[];
}

interface Note {
  id: string;
  lessonId: string;
  timestamp: string;
  text: string;
  createdAt: string;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'zip' | 'code' | 'link';
  size?: string;
  downloadUrl: string;
}

// Helper to determine if video is YouTube
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&enablejsapi=1`
    : null;
}

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  // Theme & Layout States
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'reviews' | 'resources' | 'fx'>('overview');

  // Video & FX States
  const [ambientGlow, setAmbientGlow] = useState<boolean>(true);
  const [fxIntensity, setFxIntensity] = useState<number>(60);
  const [fxBlur, setFxBlur] = useState<number>(40);
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true);

  // Course & Navigation States
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User Progress & Interaction States
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [isInstructor, setIsInstructor] = useState<boolean>(true);

  // Instructor Form States
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [newLessonTitle, setNewLessonTitle] = useState<string>('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  // Video Reference
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Mock Resources
  const resources: Resource[] = [
    { id: '1', title: 'Source Code & Project Boilerplate', type: 'zip', size: '24.5 MB', downloadUrl: '#' },
    { id: '2', title: 'Architecture Cheat Sheet & Diagram', type: 'pdf', size: '3.1 MB', downloadUrl: '#' },
    { id: '3', title: 'Interactive Code Playground', type: 'link', downloadUrl: '#' },
  ];

  // Sync initial mock or fetched data
  useEffect(() => {
    // Simulated Course Fetch
    setTimeout(() => {
      const mockCourse: Course = {
        id: courseId || 'course-1',
        title: 'Full-Stack Modern Architecture & Glassmorphism Systems',
        description: 'Master clean design patterns, Next.js, and high-performance UI systems with practical production-grade workflows.',
        instructorName: 'Sardor Sunatullayev',
        instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
        sections: [
          {
            id: 'sec-1',
            title: 'Section 1: Architecture Core Foundations',
            lessons: [
              { id: 'les-1', title: '01. System Overview & Clean Design Philosophy', duration: '12:45', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', isFree: true },
              { id: 'les-2', title: '02. Glassmorphism Aesthetics & Dark/Light Tokens', duration: '18:20', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-code-animation-on-a-tech-display-42878-large.mp4', isFree: false },
              { id: 'les-3', title: '03. Component State Management & Persistence', duration: '15:10', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-41381-large.mp4', isFree: false },
            ]
          },
          {
            id: 'sec-2',
            title: 'Section 2: Production Video Player & Advanced UI',
            lessons: [
              { id: 'les-4', title: '04. Ambient Canvas Lighting & FX Sync', duration: '22:15', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-typing-on-a-keyboard-41380-large.mp4', isFree: false },
              { id: 'les-5', title: '05. Custom Controls, Timestamps & Note Markers', duration: '19:40', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-keyboard-41378-large.mp4', isFree: false },
            ]
          }
        ]
      };

      setCourse(mockCourse);
      setActiveSectionId(mockCourse.sections[0]?.id || '');
      setActiveLessonId(mockCourse.sections[0]?.lessons[0]?.id || '');
      setSelectedSectionId(mockCourse.sections[0]?.id || '');
      setLoading(false);
    }, 400);

    // Restore saved progress & notes from local storage
    if (courseId) {
      const savedProgress = localStorage.getItem(`course_completed_${courseId}`);
      if (savedProgress) setCompletedLessons(JSON.parse(savedProgress));

      const savedNotes = localStorage.getItem(`course_notes_${courseId}`);
      if (savedNotes) setNotes(JSON.parse(savedNotes));
    }

    // Mock initial reviews
    setReviews([
      { id: 'r1', userName: 'Alex Mercer', rating: 5, comment: 'The ambient lighting feature and layout clarity are unmatched!', date: '2 days ago' },
      { id: 'r2', userName: 'Elena Rostova', rating: 5, comment: 'Subtle, hyper-fast, clean code setup. Extremely readable design.', date: '1 week ago' },
    ]);
  }, [courseId]);

  // Active Lesson Computation
  const activeLesson = useMemo(() => {
    if (!course) return null;
    for (const sec of course.sections) {
      const found = sec.lessons.find((l) => l.id === activeLessonId);
      if (found) return found;
    }
    return null;
  }, [course, activeLessonId]);

  // Progress Computations
  const totalLessons = useMemo(() => {
    if (!course) return 0;
    return course.sections.reduce((acc, sec) => acc + sec.lessons.length, 0);
  }, [course]);

  const completedCount = useMemo(() => {
    return Object.values(completedLessons).filter(Boolean).length;
  }, [completedLessons]);

  const progressPercentage = useMemo(() => {
    if (totalLessons === 0) return 0;
    return Math.round((completedCount / totalLessons) * 100);
  }, [completedCount, totalLessons]);

  // Navigation Handlers
  const allLessonsFlat = useMemo(() => {
    if (!course) return [];
    return course.sections.flatMap((sec) => sec.lessons);
  }, [course]);

  const handleNextLesson = () => {
    const currentIndex = allLessonsFlat.findIndex((l) => l.id === activeLessonId);
    if (currentIndex !== -1 && currentIndex < allLessonsFlat.length - 1) {
      setActiveLessonId(allLessonsFlat[currentIndex + 1].id);
    }
  };

  const handlePrevLesson = () => {
    const currentIndex = allLessonsFlat.findIndex((l) => l.id === activeLessonId);
    if (currentIndex > 0) {
      setActiveLessonId(allLessonsFlat[currentIndex - 1].id);
    }
  };

  // Toggle Completion
  const toggleLessonCompletion = (lessonId: string) => {
    const updated = { ...completedLessons, [lessonId]: !completedLessons[lessonId] };
    setCompletedLessons(updated);
    if (courseId) {
      localStorage.setItem(`course_completed_${courseId}`, JSON.stringify(updated));
    }
  };

  // Notes Handler
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const currentTime = videoRef.current
      ? `${Math.floor(videoRef.current.currentTime / 60)}:${Math.floor(videoRef.current.currentTime % 60).toString().padStart(2, '0')}`
      : '00:00';

    const newNote: Note = {
      id: Date.now().toString(),
      lessonId: activeLessonId,
      timestamp: currentTime,
      text: newNoteText.trim(),
      createdAt: 'Just now',
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    setNewNoteText('');
    if (courseId) {
      localStorage.setItem(`course_notes_${courseId}`, JSON.stringify(updated));
    }
  };

  // Review Handler
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;
    const newRev: Review = {
      id: Date.now().toString(),
      userName: 'You',
      rating: newRating,
      comment: newReviewComment.trim(),
      date: 'Just now',
    };
    setReviews([newRev, ...reviews]);
    setNewReviewComment('');
  };

  // Instructor Lesson Creation
  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim() || !selectedSectionId || !course) return;
    setCreating(true);

    setTimeout(() => {
      const createdLesson: Lesson = {
        id: `les-${Date.now()}`,
        title: newLessonTitle,
        duration: '10:00',
        videoUrl: newLessonVideoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-code-animation-on-a-tech-display-42878-large.mp4',
        isFree: false,
      };

      const updatedSections = course.sections.map((sec) => {
        if (sec.id === selectedSectionId) {
          return { ...sec, lessons: [...sec.lessons, createdLesson] };
        }
        return sec;
      });

      setCourse({ ...course, sections: updatedSections });
      setNewLessonTitle('');
      setNewLessonVideoUrl('');
      setCreating(false);
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  const youtubeEmbed = activeLesson?.videoUrl ? getYouTubeEmbedUrl(activeLesson.videoUrl) : null;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans antialiased ${
        theme === 'dark' ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* BACKGROUND AMBIENT CANVAS GLOW */}
      {ambientGlow && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full transition-all duration-500 opacity-30 dark:opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(59,130,246,0.15) 50%, transparent 80%)',
              filter: `blur(${fxBlur}px)`,
              opacity: fxIntensity / 100,
            }}
          />
        </div>
      )}

      {/* TOP GLASS NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-[#090d16]/80 border-b border-slate-200/60 dark:border-white/10 px-4 lg:px-8 py-3 transition-colors">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Back & Course Info + Course Thumbnail */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-300 shrink-0"
              title="Go Back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            {/* Course Small Glass Thumbnail Pill */}
            {course?.thumbnailUrl && (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/15 shrink-0 shadow-sm hidden sm:block">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase block leading-none">
                {course?.instructorName}
              </span>
              <h1 className="text-sm lg:text-base font-bold truncate text-slate-900 dark:text-white mt-1">
                {course?.title}
              </h1>
            </div>
          </div>

          {/* Right: Progress & Controls */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Progress Bar Header Pill */}
            <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-white/[0.03]">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">Course Completion</p>
                <p className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">{progressPercentage}%</p>
              </div>
              <div className="w-20 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl border transition-all ${
                isSidebarOpen
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
              title="Toggle Curriculum Sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>

            {/* Cinema Mode Toggle */}
            <button
              onClick={() => setIsCinemaMode(!isCinemaMode)}
              className={`p-2 rounded-xl border transition-all ${
                isCinemaMode
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
              title="Toggle Theater Mode"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            {/* Dark / Light Theme Switcher */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER LAYOUT */}
      <main className="relative z-10 max-w-[1800px] mx-auto p-4 lg:p-6">
        <div className={`grid gap-6 transition-all duration-300 ${isCinemaMode || !isSidebarOpen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
          
          {/* LEFT CONTENT COLUMN: VIDEO + TABBED WORKSPACE */}
          <div className={`${isCinemaMode || !isSidebarOpen ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-8'} space-y-6`}>
            
            {/* GLASS CONTAINER: VIDEO PLAYER */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-black shadow-2xl backdrop-blur-xl group">
              
              {/* Dynamic FX Glow Background */}
              {ambientGlow && (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-20 z-0"
                  style={{
                    boxShadow: `inset 0 0 ${fxBlur * 2}px rgba(6,182,212,0.3)`
                  }}
                />
              )}

              {/* Video Embed Frame, Video Player, or Course Thumbnail Preview */}
              <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden z-10">
                {activeLesson?.videoUrl ? (
                  youtubeEmbed ? (
                    <iframe
                      src={youtubeEmbed}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={activeLesson.title}
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      src={activeLesson.videoUrl}
                      poster={course?.thumbnailUrl}
                      controls
                      autoPlay
                      onEnded={() => {
                        if (activeLessonId) toggleLessonCompletion(activeLessonId);
                        if (autoPlayNext) handleNextLesson();
                      }}
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  /* Fallback Course Thumbnail Background when no video is playing */
                  <div className="relative w-full h-full flex items-center justify-center">
                    {course?.thumbnailUrl && (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-105"
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-3 text-center p-6 backdrop-blur-md bg-black/40 rounded-2xl border border-white/10">
                      <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-bold text-white">Ready to start learning?</p>
                        <p className="text-xs text-slate-400 mt-1">Select a lesson from the outline to begin streaming</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* VIDEO BAR / QUICK ACTION CONTROLS */}
              <div className="p-3 bg-slate-900/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs relative z-10">
                
                {/* Left: Previous / Next & Autoplay */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevLesson}
                    className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 font-medium transition-all flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>

                  <button
                    onClick={handleNextLesson}
                    className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 font-medium transition-all flex items-center gap-1.5"
                  >
                    Next
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <label className="flex items-center gap-2 ml-2 cursor-pointer select-none text-slate-400 hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={autoPlayNext}
                      onChange={(e) => setAutoPlayNext(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-0"
                    />
                    Autoplay Next
                  </label>
                </div>

                {/* Right: Mark Complete Toggle Button */}
                <button
                  onClick={() => activeLessonId && toggleLessonCompletion(activeLessonId)}
                  className={`px-4 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                    completedLessons[activeLessonId]
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {completedLessons[activeLessonId] ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>

            {/* TABBED INTERFACE CONTAINER */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl p-5 shadow-xl">
              
              {/* Tab Selector Row */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-4 overflow-x-auto">
                {(['overview', 'notes', 'resources', 'reviews', 'fx'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 capitalize ${
                      activeTab === tab
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT PANELS */}
              <div className="mt-5 text-sm">
                
                {/* 1. OVERVIEW TAB WITH HERO THUMBNAIL CARD */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    
                    {/* Course Banner / Glass Thumbnail Hero */}
                    {course?.thumbnailUrl && (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 h-44 sm:h-56 group">
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-1 rounded-md w-max">
                            Enrolled Course
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white mt-2">
                            {course.title}
                          </h3>
                        </div>
                      </div>
                    )}

                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {activeLesson ? activeLesson.title : course?.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        {course?.description}
                      </p>
                    </div>

                    {/* Instructor Info Card */}
                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={course?.instructorAvatar}
                          alt={course?.instructorName}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-cyan-500/30"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{course?.instructorName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Senior Lead Architect & Course Creator</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsInstructor(!isInstructor)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                      >
                        {isInstructor ? 'Mode: Instructor' : 'Mode: Student'}
                      </button>
                    </div>

                    {/* INSTRUCTOR QUICK STUDIO PANEL */}
                    {isInstructor && (
                      <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.03] space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                            Instructor Studio Console
                          </span>
                          <span className="text-[10px] text-slate-500">Add new modules directly</span>
                        </div>

                        <form onSubmit={handleCreateLesson} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <select
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                          >
                            {course?.sections.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            placeholder="Episode Title"
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                          />

                          <input
                            type="text"
                            placeholder="Stream Video URL"
                            value={newLessonVideoUrl}
                            onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                          />

                          <button
                            type="submit"
                            disabled={creating}
                            className="sm:col-span-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            {creating ? 'Publishing Episode...' : 'Publish Episode'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. NOTES TAB */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddNote} className="space-y-3">
                      <textarea
                        rows={3}
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Take a timestamped note for this lesson..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-all"
                        >
                          Save Note
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2 mt-4">
                      {notes.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No notes saved for this course yet.</p>
                      ) : (
                        notes.map((n) => (
                          <div
                            key={n.id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                                Timestamp @ {n.timestamp}
                              </span>
                              <span className="text-slate-400">{n.createdAt}</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300">{n.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. RESOURCES TAB */}
                {activeTab === 'resources' && (
                  <div className="space-y-3">
                    <p className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-3">
                      Lesson Materials & Exercise Files
                    </p>
                    <div className="grid gap-2">
                      {resources.map((res) => (
                        <div
                          key={res.id}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between hover:border-cyan-500/30 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-xs uppercase font-bold">
                              {res.type}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{res.title}</p>
                              {res.size && <p className="text-[10px] text-slate-500">{res.size}</p>}
                            </div>
                          </div>
                          <a
                            href={res.downloadUrl}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-cyan-500 hover:text-slate-950 text-xs font-medium transition-all"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. REVIEWS TAB */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddReview} className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Leave Feedback</p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className={`text-lg transition-transform hover:scale-110 ${
                              star <= newRating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="Write your review here..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-all"
                      >
                        Submit Review
                      </button>
                    </form>

                    <div className="space-y-3">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.userName}</span>
                            <span className="text-amber-400 text-xs">{'★'.repeat(rev.rating)}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">{rev.comment}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{rev.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. FX & VIDEO CONTROLS TAB */}
                {activeTab === 'fx' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Ambient Light Sync</p>
                        <p className="text-[11px] text-slate-500">Project soft glow colors behind the video container</p>
                      </div>
                      <button
                        onClick={() => setAmbientGlow(!ambientGlow)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                          ambientGlow ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            ambientGlow ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {ambientGlow && (
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-500">Glow Intensity</span>
                            <span className="text-cyan-500 font-bold">{fxIntensity}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={fxIntensity}
                            onChange={(e) => setFxIntensity(Number(e.target.value))}
                            className="w-full accent-cyan-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-500">Blur Radius</span>
                            <span className="text-cyan-500 font-bold">{fxBlur}px</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="80"
                            value={fxBlur}
                            onChange={(e) => setFxBlur(Number(e.target.value))}
                            className="w-full accent-cyan-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: CURRICULUM SYLLABUS WITH MINI THUMBNAIL */}
          {isSidebarOpen && !isCinemaMode && (
            <div className="lg:col-span-4 xl:col-span-4 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl p-4 shadow-xl space-y-4 sticky top-20">
                
                {/* Course Sidebar Card with Thumbnail */}
                {course?.thumbnailUrl && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{course.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{totalLessons} total lessons</p>
                    </div>
                  </div>
                )}

                {/* Search & Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Course Outline</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                      {completedCount}/{totalLessons} Done
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                {/* Section & Lesson Accordion List */}
                <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
                  {course?.sections.map((section) => {
                    const filteredLessons = section.lessons.filter((l) =>
                      l.title.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    if (searchQuery && filteredLessons.length === 0) return null;

                    return (
                      <div
                        key={section.id}
                        className="rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] overflow-hidden"
                      >
                        <div className="p-3 bg-slate-100/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-white/5">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{section.title}</p>
                        </div>

                        <div className="divide-y divide-slate-200/40 dark:divide-white/5">
                          {filteredLessons.map((lesson) => {
                            const isActive = lesson.id === activeLessonId;
                            const isCompleted = !!completedLessons[lesson.id];

                            return (
                              <button
                                key={lesson.id}
                                onClick={() => setActiveLessonId(lesson.id)}
                                className={`w-full p-3 text-left transition-all flex items-start gap-3 group ${
                                  isActive
                                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium'
                                    : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {/* Checkbox Indicator */}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLessonCompletion(lesson.id);
                                  }}
                                  className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                                    isCompleted
                                      ? 'bg-emerald-500 text-slate-950'
                                      : 'border border-slate-300 dark:border-slate-700 group-hover:border-cyan-500'
                                  }`}
                                >
                                  {isCompleted && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </span>

                                {/* Title & Duration */}
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs leading-snug truncate ${isActive ? 'font-bold' : ''}`}>
                                    {lesson.title}
                                  </p>
                                  {lesson.duration && (
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{lesson.duration}</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}