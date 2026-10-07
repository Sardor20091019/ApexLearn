'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuthToken, isTokenExpired, redirectToLogin } from '../../../../lib/auth';

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

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'zip' | 'code' | 'link';
  size?: string;
  downloadUrl: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = (params?.courseId as string) || '';


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


  const [brightness, setBrightness] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);


  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);


  useEffect(() => {
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      redirectToLogin("Please log in to continue learning.");
      return;
    }

    const fetchCourseAndData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          redirectToLogin("Your session has expired. Please log in again.");
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
          });
          if (progRes.status === 401) {
            redirectToLogin("Your session has expired. Please log in again.");
            return;
          }
          if (progRes.ok) {
            const progData = await progRes.json();
            if (Array.isArray(progData)) {
              const map: Record<string, boolean> = {};
              progData.forEach((id: string) => { map[id] = true; });
              setCompletedLessons(map);
            } else if (progData.completedLessons) {
              setCompletedLessons(progData.completedLessons);
            }
          } else {
            const savedProgress = localStorage.getItem(`course_completed_${courseId}`);
            if (savedProgress) setCompletedLessons(JSON.parse(savedProgress));
          }
        } catch {
          const savedProgress = localStorage.getItem(`course_completed_${courseId}`);
          if (savedProgress) setCompletedLessons(JSON.parse(savedProgress));
        }

        try {
          const revRes = await fetch(`${API}/courses/${courseId}/reviews`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (revRes.status === 401) {
            redirectToLogin("Your session has expired. Please log in again.");
            return;
          }
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
  }, [activeLessonId]);

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

  const toggleLessonCompletion = async (lessonId: string) => {
    const nextStatus = !completedLessons[lessonId];
    const updated = { ...completedLessons, [lessonId]: nextStatus };
    setCompletedLessons(updated);
    localStorage.setItem(`course_completed_${courseId}`, JSON.stringify(updated));

    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      redirectToLogin("Your session has expired. Please log in again.");
      return;
    }

    try {
      const res = await fetch(`${API}/courses/${courseId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessonId, completed: nextStatus }),
      });
      if (res.status === 401) {
        redirectToLogin("Your session has expired. Please log in again.");
        return;
      }
    } catch (err) {
      console.error('Failed to sync progress with server:', err);
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
      redirectToLogin("Your session has expired. Please log in again.");
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
      if (res.status === 401) {
        redirectToLogin("Your session has expired. Please log in again.");
        return;
      }
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
    // MEDIA_ERR_ABORTED (1) fires when React remounts the <video> (Strict Mode / key change).
    if (code === 1) return;
    setVideoError(true);
  };

  const retryVideo = () => {
    setVideoError(false);
    setVideoReady(false);
    const el = videoRef.current;
    if (el) {
      el.load();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
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

  const sampleResources: Resource[] = [
    { id: '1', title: 'Course Supplementary Materials', type: 'zip', size: '14 MB', downloadUrl: '#' },
    { id: '2', title: 'Quick Reference Cheat Sheet', type: 'pdf', size: '2.4 MB', downloadUrl: '#' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-stone-800 flex items-center justify-center font-medium">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin" />
          <p className="text-sm">Loading course environment...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-stone-800 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="max-w-md rounded-xl border border-[#E3DACF] bg-[#F3EEE7] p-8 space-y-3 shadow-xs">
          <h2 className="text-base font-bold text-stone-900">Unable to Load Course</h2>
          <p className="text-xs text-stone-600 leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#3E3228] text-[#FAF7F2] rounded-lg text-xs font-bold hover:bg-[#2C231C] transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans antialiased pb-20 md:pb-6">

      <header className="sticky top-0 z-40 bg-[#F3EEE7] border-b border-[#E3DACF] px-4 lg:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-[#D8CEBF] bg-[#FAF7F2] hover:bg-[#EBE3D7] text-stone-700 transition-colors shrink-0"
              title="Go Back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="h-8 w-8 rounded-lg bg-stone-900 border border-[#D8CEBF] p-0.5 overflow-hidden shrink-0 hidden sm:flex items-center justify-center">
              <img
                src="/images/image.png"
                alt="ApexLearn Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-[#8C6D53] block truncate">
                {course?.instructorName || 'Expert Instructor'}
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                {course?.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">

            <div className="flex items-center gap-2.5 bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E3DACF]">
              <div className="text-right">
                <p className="text-[9px] text-stone-500 font-medium hidden sm:block">Progress</p>
                <p className="text-xs font-bold text-[#6B4F3A]">{progressPercentage}%</p>
              </div>
              <div className="w-12 sm:w-16 bg-[#E8E0D5] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#6B4F3A] h-full rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("access_token");
                router.replace("/auth");
              }}
              className="px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors shadow-xs active:scale-95"
              title="Log Out"
            >
              🚪 Log Out
            </button>


            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex p-2 rounded-lg border border-[#D8CEBF] bg-[#FAF7F2] hover:bg-[#EBE3D7] text-stone-700 transition-colors"
              title="Toggle Outline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
          </div>
        </div>
      </header>


      <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        

        <div className="flex md:hidden bg-[#E8DFD5] p-1 rounded-xl mb-4 border border-[#D8CEBF]">
          <button
            onClick={() => setMobileTab('lesson')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              mobileTab === 'lesson' ? 'bg-[#3E3228] text-[#FAF7F2] shadow-xs' : 'text-stone-700'
            }`}
          >
            📺 Lesson
          </button>
          <button
            onClick={() => setMobileTab('outline')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              mobileTab === 'outline' ? 'bg-[#3E3228] text-[#FAF7F2] shadow-xs' : 'text-stone-700'
            }`}
          >
            📑 Outline ({completedCount}/{totalLessons})
          </button>
          <button
            onClick={() => setMobileTab('workspace')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              mobileTab === 'workspace' ? 'bg-[#3E3228] text-[#FAF7F2] shadow-xs' : 'text-stone-700'
            }`}
          >
            💬 Workspace
          </button>
        </div>

        <div className={`grid gap-6 ${isSidebarOpen ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
          

          <div className={`${isSidebarOpen ? 'lg:col-span-8' : 'col-span-1'} space-y-4 sm:space-y-6 ${mobileTab !== 'lesson' ? 'hidden md:block' : 'block'}`}>
            

            <div 
              ref={playerContainerRef}
              className="rounded-xl border border-[#E3DACF] bg-stone-900 overflow-hidden shadow-sm aspect-video relative group"
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
                    onLoadedMetadata={handleLoadedMetadata}
                    onLoadedData={() => setVideoReady(true)}
                    onCanPlay={() => setVideoReady(true)}
                    onCanPlayThrough={() => setVideoReady(true)}
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

                  {!videoReady && !videoError && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-2 text-stone-200 text-xs">
                        <div className="w-4 h-4 border-2 border-stone-400 border-t-stone-100 rounded-full animate-spin" />
                        Loading video…
                      </div>
                    </div>
                  )}

                  {!isPlaying && !videoError && (
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors"
                      aria-label="Play video"
                    >
                      <span className="w-14 h-14 rounded-full bg-black/70 border border-stone-500 flex items-center justify-center text-[#FAF7F2]">
                        <svg className="w-7 h-7 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </span>
                    </button>
                  )}

                  {videoError && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-950/85">
                      <div className="space-y-3 max-w-sm p-6 text-center">
                        <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center mx-auto text-stone-400">
                          ⚠
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                          Video Unavailable
                        </h3>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          The player could not decode this stream. Retry, or try a standard H.264 MP4.
                        </p>
                        <button onClick={retryVideo} className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 border border-stone-700">
                          Retry Video Stream
                        </button>
                      </div>
                    </div>
                  )}


                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 opacity-100 transition-opacity duration-300 flex flex-col gap-2 z-20">
                    

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#C29B72]"
                      />
                    </div>


                    <div className="flex items-center justify-between text-stone-200 text-xs">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button onClick={togglePlay} className="hover:text-[#C29B72] transition-colors focus:outline-none p-1">
                          {isPlaying ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <button onClick={toggleMute} className="hover:text-[#C29B72] transition-colors focus:outline-none p-1">
                            {isMuted || volume === 0 ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                            )}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-12 sm:w-16 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#C29B72]"
                          />
                        </div>

                        <span className="text-[10px] sm:text-[11px] font-mono text-stone-300">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 relative">
                        <button
                          onClick={() => setShowSubtitles(!showSubtitles)}
                          className={`px-2 py-1 rounded text-[10px] sm:text-[11px] font-bold border transition-colors ${
                            showSubtitles
                              ? 'bg-[#C29B72] text-stone-900 border-[#C29B72]'
                              : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                          }`}
                          title="Toggle Subtitles / Closed Captions"
                        >
                          CC {showSubtitles ? 'ON' : 'OFF'}
                        </button>

                        <button
                          onClick={() => { setShowFiltersMenu(!showFiltersMenu); setShowSpeedMenu(false); }}
                          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] sm:text-[11px] font-semibold text-stone-200 border border-stone-700"
                        >
                          ⚙ Filters
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowFiltersMenu(false); }}
                            className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] sm:text-[11px] font-semibold text-stone-200 border border-stone-700"
                          >
                            {playbackSpeed}x
                          </button>

                          {showSpeedMenu && (
                            <div className="absolute bottom-8 right-0 bg-stone-900 border border-stone-700 rounded-lg shadow-xl py-1 w-24 z-30">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                                <button
                                  key={spd}
                                  onClick={() => changeSpeed(spd)}
                                  className={`w-full px-3 py-1 text-left text-xs hover:bg-stone-800 ${playbackSpeed === spd ? 'text-[#C29B72] font-bold' : 'text-stone-300'}`}
                                >
                                  {spd}x
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button onClick={toggleFullscreen} className="hover:text-[#C29B72] transition-colors p-1" title="Fullscreen">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                        </button>
                      </div>
                    </div>

                    {showFiltersMenu && (
                      <div className="absolute bottom-14 right-4 bg-stone-900/95 border border-stone-700 rounded-xl p-4 shadow-2xl w-60 sm:w-64 space-y-3 z-30 backdrop-blur-md">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                          <p className="text-xs font-bold text-stone-200">Cinematic Adjustments</p>
                          <button onClick={() => { setBrightness(100); setSaturation(100); setContrast(100); }} className="text-[10px] text-[#C29B72]">
                            Reset
                          </button>
                        </div>
                        
                        <div className="space-y-2 text-[11px] text-stone-300">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>Brightness</span>
                              <span className="text-stone-400">{brightness}%</span>
                            </div>
                            <input type="range" min={50} max={200} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1 bg-stone-700 rounded accent-[#C29B72]" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>Saturation</span>
                              <span className="text-stone-400">{saturation}%</span>
                            </div>
                            <input type="range" min={0} max={200} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-1 bg-stone-700 rounded accent-[#C29B72]" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>Contrast</span>
                              <span className="text-stone-400">{contrast}%</span>
                            </div>
                            <input type="range" min={50} max={150} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1 bg-stone-700 rounded accent-[#C29B72]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="space-y-3 max-w-sm p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center mx-auto text-stone-400">
                      ⚠
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                      Video Unavailable
                    </h3>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      This lesson has no playable video URL. Re-upload the file in Instructor Studio, then publish again.
                    </p>
                  </div>
                </div>
              )}
            </div>


            <div className="rounded-xl border border-[#E3DACF] bg-[#F3EEE7] p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3DACF] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {activeLesson?.title || 'Select a Lesson'}
                </h2>
                <button
                  onClick={() => activeLessonId && toggleLessonCompletion(activeLessonId)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors self-start sm:self-auto ${
                    completedLessons[activeLessonId]
                      ? 'bg-[#E3EFE0] text-[#34592B] border border-[#C6DCBF]'
                      : 'bg-[#3E3228] hover:bg-[#2C231C] text-[#FAF7F2]'
                  }`}
                >
                  {completedLessons[activeLessonId] ? 'Completed ✓' : 'Mark Complete'}
                </button>
              </div>

              <div className="text-xs sm:text-sm text-stone-700 leading-relaxed min-h-[140px] py-2">
                {activeLesson?.content || 'Comprehensive reading material for this lesson is currently being updated.'}
              </div>

              <div className="pt-4 border-t border-[#E3DACF] flex items-center justify-between text-xs">
                <button onClick={handlePrevLesson} className="px-3 py-2 rounded-lg border border-[#D8CEBF] bg-[#FAF7F2] hover:bg-[#EBE3D7] text-stone-700 font-medium">
                  ← Previous
                </button>
                <button onClick={handleNextLesson} className="px-3 py-2 rounded-lg border border-[#D8CEBF] bg-[#FAF7F2] hover:bg-[#EBE3D7] text-stone-700 font-medium">
                  Next →
                </button>
              </div>
            </div>
          </div>


          <div className={`${isSidebarOpen ? 'lg:col-span-4' : 'hidden'} ${mobileTab === 'outline' ? 'block' : 'hidden md:block'} space-y-4`}>
            <div className="rounded-xl border border-[#E3DACF] bg-[#F3EEE7] p-4 lg:sticky lg:top-20 space-y-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Course Outline</h3>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {completedCount}/{totalLessons} Complete
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-lg px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8C6D53]"
                />
              </div>

              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {course?.sections?.map((section) => {
                  const filteredLessons = (section.lessons || []).filter((l) =>
                    l.title.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  if (searchQuery && filteredLessons.length === 0) return null;

                  return (
                    <div key={section.id} className="rounded-lg border border-[#E3DACF] bg-[#FAF7F2] overflow-hidden">
                      <div className="p-2.5 bg-[#E8DFD5] border-b border-[#E3DACF]">
                        <p className="text-xs font-bold text-stone-800">{section.title}</p>
                      </div>

                      <div className="divide-y divide-[#E3DACF]">
                        {filteredLessons.map((lesson) => {
                          const isActive = lesson.id === activeLessonId;
                          const isCompleted = !!completedLessons[lesson.id];

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                setActiveLessonId(lesson.id);
                                setMobileTab('lesson');
                              }}
                              className={`w-full p-3 text-left transition-colors flex items-center gap-3 ${
                                isActive ? 'bg-[#E3DACF] text-stone-900 font-bold' : 'hover:bg-[#EBE3D7] text-stone-700'
                              }`}
                            >
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLessonCompletion(lesson.id);
                                }}
                                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 text-xs ${
                                  isCompleted ? 'bg-[#3E3228] text-[#FAF7F2] font-bold' : 'border border-[#C5BBAE]'
                                }`}
                              >
                                {isCompleted && '✓'}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className={`text-xs truncate ${isActive ? 'font-bold' : ''}`}>
                                  {lesson.title}
                                </p>
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


          <div className={`${mobileTab === 'workspace' ? 'block' : 'hidden md:block'} lg:col-span-12 space-y-4`}>
            <div className="rounded-xl border border-[#E3DACF] bg-[#F3EEE7] p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E3DACF] pb-3 overflow-x-auto">
                {(['overview', 'notes', 'resources', 'reviews'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-[#E8DFD5] text-[#3E3228] border border-[#CFC3B3]'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="text-sm">
                {activeTab === 'overview' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-stone-900">Course Overview</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {course?.description || 'No overview provided for this course.'}
                    </p>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <textarea
                        rows={3}
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Write a personal note for this lesson..."
                        className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-lg p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8C6D53]"
                      />
                      <div className="flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-[#3E3228] hover:bg-[#2C231C] text-[#FAF7F2] rounded-lg text-xs font-bold transition-colors">
                          Save Note
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2">
                      {notes.length === 0 ? (
                        <p className="text-xs text-stone-500 italic">No personal notes saved for this course yet.</p>
                      ) : (
                        notes.map((n) => (
                          <div key={n.id} className="p-3 rounded-lg border border-[#E3DACF] bg-[#FAF7F2] space-y-1">
                            <span className="text-[10px] text-stone-500 font-medium">{n.createdAt}</span>
                            <p className="text-xs text-stone-800">{n.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="space-y-2">
                    {sampleResources.map((res) => (
                      <div key={res.id} className="p-3 rounded-lg border border-[#E3DACF] bg-[#FAF7F2] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-stone-900">{res.title}</p>
                          {res.size && <p className="text-[10px] text-stone-500">{res.size}</p>}
                        </div>
                        <a href={res.downloadUrl} className="px-3 py-1.5 rounded border border-[#D8CEBF] hover:border-[#8C6D53] text-xs text-stone-700 bg-[#F3EEE7]">
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddReview} className="space-y-3 p-4 rounded-lg border border-[#E3DACF] bg-[#FAF7F2]">
                      <p className="text-xs font-bold text-stone-900">Leave Course Feedback</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setNewRating(star)} className={`text-lg ${star <= newRating ? 'text-amber-700' : 'text-stone-300'}`}>
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="Share your thoughts on this course..."
                        className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-lg p-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8C6D53]"
                      />
                      <button type="submit" disabled={submittingReview} className="px-4 py-2 bg-[#3E3228] hover:bg-[#2C231C] text-[#FAF7F2] rounded-lg text-xs font-bold disabled:opacity-50">
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>

                    <div className="space-y-2">
                      {reviews.length === 0 ? (
                        <p className="text-xs text-stone-500 italic">No reviews submitted yet. Be the first to share your feedback!</p>
                      ) : (
                        reviews.map((rev) => (
                          <div key={rev.id} className="p-3.5 rounded-xl border border-[#E3DACF] bg-[#FAF7F2] space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-[#3E3228] text-[#FAF7F2] flex items-center justify-center text-xs font-bold uppercase overflow-hidden shrink-0 border border-[#D8CEBF]">
                                  {rev.userAvatarUrl ? (
                                    <img src={rev.userAvatarUrl} alt={rev.userName} className="h-full w-full object-cover" />
                                  ) : (
                                    <span>{rev.userName?.[0] || 'U'}</span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-stone-900 block leading-tight">{rev.userName}</span>
                                  <span className="text-[10px] text-stone-400">{rev.date}</span>
                                </div>
                              </div>
                              <span className="text-amber-700 text-xs font-bold">{'★'.repeat(rev.rating)}</span>
                            </div>
                            <p className="text-xs text-stone-700 pl-10 leading-relaxed">{rev.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}