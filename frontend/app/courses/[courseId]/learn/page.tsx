'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, isTokenExpired, redirectToLogin } from '../../../../lib/auth';

type ThemeStyle = 'white-glass' | 'dark-glass';

interface Lesson {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  videourl?: string;
  video_url?: string;
  duration?: string;
  isFree?: boolean;
}

function resolveLessonVideoUrl(lesson: Lesson | null | undefined): string | undefined {
  if (!lesson || !lesson.id) return undefined;
  const raw = lesson.videoUrl || lesson.videourl || lesson.video_url;
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // Direct CDN / external media URLs stream directly with native browser byte-range support:
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const token = getAuthToken() || '';
  return `${API}/courses/lessons/${lesson.id}/stream?token=${encodeURIComponent(token)}`;
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
  sections: Section[];
}

interface Note {
  id: string;
  lessonId: string;
  text: string;
  createdAt: string;
}

interface Review {
  id: string;
  userName: string;
  userAvatarUrl?: string;
  rating: number;
  comment: string;
  date: string;
}

const API = process.env.NEXT_PUBLIC_API_URL  ;

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = (params?.courseId as string) || '';

  // Glassmorphic Theme System synchronized with Dashboard and Instructor
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(() => {
    if (typeof window === 'undefined') return 'dark-glass';
    const saved = localStorage.getItem('apex_theme_style');
    return (saved === 'white-glass' || saved === 'dark-glass') ? saved : 'dark-glass';
  });

  const toggleTheme = () => {
    const nextTheme: ThemeStyle = themeStyle === 'dark-glass' ? 'white-glass' : 'dark-glass';
    setThemeStyle(nextTheme);
    localStorage.setItem('apex_theme_style', nextTheme);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'lesson' | 'outline' | 'workspace'>('lesson');
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'resources' | 'reviews'>('overview');

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showFiltersMenu, setShowFiltersMenu] = useState<boolean>(false);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [videoReady, setVideoReady] = useState<boolean>(false);

  // Optical filters
  const [brightness, setBrightness] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);

  // Progress, notes, reviews
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Autoplay next lecture countdown
  const [autoPlayCountdown, setAutoPlayCountdown] = useState<{ nextId: string; nextTitle: string; count: number } | null>(null);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      redirectToLogin('Please log in to continue learning.');
      return;
    }

    const fetchCourseAndData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (res.status === 401) {
          redirectToLogin('Your session has expired. Please log in again.');
          return;
        }

        if (!res.ok) {
          throw new Error('Unable to fetch course content from server.');
        }

        const data = await res.json();
        setCourse(data);

        const firstLessonId = data.sections?.[0]?.lessons?.[0]?.id || '';
        setActiveLessonId(firstLessonId);

        try {
          const progRes = await fetch(`${API}/courses/${courseId}/progress`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          if (progRes.ok) {
            const progData = await progRes.json();
            if (Array.isArray(progData)) {
              const map: Record<string, boolean> = {};
              progData.forEach((id: string) => { map[id] = true; });
              setCompletedLessons(map);
            } else if (progData.completedLessons) {
              setCompletedLessons(progData.completedLessons);
            }
          }
        } catch {
          const savedProgress = localStorage.getItem(`course_completed_${courseId}`);
          if (savedProgress) setCompletedLessons(JSON.parse(savedProgress));
        }

        try {
          const revRes = await fetch(`${API}/courses/${courseId}/reviews`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          if (revRes.ok) {
            const revData = await revRes.json();
            setReviews(revData);
          }
        } catch {}
      } catch (err: any) {
        setErrorMsg(err.message || 'Server connection failed.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseAndData();
    }

    const savedNotes = localStorage.getItem(`course_notes_${courseId}`);
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, [courseId, router]);

  useEffect(() => {
    setVideoError(false);
    setVideoReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAutoPlayCountdown(null);
  }, [activeLessonId]);

  // Autoplay countdown timer
  useEffect(() => {
    if (!autoPlayCountdown) return;
    if (autoPlayCountdown.count <= 0) {
      setActiveLessonId(autoPlayCountdown.nextId);
      setAutoPlayCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setAutoPlayCountdown((prev) => prev ? { ...prev, count: prev.count - 1 } : null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoPlayCountdown]);

  const allLessonsFlat = useMemo(() => {
    if (!course || !course.sections) return [];
    return course.sections.flatMap((sec) => sec.lessons || []);
  }, [course]);

  const activeLesson = useMemo(() => {
    return allLessonsFlat.find((l) => l.id === activeLessonId) || null;
  }, [allLessonsFlat, activeLessonId]);

  const activeVideoUrl = useMemo(
    () => resolveLessonVideoUrl(activeLesson),
    [activeLesson],
  );

  const totalLessons = allLessonsFlat.length;
  const completedCount = useMemo(() => Object.values(completedLessons).filter(Boolean).length, [completedLessons]);
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const markLessonCompleted = async (lessonId: string) => {
    if (completedLessons[lessonId]) return;
    const updated = { ...completedLessons, [lessonId]: true };
    setCompletedLessons(updated);
    localStorage.setItem(`course_completed_${courseId}`, JSON.stringify(updated));

    const token = getAuthToken();
    if (token && !isTokenExpired(token)) {
      try {
        await fetch(`${API}/courses/${courseId}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ lessonId, completed: true }),
        });
      } catch (e) {
        console.error('Failed to sync lesson completion:', e);
      }
    }
  };

  const toggleLessonCompletion = async (lessonId: string) => {
    const nextStatus = !completedLessons[lessonId];
    const updated = { ...completedLessons, [lessonId]: nextStatus };
    setCompletedLessons(updated);
    localStorage.setItem(`course_completed_${courseId}`, JSON.stringify(updated));

    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      redirectToLogin('Your session has expired. Please log in again.');
      return;
    }

    try {
      await fetch(`${API}/courses/${courseId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessonId, completed: nextStatus }),
      });
    } catch (err) {
      console.error('Failed to sync progress with server:', err);
    }
  };

  const handleNextLesson = () => {
    const currentIndex = allLessonsFlat.findIndex((l) => l.id === activeLessonId);
    if (currentIndex !== -1 && currentIndex < allLessonsFlat.length - 1) {
      setActiveLessonId(allLessonsFlat[currentIndex + 1].id);
      setMobileTab('lesson');
    }
  };

  const handlePrevLesson = () => {
    const currentIndex = allLessonsFlat.findIndex((l) => l.id === activeLessonId);
    if (currentIndex > 0) {
      setActiveLessonId(allLessonsFlat[currentIndex - 1].id);
      setMobileTab('lesson');
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      lessonId: activeLessonId,
      text: newNoteText.trim(),
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    setNewNoteText('');
    localStorage.setItem(`course_notes_${courseId}`, JSON.stringify(updated));
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    setSubmittingReview(true);
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      redirectToLogin('Your session has expired. Please log in again.');
      setSubmittingReview(false);
      return;
    }

    const newRev: Review = {
      id: Date.now().toString(),
      userName: 'You',
      rating: newRating,
      comment: newReviewComment.trim(),
      date: 'Just now',
    };

    try {
      const res = await fetch(`${API}/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: newRating, comment: newReviewComment.trim() }),
      });
      if (res.ok) {
        const savedRev = await res.json();
        setReviews([savedRev, ...reviews]);
      } else {
        setReviews([newRev, ...reviews]);
      }
      setNewReviewComment('');
      setNewRating(5);
    } catch {
      setReviews([newRev, ...reviews]);
      setNewReviewComment('');
    } finally {
      setSubmittingReview(false);
    }
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const code = e.currentTarget.error?.code;
    if (code === 1) return;
    setVideoError(true);
  };

  const retryVideo = () => {
    setVideoError(false);
    setVideoReady(false);
    const el = videoRef.current;
    if (el) el.load();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(cur);

      // Auto progress: mark complete once student watches >= 85% of lecture
      if (dur > 0 && cur / dur >= 0.85 && activeLessonId) {
        markLessonCompleted(activeLessonId);
      }
    }
  };

  const handleVideoEnded = () => {
    if (activeLessonId) {
      markLessonCompleted(activeLessonId);
    }

    // Trigger autoplay next lecture countdown
    const currentIndex = allLessonsFlat.findIndex((l) => l.id === activeLessonId);
    if (currentIndex !== -1 && currentIndex < allLessonsFlat.length - 1) {
      const nextLes = allLessonsFlat[currentIndex + 1];
      setAutoPlayCountdown({
        nextId: nextLes.id,
        nextTitle: nextLes.title,
        count: 5,
      });
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoReady(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) videoRef.current.volume = val;
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const theme = {
    'white-glass': {
      bg: 'bg-[#f4f6fa] text-slate-900',
      header: 'bg-white/75 border-b border-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
      card: 'bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.95)]',
      subCard: 'bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm',
      pill: 'bg-white/80 rounded-full backdrop-blur-xl border border-white/90 shadow-sm text-slate-900',
      buttonPrimary: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white font-bold rounded-2xl shadow-lg hover:brightness-105 active:scale-95 transition-all',
      input: 'bg-white/80 rounded-2xl border border-white/90 shadow-inner focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900',
      textMuted: 'text-slate-600',
    },
    'dark-glass': {
      bg: 'bg-[#090b10] text-slate-100',
      header: 'bg-black/40 border-b border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      card: 'bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)]',
      subCard: 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-sm',
      pill: 'bg-white/10 rounded-full backdrop-blur-xl border border-white/15 shadow-sm text-slate-200',
      buttonPrimary: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-[0_8px_25px_rgba(147,51,234,0.35)] hover:brightness-110 active:scale-95 transition-all',
      input: 'bg-white/[0.05] rounded-2xl border border-white/10 shadow-inner focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 text-slate-100',
      textMuted: 'text-slate-400',
    },
  }[themeStyle];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold opacity-70">Entering spatial classroom...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${theme.bg}`}>
        <div className={`p-8 max-w-md text-center space-y-4 ${theme.card}`}>
          <div className="text-3xl">⚠️</div>
          <h2 className="text-base font-bold">Classroom Unavailable</h2>
          <p className={`text-xs ${theme.textMuted}`}>{errorMsg || 'Course content could not be retrieved.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className={`px-6 py-2.5 text-xs font-bold ${theme.buttonPrimary}`}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-x-clip ${theme.bg}`}>
      {/* Background Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-10 -right-40 w-96 h-96 rounded-full bg-cyan-600/10 blur-[130px]" />
      </div>

      {/* Sticky Top Frosted Glass Classroom Navbar */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${theme.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs font-bold shrink-0">
              ← Catalog
            </Link>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold truncate max-w-xs sm:max-w-md lg:max-w-lg">
                {course.title}
              </h1>
              <span className={`text-[10px] block truncate ${theme.textMuted}`}>
                {activeLesson?.title || 'Select Lecture'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Progress Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono font-bold">
              <span className="text-violet-400">{progressPercentage}%</span>
              <span className="opacity-60 text-[10px]">({completedCount}/{totalLessons})</span>
            </div>

            {/* Certificate Button if 100% complete */}
            {progressPercentage === 100 && (
              <button
                onClick={() => setShowCertModal(true)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse flex items-center gap-1.5"
              >
                <span>🏆</span>
                <span className="hidden sm:inline">Certificate Ready</span>
              </button>
            )}

            {/* Sun/Moon Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all shadow-sm ${theme.pill} hover:scale-105 active:scale-95`}
              title="Toggle Theme"
            >
              {themeStyle === 'dark-glass' ? '☀️' : '🌙'}
            </button>

            {/* Outline Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs font-bold"
              title="Toggle Syllabus Outline"
            >
              📑
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className={`grid gap-6 ${isSidebarOpen ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
          {/* Main Stage: Player & Tabs */}
          <div className={`${isSidebarOpen ? 'lg:col-span-8' : 'col-span-1'} space-y-6`}>
            {/* Player Container */}
            <div
              ref={playerContainerRef}
              className="rounded-[28px] border border-white/15 bg-black overflow-hidden shadow-2xl aspect-video relative group select-none"
            >
              {activeVideoUrl ? (
                <>
                  <video
                    key={`${activeLesson?.id}:${activeVideoUrl}`}
                    ref={videoRef}
                    src={activeVideoUrl}
                    preload="metadata"
                    playsInline
                    crossOrigin="anonymous"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                    onLoadedMetadata={handleLoadedMetadata}
                    onLoadedData={() => setVideoReady(true)}
                    onCanPlay={() => setVideoReady(true)}
                    onPlay={() => { setIsPlaying(true); setVideoReady(true); }}
                    onPause={() => setIsPlaying(false)}
                    onError={handleVideoError}
                    onClick={togglePlay}
                    style={{
                      filter: `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`,
                    }}
                    className="absolute inset-0 w-full h-full object-contain bg-black cursor-pointer"
                  >
                    {showSubtitles && activeLesson?.id && (
                      <track
                        key={`sub_${activeLesson.id}`}
                        kind="subtitles"
                        src={`${API}/courses/lessons/${activeLesson.id}/subtitles`}
                        srcLang="en"
                        label="English"
                        default
                      />
                    )}
                  </video>

                  {/* Autoplay Next Banner Overlay */}
                  {autoPlayCountdown && (
                    <div className="absolute top-4 right-4 z-40 p-4 rounded-2xl bg-black/85 backdrop-blur-md border border-violet-500/40 shadow-2xl flex items-center gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-violet-400 block">Up Next</span>
                        <span className="text-xs font-bold text-white truncate max-w-xs block">{autoPlayCountdown.nextTitle}</span>
                        <span className="text-[11px] opacity-70 text-slate-300">Autoplaying in {autoPlayCountdown.count}s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveLessonId(autoPlayCountdown.nextId);
                            setAutoPlayCountdown(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
                        >
                          Play Now
                        </button>
                        <button
                          onClick={() => setAutoPlayCountdown(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Center Play Button Overlay */}
                  {!isPlaying && !videoError && videoReady && (
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 hover:bg-black/10 transition-colors"
                      aria-label="Play video"
                    >
                      <span className="w-16 h-16 rounded-full bg-violet-600/90 border border-white/40 flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-transform">
                        <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </span>
                    </button>
                  )}

                  {/* Player Controls Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2 z-30">
                    {/* Scrubbing Bar */}
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />

                    <div className="flex items-center justify-between text-white text-xs pt-1">
                      <div className="flex items-center gap-3">
                        <button onClick={togglePlay} className="hover:text-violet-400 transition-colors">
                          {isPlaying ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <button onClick={toggleMute} className="hover:text-violet-400">
                            {isMuted || volume === 0 ? '🔇' : '🔊'}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-14 h-1 bg-white/20 rounded accent-violet-400"
                          />
                        </div>

                        <span className="font-mono text-[11px] opacity-80">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowSubtitles(!showSubtitles)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            showSubtitles ? 'bg-violet-600 text-white border-violet-500' : 'bg-white/10 border-white/20 text-white/70'
                          }`}
                        >
                          CC
                        </button>

                        {/* Speed Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-bold"
                          >
                            {playbackSpeed}x
                          </button>
                          {showSpeedMenu && (
                            <div className="absolute bottom-8 right-0 bg-black/90 border border-white/20 rounded-xl py-1 shadow-xl z-50">
                              {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => changeSpeed(s)}
                                  className={`w-full px-3 py-1 text-left text-xs hover:bg-white/10 ${playbackSpeed === s ? 'text-violet-400 font-bold' : ''}`}
                                >
                                  {s}x
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button onClick={toggleFullscreen} className="hover:text-violet-400">
                          ⛶
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <div className="space-y-3 max-w-sm">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl mx-auto">
                      📹
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Video Unavailable
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This lecture has no uploaded video file yet. The instructor has not attached a video stream to this lecture.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lecture Meta & Navigation Bar */}
            <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme.card}`}>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400">Current Lecture</span>
                <h2 className="text-base sm:text-lg font-bold">{activeLesson?.title || 'Select Lecture'}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevLesson}
                  className={`px-4 py-2 text-xs font-bold transition-all ${theme.pill} hover:bg-white/20`}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => activeLessonId && toggleLessonCompletion(activeLessonId)}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${
                    completedLessons[activeLessonId]
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
                      : theme.pill
                  }`}
                >
                  {completedLessons[activeLessonId] ? '✓ Completed' : 'Mark Complete'}
                </button>
                <button
                  onClick={handleNextLesson}
                  className={`px-4 py-2 text-xs font-bold transition-all ${theme.pill} hover:bg-white/20`}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Workspace Tabs (Overview, Notes, Reviews) */}
            <div className={`p-6 space-y-6 ${theme.card}`}>
              <div className="flex items-center gap-2 border-b border-current/10 pb-3">
                {(['overview', 'notes', 'reviews'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      activeTab === tab
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
                  <p>{activeLesson?.content || course.description || 'Welcome to this masterclass lecture.'}</p>
                  <div className={`p-4 rounded-2xl ${theme.subCard}`}>
                    <span className="font-bold block mb-1">💡 Instructor Tip:</span>
                    <span className="opacity-80">Take active notes in the Notes tab as you listen to reinforce your retention!</span>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Write your personal observation or code snippet for this lecture..."
                      className={`w-full p-4 text-xs focus:outline-none min-h-[90px] ${theme.input}`}
                    />
                    <div className="flex justify-end">
                      <button type="submit" className={`px-5 py-2 text-xs font-bold ${theme.buttonPrimary}`}>
                        Save Note
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2 pt-2">
                    {notes.map((note) => (
                      <div key={note.id} className={`p-3 rounded-xl flex items-start justify-between text-xs ${theme.subCard}`}>
                        <div className="space-y-1">
                          <span className="opacity-50 text-[10px] font-mono">{note.createdAt}</span>
                          <p>{note.text}</p>
                        </div>
                        <button
                          onClick={() => {
                            const updated = notes.filter((n) => n.id !== note.id);
                            setNotes(updated);
                            localStorage.setItem(`course_notes_${courseId}`, JSON.stringify(updated));
                          }}
                          className="opacity-40 hover:opacity-100 text-rose-400 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <form onSubmit={handleAddReview} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">Your Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className={`text-lg transition-transform hover:scale-125 ${newRating >= star ? 'text-amber-400' : 'opacity-30'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Share your feedback on this course curriculum..."
                      className={`w-full p-4 text-xs focus:outline-none min-h-[80px] ${theme.input}`}
                    />
                    <div className="flex justify-end">
                      <button type="submit" disabled={submittingReview} className={`px-5 py-2 text-xs font-bold ${theme.buttonPrimary}`}>
                        {submittingReview ? 'Submitting...' : 'Post Review'}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3 pt-2">
                    {reviews.map((rev) => (
                      <div key={rev.id} className={`p-4 rounded-xl space-y-1.5 text-xs ${theme.subCard}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{rev.userName}</span>
                          <span className="text-amber-400">{'★'.repeat(rev.rating)}</span>
                        </div>
                        <p className={theme.textMuted}>{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Syllabus Curriculum Outline */}
          {isSidebarOpen && (
            <div className="lg:col-span-4 space-y-4">
              <div className={`p-5 space-y-4 sticky top-24 ${theme.card}`}>
                <div className="flex items-center justify-between border-b border-current/10 pb-3">
                  <h3 className="text-sm font-black">Course Outline</h3>
                  <span className="text-xs font-mono font-bold opacity-60">
                    {completedCount}/{totalLessons} Done
                  </span>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                  {course.sections.map((sec, sIdx) => (
                    <div key={sec.id || sIdx} className={`p-3.5 space-y-2 rounded-2xl ${theme.subCard}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center">
                          {sIdx + 1}
                        </span>
                        <h4 className="text-xs font-bold truncate">{sec.title}</h4>
                      </div>

                      <div className="space-y-1 pl-2">
                        {sec.lessons?.map((les, lIdx) => {
                          const isActive = les.id === activeLessonId;
                          const isDone = completedLessons[les.id];

                          return (
                            <div
                              key={les.id || lIdx}
                              onClick={() => setActiveLessonId(les.id)}
                              className={`p-2.5 rounded-xl cursor-pointer text-xs flex items-center justify-between gap-2 transition-all ${
                                isActive
                                  ? 'bg-violet-600 text-white font-bold shadow-md'
                                  : 'hover:bg-white/10 opacity-80'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={isDone ? 'text-emerald-400' : 'opacity-40'}>
                                  {isDone ? '✓' : '○'}
                                </span>
                                <span className="truncate">{les.title}</span>
                              </div>
                              {les.duration && (
                                <span className="text-[10px] font-mono opacity-60 shrink-0">
                                  {les.duration}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Certificate Celebration Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`max-w-lg w-full p-8 text-center space-y-6 rounded-[32px] ${theme.card}`}>
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-3xl mx-auto">
              🏆
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Classroom Complete</span>
              <h3 className="text-2xl font-black">Congratulations!</h3>
              <p className={`text-xs ${theme.textMuted}`}>
                You have completed 100% of {course.title}. Your credential is cryptographically issued and ready.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowCertModal(false)}
                className={`px-5 py-2.5 text-xs font-bold ${theme.pill}`}
              >
                Close
              </button>
              <Link
                href="/dashboard"
                className={`px-6 py-2.5 text-xs font-bold ${theme.buttonPrimary}`}
              >
                View on Dashboard Certificate Vault →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}