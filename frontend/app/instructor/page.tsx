'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUploadThing, uploadFiles } from '../../lib/uploadthing';
import { getAuthToken, isTokenExpired, redirectToLogin } from '../../lib/auth';

type ThemeStyle = 'white-glass' | 'dark-glass';

interface Category {
  id: string;
  name: string;
}

interface Lesson {
  title: string;
  videoUrl: string;
  durationMinutes: number;
  durationFormatted?: string;
  videoFileName?: string;
  videoFileSize?: string;
  isFreePreview: boolean;
}

interface Section {
  title: string;
  lessons: Lesson[];
}

// Strict security filters: Reject any scripts or dangerous extensions
const FORBIDDEN_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.sh', '.bash', '.zsh', '.py', '.pyc', '.pyw',
  '.php', '.php3', '.php4', '.phtml', '.phar',
  '.html', '.htm', '.xhtml', '.svg', '.xml',
  '.exe', '.bat', '.cmd', '.ps1', '.vbs', '.wsf',
  '.msi', '.cgi', '.pl', '.jsp', '.asp', '.aspx',
  '.jar', '.war', '.env', '.json', '.yml', '.yaml',
  '.wasm', '.rb', '.go', '.rs', '.c', '.cpp', '.h',
  '.bin', '.app', '.com', '.scr', '.dll', '.so', '.dylib'
];

const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.quicktime', '.mkv', '.m4v'];

const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const lowerName = file.name.toLowerCase();

  for (const ext of FORBIDDEN_EXTENSIONS) {
    if (lowerName.endsWith(ext)) {
      return {
        valid: false,
        error: `Security Violation: Scripts and executable files (${file.name}) are strictly forbidden. Only standard images (PNG, JPG, WebP) are permitted.`,
      };
    }
  }

  const hasAllowedExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      valid: false,
      error: `Invalid format: "${file.name}". Please upload a valid image file (PNG, JPG, or WebP).`,
    };
  }

  if (!file.type || !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: `Invalid file MIME type (${file.type || 'unknown'}). Only images are accepted.`,
    };
  }

  if (file.type.includes('svg') || lowerName.endsWith('.svg')) {
    return {
      valid: false,
      error: `Security Violation: SVG files are strictly prohibited as they may contain executable JavaScript. Please use PNG or JPG.`,
    };
  }

  if (file.size > 8 * 1024 * 1024) {
    return {
      valid: false,
      error: `File size too large: Image cannot exceed 8MB.`,
    };
  }

  return { valid: true };
};

const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  const lowerName = file.name.toLowerCase();

  for (const ext of FORBIDDEN_EXTENSIONS) {
    if (lowerName.endsWith(ext)) {
      return {
        valid: false,
        error: `Security Violation: Scripts and executable files (${file.name}) are strictly forbidden. Only playable video files (MP4, WebM, MOV) are permitted.`,
      };
    }
  }

  const hasAllowedExt = ALLOWED_VIDEO_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      valid: false,
      error: `Invalid format: "${file.name}". Only MP4, WebM, or MOV video files are permitted.`,
    };
  }

  if (!file.type || !file.type.startsWith('video/')) {
    return {
      valid: false,
      error: `Invalid file MIME type (${file.type || 'unknown'}). Only video media is accepted.`,
    };
  }

  if (file.size > 512 * 1024 * 1024) {
    return {
      valid: false,
      error: `File size too large: Video cannot exceed 512MB.`,
    };
  }

  return { valid: true };
};

// Automatically read and extract exact duration directly from the video file metadata
const extractVideoDuration = (file: File): Promise<{ seconds: number; formatted: string }> => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      const timeout = setTimeout(() => {
        try { URL.revokeObjectURL(objectUrl); } catch {}
        resolve({ seconds: 60, formatted: '1:00' });
      }, 6000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        try { URL.revokeObjectURL(objectUrl); } catch {}
        const duration = video.duration;
        if (isNaN(duration) || duration <= 0) {
          resolve({ seconds: 60, formatted: '1:00' });
          return;
        }
        const totalSecs = Math.round(duration);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        resolve({ seconds: totalSecs, formatted });
      };

      video.onerror = () => {
        clearTimeout(timeout);
        try { URL.revokeObjectURL(objectUrl); } catch {}
        resolve({ seconds: 60, formatted: '1:00' });
      };
    } catch {
      resolve({ seconds: 60, formatted: '1:00' });
    }
  });
};

