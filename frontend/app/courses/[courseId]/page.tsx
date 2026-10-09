'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, isTokenExpired, redirectToLogin } from '../../../lib/auth';

type ThemeStyle = 'white-glass' | 'dark-glass';

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  duration?: string;
  durationMinutes?: number;
  freePreview?: boolean;
  isFreePreview?: boolean;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  price: string | number;
  thumbnailUrl?: string;
  imageUrl?: string;
  level?: string;
  language?: string;
  ratingAverage?: number;
  ratingCount?: number;
  enrollmentCount?: number;
  category?: { id: string; name: string };
  author?: { name: string; avatarUrl?: string };
  sections: Section[];
}

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = (params?.courseId as string) || '';
  const API_URL = process.env.NEXT_PUBLIC_API_URL  ;

  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(() => {
    if (typeof window === 'undefined') return 'dark-glass';
    const saved = localStorage.getItem('apex_theme_style');
    return (saved === 'white-glass' || saved === 'dark-glass') ? saved : 'dark-glass';
  });

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

  const toggleTheme = () => {
    const nextTheme: ThemeStyle = themeStyle === 'dark-glass' ? 'white-glass' : 'dark-glass';
    setThemeStyle(nextTheme);
    localStorage.setItem('apex_theme_style', nextTheme);
  };

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/courses/${courseId}`, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Course not found or unavailable.');
        }
        const data = await res.json();
        setCourse(data);

        // Check if user is enrolled
        const token = getAuthToken();
        if (token && !isTokenExpired(token)) {
          try {
            const enrollRes = await fetch(`${API_URL}/enrollments/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (enrollRes.ok) {
              const myEnrollments = await enrollRes.json();
              const enrolled = myEnrollments.some(
                (e: any) => (e.course?.id || e.courseId) === courseId
              );
              setIsEnrolled(enrolled);
            }
          } catch {}
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, API_URL]);

  const handleEnrollOrCheckout = async () => {
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      redirectToLogin('Please log in to enroll in this course.');
      return;
    }

    if (isEnrolled) {
      router.push(`/courses/${courseId}/learn`);
      return;
    }

    const numPrice = Number(course?.price || 0);

    // Free Course Direct Enrollment
    if (numPrice === 0) {
      setEnrolling(true);
      try {
        const res = await fetch(`${API_URL}/enrollments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ courseId }),
        });

        if (res.ok) {
          setIsEnrolled(true);
          router.push(`/courses/${courseId}/learn`);
        } else {
          const errData = await res.json();
          alert(errData.message || 'Could not complete free enrollment.');
        }
      } catch (err) {
        alert('Network error enrolling in course.');
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // Paid Course Checkout Flow
    setEnrolling(true);
    try {
      const res = await fetch(`${API_URL}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      });

      const session = await res.json();
      if (session.url) {
        window.location.href = session.url;
      } else {
        alert(session.message || 'Failed to create checkout session.');
      }
    } catch {
      alert('Error initiating payment process.');
    } finally {
      setEnrolling(false);
    }
  };

  const theme = {
    'white-glass': {
      bg: 'bg-[#f4f6fa] text-slate-900',
      header: 'bg-white/75 border-b border-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
      card: 'bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.95)]',
      subCard: 'bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm',
      pill: 'bg-white/80 rounded-full backdrop-blur-xl border border-white/90 shadow-sm text-slate-900',
      buttonPrimary: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white font-bold rounded-2xl shadow-lg hover:brightness-105 active:scale-95 transition-all',
      textMuted: 'text-slate-600',
    },
    'dark-glass': {
      bg: 'bg-[#090b10] text-slate-100',
      header: 'bg-black/40 border-b border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      card: 'bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)]',
      subCard: 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-sm',
      pill: 'bg-white/10 rounded-full backdrop-blur-xl border border-white/15 shadow-sm text-slate-200',
      buttonPrimary: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-[0_8px_25px_rgba(147,51,234,0.35)] hover:brightness-110 active:scale-95 transition-all',
      textMuted: 'text-slate-400',
    },
  }[themeStyle];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold opacity-70">Loading course curriculum...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${theme.bg}`}>
        <div className={`p-8 max-w-md text-center space-y-4 ${theme.card}`}>
          <div className="text-3xl">⚠️</div>
          <h2 className="text-lg font-bold">Course Not Found</h2>
          <p className={`text-xs ${theme.textMuted}`}>{error || 'This course could not be loaded.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className={`px-6 py-2.5 text-xs font-bold ${theme.buttonPrimary}`}
          >
            Return to Catalog
          </button>
        </div>
      </div>
    );
  }

  const numPrice = Number(course.price || 0);
  const isFree = numPrice === 0;
  const totalLessons = course.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-x-clip ${theme.bg}`}>
      {/* Mesh Glow Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[130px]" />
      </div>

      {/* Sticky Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${theme.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg p-0.5 bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400">
              <div className="w-full h-full rounded-[14px] bg-black/60 backdrop-blur-md flex items-center justify-center p-1">
                <img src="/images/image.png" alt="ApexLearn Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight leading-none">
                Apex<span className="text-violet-500">Learn</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                Curriculum
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-2xl transition-all shadow-sm ${theme.pill} hover:scale-105 active:scale-95`}
              title="Toggle Theme"
            >
              {themeStyle === 'dark-glass' ? '☀️' : '🌙'}
            </button>
            <Link
              href="/dashboard"
              className={`px-4 py-2 text-xs font-bold transition-all ${theme.pill} hover:bg-white/20`}
            >
              Catalog
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12">
        {/* Course Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Metadata & Overview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-400/30">
                {course.category?.name || 'General Masterclass'}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/15">
                {course.level || 'All Levels'}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/15">
                {course.language || 'English'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className={`text-sm sm:text-base leading-relaxed ${theme.textMuted}`}>
              {course.description || 'Step-by-step masterclass packed with actionable insights, source walkthroughs, and verified credential testing.'}
            </p>

            {/* Author & Rating Highlights */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-current/10 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-500/20 border border-violet-400/40 flex items-center justify-center font-bold text-violet-300">
                  {course.author?.name ? course.author.name[0].toUpperCase() : 'A'}
                </div>
                <div>
                  <span className="block opacity-60 text-[10px] uppercase font-bold">Created by</span>
                  <span className="font-bold">{course.author?.name || 'ApexLearn Faculty'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">★ {course.ratingAverage ? Number(course.ratingAverage).toFixed(1) : '5.0'}</span>
                <span className="opacity-60">({course.ratingCount || 12} reviews)</span>
              </div>

              <div className="flex items-center gap-1.5 opacity-80">
                <span>👥</span>
                <span>{course.enrollmentCount || 0} students enrolled</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Purchase Card */}
          <div className="lg:col-span-5">
            <div className={`p-6 sm:p-8 space-y-6 sticky top-24 ${theme.card}`}>
              {/* Media Thumbnail */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 shadow-md">
                <img
                  src={course.thumbnailUrl || course.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white font-bold text-xs flex items-center gap-1.5">
                    <span>🎬</span> {course.sections.length} Modules • {totalLessons} Lectures
                  </span>
                </div>
              </div>

              {/* Price & Action Button */}
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black">
                      {isFree ? 'FREE' : `$${numPrice.toFixed(2)}`}
                    </span>
                    {!isFree && <span className="text-xs opacity-60 ml-2">Lifetime Access</span>}
                  </div>
                  {isEnrolled && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                      ✓ Enrolled
                    </span>
                  )}
                </div>

                <button
                  onClick={handleEnrollOrCheckout}
                  disabled={enrolling}
                  className={`w-full py-4 text-center text-sm sm:text-base font-black shadow-xl disabled:opacity-50 ${theme.buttonPrimary}`}
                >
                  {enrolling
                    ? 'Processing...'
                    : isEnrolled
                    ? 'Go to Classroom →'
                    : isFree
                    ? 'Enroll in Masterclass for Free'
                    : `Buy Masterclass ($${numPrice.toFixed(2)})`}
                </button>
              </div>

              {/* Course Features List */}
              <div className="pt-4 border-t border-current/10 space-y-2.5 text-xs">
                <div className="font-bold uppercase tracking-wider text-[10px] opacity-70">
                  This Masterclass includes:
                </div>
                <div className="flex items-center gap-2"><span>📺</span> Full HD direct video streaming</div>
                <div className="flex items-center gap-2"><span>⏱️</span> Self-paced learning with progress sync</div>
                <div className="flex items-center gap-2"><span>🎓</span> Cryptographically verified certificate of completion</div>
                <div className="flex items-center gap-2"><span>📝</span> Private lecture workspace & notes</div>
                <div className="flex items-center gap-2"><span>📱</span> Desktop, tablet & mobile access</div>
              </div>
            </div>
          </div>
        </div>

        {/* Syllabus Section */}
        <section className={`p-6 sm:p-10 space-y-8 ${theme.card}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-current/10 pb-6">
            <div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight">Curriculum Syllabus</h2>
              <p className={`text-xs sm:text-sm mt-1 ${theme.textMuted}`}>
                {course.sections.length} modules • {totalLessons} total lectures
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {course.sections.map((sec, sIdx) => (
              <div key={sec.id || sIdx} className={`p-5 space-y-3 ${theme.subCard}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-violet-500/20 text-violet-400 text-xs font-black flex items-center justify-center">
                      {sIdx + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold">{sec.title}</h3>
                  </div>
                  <span className="text-xs opacity-60">
                    {sec.lessons?.length || 0} lectures
                  </span>
                </div>

                <div className="space-y-2 pl-2 sm:pl-10">
                  {sec.lessons?.map((les, lIdx) => {
                    const isPreview = les.freePreview ?? les.isFreePreview ?? false;

                    return (
                      <div
                        key={les.id || lIdx}
                        className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/5 text-xs hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="opacity-50">▶</span>
                          <span className="font-semibold truncate">{les.title}</span>
                          {isPreview && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
                              Free Preview
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {les.duration && <span className="opacity-60 font-mono text-[11px]">{les.duration}</span>}
                          {isPreview && (
                            <button
                              onClick={() => setPreviewLesson(les)}
                              className="text-violet-400 font-bold hover:underline text-[11px]"
                            >
                              Watch Preview
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Free Preview Video Modal */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`max-w-3xl w-full p-6 space-y-4 rounded-3xl overflow-hidden relative ${theme.card}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Free Lecture Preview
                </span>
                <h3 className="text-base font-bold text-white">{previewLesson.title}</h3>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                className="p-2 rounded-xl text-white/70 hover:text-white bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video rounded-2xl overflow-hidden bg-black">
              {previewLesson.videoUrl ? (
                <video
                  src={previewLesson.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
                  Preview stream processing.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleEnrollOrCheckout}
                className={`px-6 py-2.5 text-xs font-bold ${theme.buttonPrimary}`}
              >
                {isFree ? 'Enroll for Free' : `Enroll Now ($${numPrice.toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