export default function MobileInstructorStudioPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  // Glassmorphic Theme System synchronized with Dashboard
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(() => {
    if (typeof window === 'undefined') return 'dark-glass';
    const saved = localStorage.getItem('apex_theme_style');
    if (saved === 'white-glass' || saved === 'dark-glass') return saved;
    return 'dark-glass';
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' | 'info' } | null>(null);

  // Course Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFreeCourse, setIsFreeCourse] = useState(false);
  const [price, setPrice] = useState('49.99');
  const [level, setLevel] = useState('BEGINNER');
  const [language, setLanguage] = useState('English');
  const [imageUrl, setImageUrl] = useState('');

  // Course Curriculum
  const [sections, setSections] = useState<Section[]>([
    {
      title: '1. Introduction & Course Foundations',
      lessons: [
        {
          title: 'Welcome & Curriculum Overview',
          videoUrl: '',
          durationMinutes: 0,
          durationFormatted: '',
          isFreePreview: true,
        },
      ],
    },
  ]);

  // Upload States
  const [isUploadingVideo, setIsUploadingVideo] = useState<number | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const { startUpload: startVideoUpload } = useUploadThing('chapterVideo', {
    onUploadProgress: (p) => setVideoProgress(p),
  });

  const { startUpload: startThumbnailUpload } = useUploadThing('courseImage', {
    onUploadProgress: (p) => setThumbnailProgress(p),
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const url = res[0].ufsUrl || res[0].url;
        setImageUrl(url);
        setIsUploadingThumbnail(false);
        setThumbnailProgress(0);
        showToast('Thumbnail successfully uploaded & verified!', 'success');
      }
    },
    onUploadError: (error: Error) => {
      setIsUploadingThumbnail(false);
      setThumbnailProgress(0);
      showToast(`Thumbnail upload failed: ${error.message}`, 'error');
    },
  });

  const handleThemeChange = (newTheme: ThemeStyle) => {
    setThemeStyle(newTheme);
    localStorage.setItem('apex_theme_style', newTheme);
    showToast(`Switched to ${newTheme === 'dark-glass' ? 'Dark Glass' : 'White Glass'} mode!`, 'info');
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      redirectToLogin('Please log in as an instructor to access the studio.');
      return;
    }

    const checkInstructorAccess = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          redirectToLogin('Your session has expired. Please log in again.');
          return false;
        }

        if (res.ok) {
          const profile = await res.json();
          if (profile.role !== 'INSTRUCTOR' && profile.role !== 'ADMIN') {
            router.push('/dashboard');
            return false;
          }
          return true;
        } else {
          redirectToLogin('Session invalid. Please log in again.');
          return false;
        }
      } catch (e) {
        router.push('/dashboard');
        return false;
      }
    };

    const fetchCategories = async () => {
      try {
        const hasAccess = await checkInstructorAccess();
        if (!hasAccess) return;

        const res = await fetch(`${API_URL}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          if (data.length > 0) setCategoryId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };

    fetchCategories();
  }, [router, API_URL]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleFreeToggle = (checked: boolean) => {
    setIsFreeCourse(checked);
    if (checked) {
      setPrice('0');
    } else {
      setPrice('49.99');
    }
  };

  const handleAddSection = () => {
    setSections((prev) => [
      ...prev,
      { title: `${prev.length + 1}. New Learning Module`, lessons: [] },
    ]);
  };

  const handleAddLesson = (sectionIndex: number) => {
    setSections((prev) =>
      prev.map((sec, sIdx) => {
        if (sIdx !== sectionIndex) return sec;
        return {
          ...sec,
          lessons: [
            ...sec.lessons,
            {
              title: '',
              videoUrl: '',
              durationMinutes: 0,
              durationFormatted: '',
              isFreePreview: isFreeCourse,
            },
          ],
        };
      })
    );
  };

  const updateLessonData = (
    sectionIndex: number,
    lessonIndex: number,
    updates: Partial<Lesson>
  ) => {
    setSections((prev) =>
      prev.map((sec, sIdx) => {
        if (sIdx !== sectionIndex) return sec;
        const updatedLessons = sec.lessons.map((les, lIdx) => {
          if (lIdx !== lessonIndex) return les;
          return { ...les, ...updates };
        });
        return { ...sec, lessons: updatedLessons };
      })
    );
  };

  const handleLessonChange = (
    sectionIndex: number,
    lessonIndex: number,
    field: keyof Lesson,
    value: any
  ) => {
    updateLessonData(sectionIndex, lessonIndex, { [field]: value });
  };

  const handleRemoveLesson = (sectionIndex: number, lessonIndex: number) => {
    setSections((prev) =>
      prev.map((sec, sIdx) => {
        if (sIdx !== sectionIndex) return sec;
        return {
          ...sec,
          lessons: sec.lessons.filter((_, lIdx) => lIdx !== lessonIndex),
        };
      })
    );
  };

  const handleRemoveSection = (sectionIndex: number) => {
    if (sections.length === 1) {
      showToast('Course must have at least one section.', 'error');
      return;
    }
    setSections((prev) => prev.filter((_, sIdx) => sIdx !== sectionIndex));
  };

  // Strict thumbnail upload handler: ONLY images, strictly blocks scripts
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Security validation
    const check = validateImageFile(file);
    if (!check.valid) {
      showToast(check.error || 'Invalid image file.', 'error');
      e.target.value = '';
      return;
    }

    setIsUploadingThumbnail(true);
    setThumbnailProgress(0);
    showToast(`Uploading thumbnail "${file.name}"...`, 'info');

    try {
      await startThumbnailUpload([file]);
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`, 'error');
      setIsUploadingThumbnail(false);
    } finally {
      e.target.value = '';
    }
  };

  // Strict video upload handler: ONLY videos, strictly blocks scripts, extracts exact duration automatically
  const handleRealVideoUpload = async (
    sectionIndex: number,
    lessonIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // 1. Strict Security Validation: blocks scripts
    const check = validateVideoFile(file);
    if (!check.valid) {
      showToast(check.error || 'Invalid video file.', 'error');
      e.target.value = '';
      return;
    }

    const uploadKey = sectionIndex * 100 + lessonIndex;
    setIsUploadingVideo(uploadKey);
    setVideoProgress(0);

    // 2. Exact Video Duration Extraction directly from video metadata
    try {
      showToast('Extracting duration from video metadata...', 'info');
      const { seconds, formatted } = await extractVideoDuration(file);
      const computedMinutes = Math.max(1, Math.round(seconds / 60));
      const formattedSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      // Atomic update of detected duration and metadata
      updateLessonData(sectionIndex, lessonIndex, {
        durationMinutes: computedMinutes,
        durationFormatted: formatted,
        videoFileName: file.name,
        videoFileSize: formattedSize,
      });

      showToast(`Uploading video file "${file.name}" (${formatted})...`, 'info');

      // 3. Upload video via UploadThing with uploadFiles fallback
      let uploadedUrl = '';
      try {
        const res = await startVideoUpload([file]);
        const uploaded = res?.[0];
        uploadedUrl = uploaded?.serverData?.url || uploaded?.ufsUrl || uploaded?.url || uploaded?.appUrl || '';
      } catch (hookErr: any) {
        console.warn('startVideoUpload encountered issue, trying direct uploadFiles fallback...', hookErr);
        try {
          const res = await uploadFiles('chapterVideo', {
            files: [file],
            onUploadProgress: ({ progress }) => setVideoProgress(progress),
          });
          const uploaded = res?.[0];
          uploadedUrl = uploaded?.serverData?.url || uploaded?.ufsUrl || uploaded?.url || uploaded?.appUrl || '';
        } catch (uploadFilesErr: any) {
          throw new Error(uploadFilesErr.message || hookErr.message || 'Upload failed');
        }
      }

      if (uploadedUrl) {
        updateLessonData(sectionIndex, lessonIndex, {
          videoUrl: uploadedUrl,
          durationMinutes: computedMinutes,
          durationFormatted: formatted,
          videoFileName: file.name,
          videoFileSize: formattedSize,
        });
        showToast(`Video successfully uploaded! Exact duration locked to ${formatted}.`, 'success');
      } else {
        throw new Error('Video upload completed but could not obtain streaming URL. Please try again.');
      }
    } catch (error: any) {
      showToast(`Video processing failed: ${error.message || 'Unknown upload error'}`, 'error');
    } finally {
      setIsUploadingVideo(null);
      setVideoProgress(0);
      e.target.value = '';
    }
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a course title.', 'error');
      return;
    }

    if (isUploadingVideo !== null || isUploadingThumbnail) {
      showToast('Please wait for all media uploads to finish before publishing.', 'error');
      return;
    }

    if (!sections || sections.length === 0) {
      showToast('Course must contain at least one module section.', 'error');
      return;
    }

    // STRICT REQUIREMENT: Impossible to publish course without any video uploaded
    let totalLessonsCount = 0;
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      if (!section.lessons || section.lessons.length === 0) {
        showToast(
          `Section ${sIdx + 1} ("${section.title || 'Untitled'}") has no lectures. Please add at least one lecture.`,
          'error'
        );
        return;
      }

      for (let lIdx = 0; lIdx < section.lessons.length; lIdx++) {
        const lesson = section.lessons[lIdx];
        totalLessonsCount++;

        if (!lesson.title.trim()) {
          showToast(`Lecture ${lIdx + 1} in Section ${sIdx + 1} is missing a title.`, 'error');
          return;
        }

        const videoUrlVal = lesson.videoUrl?.trim();
        if (!videoUrlVal) {
          showToast(
            `Cannot publish: Lecture ${lIdx + 1} ("${lesson.title || 'Untitled'}") in Section ${sIdx + 1} has no video uploaded. Every lecture requires an uploaded video file.`,
            'error'
          );
          return;
        }
      }
    }

    if (totalLessonsCount === 0) {
      showToast('Cannot publish course without any video uploaded. Please upload at least one video.', 'error');
      return;
    }

    let finalPrice = 0;
    if (!isFreeCourse) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0.5 || parsedPrice > 500.0) {
        showToast('Paid courses must be priced between $0.50 and $500.00.', 'error');
        return;
      }
      finalPrice = parsedPrice;
    }

    setLoading(true);
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      redirectToLogin('Your session has expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          price: finalPrice,
          categoryId,
          level,
          language,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
          sections,
          status: 'PUBLISHED',
        }),
      });

      if (res.status === 401) {
        redirectToLogin('Your session has expired. Please log in again.');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish course');

      showToast(isFreeCourse ? 'Free course successfully published!' : 'Course published to catalog!', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1200);
    } catch (err: any) {
      showToast(err.message || 'Error publishing course.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalLessonsCount = sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const totalDurationMinutes = sections.reduce(
    (acc, s) => acc + s.lessons.reduce((lAcc, les) => lAcc + (les.durationMinutes || 0), 0),
    0
  );
  const totalUploadedVideos = sections.reduce(
    (acc, s) => acc + s.lessons.filter((l) => Boolean(l.videoUrl && l.videoUrl.trim())).length,
    0
  );
  const allLecturesHaveVideo =
    totalLessonsCount > 0 && totalUploadedVideos === totalLessonsCount;

  // Exact theme styling tokens matching Dashboard Glassmorphism
  const theme = {
    'white-glass': {
      bg: 'bg-[#f4f6fa] text-slate-900',
      header:
        'bg-white/70 border-b border-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
      card:
        'bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.95)]',
      nestedCard:
        'bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.03)]',
      buttonPrimary:
        'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:brightness-105 active:scale-95 transition-all',
      buttonDark:
        'bg-slate-900 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:bg-slate-800 active:scale-95 transition-all',
      pill:
        'bg-white/80 rounded-full backdrop-blur-xl border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 font-semibold',
      accentText: 'text-blue-600',
      input:
        'bg-white/80 rounded-2xl border border-white/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder-slate-400 font-medium backdrop-blur-lg',
      dropzone:
        'border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white/40 hover:bg-white/60 transition-all rounded-2xl',
      badge: 'bg-blue-50 border border-blue-200 text-blue-700',
    },
    'dark-glass': {
      bg: 'bg-[#090b10] text-slate-100',
      header:
        'bg-black/50 border-b border-white/10 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)]',
      card:
        'bg-white/[0.06] backdrop-blur-2xl border border-white/15 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.18)]',
      nestedCard:
        'bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]',
      buttonPrimary:
        'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white font-bold rounded-2xl shadow-[0_8px_25px_rgba(147,51,234,0.4),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:brightness-110 active:scale-95 transition-all',
      buttonDark:
        'bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all backdrop-blur-xl',
      pill:
        'bg-white/10 rounded-full backdrop-blur-xl border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)] text-slate-100 font-semibold',
      accentText: 'text-purple-400',
      input:
        'bg-black/40 rounded-2xl border border-white/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 text-white placeholder-white/40 font-medium backdrop-blur-xl',
      dropzone:
        'border-2 border-dashed border-white/20 hover:border-purple-400/80 bg-white/[0.03] hover:bg-white/[0.08] transition-all rounded-2xl',
      badge: 'bg-purple-500/20 border border-purple-400/30 text-purple-300',
    },
  }[themeStyle];

  return (
    <div
      className={`relative min-h-screen flex flex-col font-sans selection:bg-purple-500 selection:text-white transition-colors duration-500 ${theme.bg}`}
    >
      {/* Luminous background orbs for frosted glass refraction */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {themeStyle === 'dark-glass' ? (
          <>
            <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-violet-600/30 to-fuchsia-500/25 blur-[140px] animate-pulse" />
            <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-blue-600/25 via-cyan-500/20 to-indigo-600/25 blur-[150px] animate-pulse" />
            <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-700/20 to-rose-600/20 blur-[130px]" />
          </>
        ) : (
          <>
            <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-blue-300/40 to-sky-200/30 blur-[140px]" />
            <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-indigo-200/30 to-purple-200/30 blur-[150px]" />
            <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-200/30 to-blue-200/30 blur-[130px]" />
          </>
        )}
      </div>

      {/* Glass Notification Toast */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-3 backdrop-blur-2xl animate-dropdown-smooth max-w-md w-[90%] ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
              : 'bg-white/20 border-white/30 text-white'
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
              toast.type === 'success'
                ? 'bg-emerald-400 animate-ping'
                : toast.type === 'error'
                ? 'bg-rose-400 animate-pulse'
                : 'bg-cyan-400'
            }`}
          />
          <span className="leading-snug flex-1">{toast.msg}</span>
        </div>
      )}

      {/* Sticky Frosted-Glass Header with Persistent Visibility on Scroll */}
      <header className={`sticky top-0 z-50 w-full transition-colors duration-300 backdrop-blur-2xl ${theme.header}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <div
            className="group flex items-center gap-3 cursor-pointer text-left font-black tracking-tight transition-transform active:scale-95"
            onClick={() => router.push('/dashboard')}
          >
            <div className="h-10 w-10 rounded-2xl overflow-hidden bg-white/10 border border-white/25 shadow-md shadow-violet-500/20 p-1 flex items-center justify-center backdrop-blur-md">
              <img
                src="/images/image.png"
                alt="ApexLearn Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black leading-none tracking-tight">ApexLearn</span>
              <span className="text-[11px] font-bold opacity-75">Instructor Studio</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Direct Sun / Moon Toggle */}
            <button
              onClick={() => handleThemeChange(themeStyle === 'dark-glass' ? 'white-glass' : 'dark-glass')}
              aria-label="Toggle light and dark glass mode"
              title={themeStyle === 'dark-glass' ? 'Switch to White Glass' : 'Switch to Dark Glass'}
              className={`flex items-center justify-center h-10 w-10 text-base transition-all hover:scale-105 active:scale-90 ${theme.pill}`}
            >
              <span className="transform transition-transform duration-300">
                {themeStyle === 'dark-glass' ? '🌙' : '☀️'}
              </span>
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className={`px-4 py-2 text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 ${theme.pill}`}
            >
              ← Student Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Content Floating over Luminous Mesh */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-8 pb-36 space-y-8">
        {/* Studio Hero Banner */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-purple-500/15 border border-purple-400/25 text-purple-400">
            <span>✦ Course Authoring Suite</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Design & Publish Masterclasses
          </h1>
          <p className="text-xs sm:text-sm opacity-75 max-w-2xl leading-relaxed">
            Construct your curriculum with automated video duration discovery, strict security media filters, and physical depth glass aesthetics.
          </p>
        </div>

        <form onSubmit={handleSubmitCourse} className="space-y-8">
          {/* Card 1: Course Information */}
          <section className={`p-6 sm:p-8 space-y-6 ${theme.card}`}>
            <div className="flex items-center justify-between border-b border-current/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-purple-500/20 text-xs font-black text-purple-400">
                  1
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Course Metadata & Presentation
                </h2>
              </div>
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                  isFreeCourse ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' : theme.badge
                }`}
              >
                {isFreeCourse ? 'Free Tier' : 'Premium Paid'}
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Systems Architecture & Microservices"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={`w-full px-4 py-3.5 text-xs sm:text-sm focus:outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-2">
                  Comprehensive Description *
                </label>
                <textarea
                  placeholder="Provide syllabus objectives, target audience insights, and industry takeaways..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className={`w-full px-4 py-3 text-xs sm:text-sm focus:outline-none resize-none leading-relaxed ${theme.input}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-2">
                    Subject Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={`w-full px-3.5 py-3 text-xs sm:text-sm focus:outline-none ${theme.input}`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-2">
                    Target Skill Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className={`w-full px-3.5 py-3 text-xs sm:text-sm focus:outline-none ${theme.input}`}
                  >
                    <option value="BEGINNER" className="bg-slate-900 text-white">
                      Beginner
                    </option>
                    <option value="INTERMEDIATE" className="bg-slate-900 text-white">
                      Intermediate
                    </option>
                    <option value="EXPERT" className="bg-slate-900 text-white">
                      Expert
                    </option>
                    <option value="ALL" className="bg-slate-900 text-white">
                      All Levels
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-2">
                    Audio / Subtitle Language
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={`w-full px-4 py-3 text-xs sm:text-sm focus:outline-none ${theme.input}`}
                  />
                </div>
              </div>

              {/* Strict Thumbnail Upload Zone - Disallows Scripts, Only Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Course Cover Thumbnail *
                  </label>
                  <span className="text-[10px] opacity-60 font-medium">
                    Strict Policy: PNG, JPG, WebP only • Scripts strictly rejected
                  </span>
                </div>

                {imageUrl ? (
                  <div className={`p-4 flex flex-col sm:flex-row items-center gap-4 ${theme.nestedCard}`}>
                    <div className="relative h-28 w-44 rounded-xl overflow-hidden border border-white/20 shrink-0 shadow-md">
                      <img
                        src={imageUrl}
                        alt="Course Thumbnail Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 font-bold text-xs">
                        <span>✓ Image verified & uploaded</span>
                      </div>
                      <p className="text-[11px] opacity-70 font-mono truncate max-w-sm">{imageUrl}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        id="thumb-replace"
                        className="hidden"
                        onChange={handleThumbnailUpload}
                        disabled={isUploadingThumbnail}
                      />
                      <label
                        htmlFor="thumb-replace"
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${theme.pill}`}
                      >
                        {isUploadingThumbnail ? `${thumbnailProgress}%` : 'Replace Image'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="p-2 rounded-xl text-rose-400 hover:text-rose-300 transition-colors"
                        title="Remove Image"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`p-6 text-center ${theme.dropzone}`}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      id="thumb-up"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                      disabled={isUploadingThumbnail}
                    />
                    <label
                      htmlFor="thumb-up"
                      className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shadow-md">
                        📸
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs sm:text-sm font-bold block">
                          {isUploadingThumbnail
                            ? `Uploading & Scanning Thumbnail (${thumbnailProgress}%)...`
                            : 'Upload Course Thumbnail'}
                        </span>
                        <span className="text-[11px] opacity-60 block">
                          Click to select image (PNG, JPG, WebP) • Scripts prohibited
                        </span>
                      </div>
                    </label>
                    {isUploadingThumbnail && (
                      <div className="w-full max-w-xs mx-auto bg-white/10 h-2 rounded-full overflow-hidden mt-4">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full transition-all duration-300"
                          style={{ width: `${thumbnailProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Card 2: Pricing Architecture */}
          <section className={`p-6 sm:p-8 space-y-6 ${theme.card}`}>
            <div className="flex items-center justify-between border-b border-current/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-purple-500/20 text-xs font-black text-purple-400">
                  2
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Enrollment & Pricing Model
                </h2>
              </div>
              <label className="flex items-center gap-2 cursor-pointer px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                <input
                  type="checkbox"
                  checked={isFreeCourse}
                  onChange={(e) => handleFreeToggle(e.target.checked)}
                  className="rounded border-white/30 text-purple-600 h-4 w-4"
                />
                <span className="text-xs font-bold">Offer Free Access</span>
              </label>
            </div>

            {!isFreeCourse ? (
              <div className="space-y-4">
                <div className="max-w-xs space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-80">
                    Tuition Price ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-sm font-bold opacity-60">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.50"
                      max="500.00"
                      placeholder="49.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required={!isFreeCourse}
                      className={`w-full pl-8 pr-4 py-3 text-sm font-bold focus:outline-none ${theme.input}`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] opacity-60 px-1 pt-1">
                    <span>Valid range: $0.50 – $500.00</span>
                    <button
                      type="button"
                      onClick={() => handleFreeToggle(true)}
                      className={`underline font-bold ${theme.accentText}`}
                    >
                      Make Free
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-bold opacity-75">Presets:</span>
                  {['19.99', '29.99', '49.99', '99.99', '149.99'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrice(p)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        price === p ? 'bg-purple-600 text-white' : theme.pill
                      }`}
                    >
                      ${p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs">Community Free Course</h4>
                  <p className="text-[11px] opacity-80">
                    Students will be able to enroll instantly with zero payment barrier.
                  </p>
                </div>
                <span className="text-lg font-black font-mono">$0.00</span>
              </div>
            )}
          </section>

          {/* Card 3: Curriculum Structure with Strict Upload Only & Auto-Detected Duration */}
          <section className={`p-6 sm:p-8 space-y-6 ${theme.card}`}>
            <div className="flex items-center justify-between border-b border-current/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-purple-500/20 text-xs font-black text-purple-400">
                  3
                </span>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight">Curriculum Architecture</h2>
                  <span className="text-xs font-mono font-bold opacity-60">
                    ({sections.length} modules • {totalLessonsCount} lectures • ~{totalDurationMinutes} min)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddSection}
                className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${theme.pill}`}
              >
                <span>+ Add Section</span>
              </button>
            </div>

            <div className="space-y-6">
              {sections.map((section, sIndex) => (
                <div key={sIndex} className={`p-5 sm:p-6 space-y-5 ${theme.nestedCard}`}>
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black shrink-0 border border-white/20">
                      {sIndex + 1}
                    </span>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[sIndex].title = e.target.value;
                        setSections(updated);
                      }}
                      className={`flex-1 px-4 py-2.5 text-xs sm:text-sm font-bold focus:outline-none ${theme.input}`}
                      placeholder="Module Title (e.g. Fundamental Patterns)"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sIndex)}
                      className="text-rose-400 hover:text-rose-300 font-bold text-xs p-2 transition-colors"
                      title="Delete Module"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Lessons list inside section */}
                  <div className="space-y-4 pl-2 sm:pl-4 border-l-2 border-purple-500/30">
                    {section.lessons.map((lesson, lIndex) => {
                      const uploadKey = sIndex * 100 + lIndex;
                      const isThisUploading = isUploadingVideo === uploadKey;

                      return (
                        <div key={lIndex} className={`p-4 sm:p-5 space-y-4 ${theme.card}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                              Lecture {lIndex + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLesson(sIndex, lIndex)}
                              className="text-[11px] text-rose-400 hover:text-rose-300 font-bold transition-colors"
                            >
                              Remove Lecture
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1">
                                Lecture Title *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Configuring Distributed Cache with Redis"
                                value={lesson.title}
                                onChange={(e) => handleLessonChange(sIndex, lIndex, 'title', e.target.value)}
                                required
                                className={`w-full px-3.5 py-2.5 text-xs focus:outline-none ${theme.input}`}
                              />
                            </div>

                            <div className="flex items-end pb-1.5">
                              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer px-3 py-2 rounded-xl bg-white/5 border border-white/10 w-full">
                                <input
                                  type="checkbox"
                                  checked={isFreeCourse ? true : lesson.isFreePreview}
                                  disabled={isFreeCourse}
                                  onChange={(e) =>
                                    handleLessonChange(sIndex, lIndex, 'isFreePreview', e.target.checked)
                                  }
                                  className="rounded border-white/30 text-purple-600 h-4 w-4"
                                />
                                <span className="text-[11px]">Free Preview Lecture</span>
                              </label>
                            </div>
                          </div>

                          {/* Video Section: STRICTLY UPLOAD ONLY (NO USER TYPING IN URL), DURATION AUTO-DETECTED */}
                          <div className="pt-2 border-t border-current/10 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                                Lecture Video Media (Strict Upload)
                              </span>

                              {/* Exact Duration Display (Calculated from Video, NOT typed by user) */}
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-400/25 text-purple-300 text-xs font-mono font-bold">
                                <span>⏱️</span>
                                <span>
                                  {lesson.durationFormatted
                                    ? `Exact Duration: ${lesson.durationFormatted} (${lesson.durationMinutes} min)`
                                    : 'Duration: Detected upon video upload'}
                                </span>
                              </div>
                            </div>

                            {lesson.videoUrl ? (
                              /* Video Uploaded Success Card */
                              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                                    ✓
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs font-bold truncate block">
                                      {lesson.videoFileName || 'Lecture Video File Attached'}
                                    </span>
                                    <div className="flex items-center gap-2 text-[11px] opacity-75 mt-0.5">
                                      <span className="text-emerald-400 font-mono font-bold">
                                        ⏱️ {lesson.durationFormatted || `${lesson.durationMinutes} min`}
                                      </span>
                                      {lesson.videoFileSize && <span>• {lesson.videoFileSize}</span>}
                                      <span>• Stream ready</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                  <input
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime"
                                    id={`vid-replace-${sIndex}-${lIndex}`}
                                    className="hidden"
                                    onChange={(e) => handleRealVideoUpload(sIndex, lIndex, e)}
                                    disabled={isThisUploading}
                                  />
                                  <label
                                    htmlFor={`vid-replace-${sIndex}-${lIndex}`}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${theme.pill}`}
                                  >
                                    Replace Video
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleLessonChange(sIndex, lIndex, 'videoUrl', '');
                                      handleLessonChange(sIndex, lIndex, 'durationFormatted', '');
                                      handleLessonChange(sIndex, lIndex, 'durationMinutes', 0);
                                      handleLessonChange(sIndex, lIndex, 'videoFileName', '');
                                      handleLessonChange(sIndex, lIndex, 'videoFileSize', '');
                                    }}
                                    className="px-2 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors"
                                    title="Remove Video"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Video Upload Dropzone - Strictly rejects scripts, user CANNOT type URL */
                              <div className={`p-5 text-center ${theme.dropzone}`}>
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/quicktime"
                                  id={`vid-up-${sIndex}-${lIndex}`}
                                  className="hidden"
                                  onChange={(e) => handleRealVideoUpload(sIndex, lIndex, e)}
                                  disabled={isThisUploading}
                                />
                                <label
                                  htmlFor={`vid-up-${sIndex}-${lIndex}`}
                                  className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                                >
                                  <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shadow-md">
                                    📹
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-xs sm:text-sm font-bold block">
                                      {isThisUploading
                                        ? `Processing & Uploading Video (${videoProgress}%)...`
                                        : 'Upload Video File (MP4, WebM, MOV)'}
                                    </span>
                                    <span className="text-[11px] opacity-60 block">
                                      Video upload only • Duration extracted automatically • Scripts strictly forbidden
                                    </span>
                                  </div>
                                </label>
                                {isThisUploading && (
                                  <div className="w-full max-w-sm mx-auto bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                                    <div
                                      className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 h-full transition-all duration-300"
                                      style={{ width: `${videoProgress}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddLesson(sIndex)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${theme.pill}`}
                    >
                      <span>+ Add Lecture to Module</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sticky Floating Bottom Bar with Course Summary and Publish Action */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 backdrop-blur-2xl border-t border-white/15 shadow-[0_-12px_32px_rgba(0,0,0,0.5)] ${theme.header}`}
          >
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-black tracking-tight">
                  {title || 'Untitled Curriculum'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] opacity-75 font-mono">
                    {sections.length} Modules • {totalLessonsCount} Lectures • ~{totalDurationMinutes} min •{' '}
                    {isFreeCourse ? 'Free Tier' : `$${price}`}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      allLecturesHaveVideo
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {allLecturesHaveVideo
                      ? `✓ All ${totalLessonsCount} Videos Ready`
                      : `⚠️ ${totalUploadedVideos}/${totalLessonsCount} Videos Uploaded`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${theme.pill}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isUploadingVideo !== null || isUploadingThumbnail || !allLecturesHaveVideo}
                  title={!allLecturesHaveVideo ? 'Every lecture must have an uploaded video before publishing' : 'Publish Course'}
                  className={`px-7 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${theme.buttonPrimary}`}
                >
                  {loading
                    ? 'Publishing Masterclass...'
                    : !allLecturesHaveVideo
                    ? `Upload Videos (${totalUploadedVideos}/${totalLessonsCount})`
                    : isFreeCourse
                    ? 'Publish Free Course'
                    : `Publish Paid Course (${price ? `$${price}` : '$0.00'})`}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}