'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUploadThing, uploadFiles } from '../../lib/uploadthing';
import { getAuthToken, isTokenExpired, redirectToLogin } from '../../lib/auth';

type ThemeStyle = 'white-glass' | 'dark-glass';
type TabType = 'create' | 'courses' | 'analytics';

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

interface InstructorCourse {
  id: string;
  title: string;
  description: string;
  price: string | number;
  thumbnailUrl?: string;
  imageUrl?: string;
  status: string;
  level: string;
  ratingAverage: number;
  ratingCount: number;
  enrollmentCount: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
}

interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
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

  // Navigation tab state: 'create' | 'courses' | 'analytics'
  const [activeTab, setActiveTab] = useState<TabType>('create');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' | 'info' } | null>(null);

  // Edit mode state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [loadingCourseForEdit, setLoadingCourseForEdit] = useState(false);

  // Instructor Courses & Stats
  const [myCourses, setMyCourses] = useState<InstructorCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchCourseQuery, setSearchCourseQuery] = useState('');
  const [myStats, setMyStats] = useState<InstructorStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 5.0,
  });

  // Deletion modal state
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Fetch author courses and statistics
  const fetchInstructorCourses = async () => {
    setLoadingCourses(true);
    try {
      const token = getAuthToken();
      if (!token || isTokenExpired(token)) return;

      const res = await fetch(`${API_URL}/courses/instructor/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMyCourses(data.courses || []);
        if (data.stats) {
          setMyStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load instructor courses', err);
    } finally {
      setLoadingCourses(false);
    }
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

    const initData = async () => {
      try {
        const hasAccess = await checkInstructorAccess();
        if (!hasAccess) return;

        const [catRes] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetchInstructorCourses(),
        ]);

        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data);
          if (data.length > 0 && !categoryId) setCategoryId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to initialize studio', err);
      }
    };

    initData();
  }, [router, API_URL]);

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

    const check = validateImageFile(file);
    if (!check.valid) {
      showToast(check.error || 'Invalid image file.', 'error');
      e.target.value = '';
      return;
    }

    setIsUploadingThumbnail(true);
    setThumbnailProgress(0);

    try {
      if (startThumbnailUpload) {
        await startThumbnailUpload([file]);
      } else {
        const res = await uploadFiles('courseImage', { files: [file] });
        if (res && res[0]) {
          const url = (res[0] as any).ufsUrl || res[0].url;
          setImageUrl(url);
          showToast('Thumbnail successfully uploaded & verified!', 'success');
        }
      }
    } catch (err: any) {
      showToast(`Thumbnail upload failed: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsUploadingThumbnail(false);
      setThumbnailProgress(0);
      e.target.value = '';
    }
  };

  // Strict video upload handler: ONLY media, strictly blocks scripts & extracts exact duration
  const handleVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sIdx: number,
    lIdx: number
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const check = validateVideoFile(file);
    if (!check.valid) {
      showToast(check.error || 'Invalid video file.', 'error');
      e.target.value = '';
      return;
    }

    const uniqueLessonId = sIdx * 1000 + lIdx;
    setIsUploadingVideo(uniqueLessonId);
    setVideoProgress(0);

    try {
      showToast('Extracting duration & inspecting video integrity...', 'info');
      const { seconds, formatted } = await extractVideoDuration(file);
      const mins = Math.max(1, Math.round(seconds / 60));

      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      updateLessonData(sIdx, lIdx, {
        durationMinutes: mins,
        durationFormatted: formatted,
        videoFileName: file.name,
        videoFileSize: sizeMB,
      });

      showToast(`Uploading "${file.name}" (${formatted})...`, 'info');

      let uploadedUrl = '';
      if (startVideoUpload) {
        const uploadRes = await startVideoUpload([file]);
        if (uploadRes && uploadRes[0]) {
          uploadedUrl = (uploadRes[0] as any).ufsUrl || uploadRes[0].url;
        }
      } else {
        const uploadRes = await uploadFiles('chapterVideo', { files: [file] });
        if (uploadRes && uploadRes[0]) {
          uploadedUrl = (uploadRes[0] as any).ufsUrl || uploadRes[0].url;
        }
      }

      if (!uploadedUrl) {
        throw new Error('Upload completed without valid URL returned.');
      }

      updateLessonData(sIdx, lIdx, {
        videoUrl: uploadedUrl,
        durationMinutes: mins,
        durationFormatted: formatted,
        videoFileName: file.name,
        videoFileSize: sizeMB,
      });

      showToast(`Lecture video "${file.name}" uploaded successfully!`, 'success');
    } catch (err: any) {
      showToast(`Video upload failed: ${err.message || 'Network error'}`, 'error');
    } finally {
      setIsUploadingVideo(null);
      setVideoProgress(0);
      e.target.value = '';
    }
  };

  // Load existing course for editing
  const handleStartEdit = async (courseId: string) => {
    setLoadingCourseForEdit(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load course details for editing.');
      const data = await res.json();

      setTitle(data.title || '');
      setDescription(data.description || '');
      const numPrice = Number(data.price || 0);
      if (numPrice === 0) {
        setIsFreeCourse(true);
        setPrice('0');
      } else {
        setIsFreeCourse(false);
        setPrice(numPrice.toString());
      }
      if (data.categoryId) setCategoryId(data.categoryId);
      if (data.level) setLevel(data.level);
      if (data.language) setLanguage(data.language);
      if (data.thumbnailUrl || data.imageUrl) setImageUrl(data.thumbnailUrl || data.imageUrl);

      if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
        setSections(
          data.sections.map((s: any, sIdx: number) => ({
            title: s.title || `Section ${sIdx + 1}`,
            lessons: (s.lessons || []).map((l: any, lIdx: number) => {
              const vUrl = l.videoUrl || l.video_url || l.videourl || '';
              const durationSecs = Number(l.duration || 0);
              const mins = Math.floor(durationSecs / 60);
              const secs = durationSecs % 60;
              return {
                title: l.title || `Lesson ${lIdx + 1}`,
                videoUrl: vUrl,
                durationMinutes: mins || 1,
                durationFormatted: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
                videoFileName: l.title ? `${l.title}.mp4` : undefined,
                isFreePreview: Boolean(l.freePreview || l.isFreePreview),
              };
            }),
          }))
        );
      }

      setEditingCourseId(courseId);
      setActiveTab('create');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Loaded "${data.title}" for editing!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error loading course for editing.', 'error');
    } finally {
      setLoadingCourseForEdit(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingCourseId(null);
    setTitle('');
    setDescription('');
    setPrice('49.99');
    setIsFreeCourse(false);
    setImageUrl('');
    setSections([
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
    showToast('Edit mode exited. Switched to new draft.', 'info');
  };

  // Delete course execution
  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/courses/${courseToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete course.');
      }

      showToast(`Masterclass "${courseToDelete.title}" successfully deleted.`, 'success');
      setCourseToDelete(null);
      await fetchInstructorCourses();
    } catch (err: any) {
      showToast(err.message || 'Could not delete course.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit Handler: Supports both CREATE (POST) and UPDATE (PUT)
  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Course title is required.', 'error');
      return;
    }

    if (!description.trim()) {
      showToast('Course description is required.', 'error');
      return;
    }

    if (!categoryId) {
      showToast('Please select a valid subject category.', 'error');
      return;
    }

    if (isUploadingVideo !== null || isUploadingThumbnail) {
      showToast('Please wait for all media uploads to finish before saving.', 'error');
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
            `Cannot save: Lecture ${lIdx + 1} ("${lesson.title || 'Untitled'}") in Section ${sIdx + 1} has no video uploaded. Every lecture requires an uploaded video file.`,
            'error'
          );
          return;
        }
      }
    }

    if (totalLessonsCount === 0) {
      showToast('Cannot save course without any video uploaded. Please upload at least one video.', 'error');
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

    const payload = {
      title,
      description,
      price: finalPrice,
      categoryId,
      level,
      language,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
      sections,
      status: 'PUBLISHED',
    };

    const targetUrl = editingCourseId
      ? `${API_URL}/courses/${editingCourseId}`
      : `${API_URL}/courses`;
    const targetMethod = editingCourseId ? 'PUT' : 'POST';

    try {
      const res = await fetch(targetUrl, {
        method: targetMethod,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        redirectToLogin('Your session has expired. Please log in again.');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save course');

      if (editingCourseId) {
        showToast('Masterclass changes saved and published!', 'success');
        setEditingCourseId(null);
      } else {
        showToast(isFreeCourse ? 'Free course successfully published!' : 'Masterclass published to catalog!', 'success');
      }

      await fetchInstructorCourses();
      setActiveTab('courses');
    } catch (err: any) {
      showToast(err.message || 'Error saving course.', 'error');
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

  // Filtered instructor courses for Tab 2
  const filteredCourses = myCourses.filter((c) => {
    const q = searchCourseQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.category?.name || '').toLowerCase().includes(q) ||
      c.level.toLowerCase().includes(q)
    );
  });

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

      {/* Delete Confirmation Glass Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className={`max-w-md w-full p-6 sm:p-8 space-y-6 ${theme.card}`}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/20 text-rose-400 text-xl font-bold">
                🗑️
              </span>
              <div>
                <h3 className="text-lg font-black tracking-tight">Delete Masterclass?</h3>
                <p className="text-xs opacity-75">This course will be archived and removed from catalog.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium opacity-90 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-rose-400">"{courseToDelete.title}"</span>? Existing enrolled students will preserve access history, but the course will no longer be listed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={isDeleting}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${theme.pill}`}
              >
                Keep Course
              </button>
              <button
                type="button"
                onClick={confirmDeleteCourse}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Masterclass'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Main Studio Content */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 pb-36 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border backdrop-blur-xl bg-white/10 dark:bg-black/40 border-white/15">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'create'
                  ? theme.buttonPrimary
                  : 'hover:bg-white/10 text-white/75 hover:text-white'
              }`}
            >
              <span>{editingCourseId ? '✏️ Edit Masterclass' : '✨ Studio / Creator'}</span>
              {editingCourseId && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                  EDIT MODE
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('courses');
                fetchInstructorCourses();
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'courses'
                  ? theme.buttonPrimary
                  : 'hover:bg-white/10 text-white/75 hover:text-white'
              }`}
            >
              <span>📚 My Masterclasses</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-mono font-bold">
                {myCourses.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('analytics');
                fetchInstructorCourses();
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? theme.buttonPrimary
                  : 'hover:bg-white/10 text-white/75 hover:text-white'
              }`}
            >
              <span>📊 Analytics & Revenue</span>
            </button>
          </div>

          {editingCourseId && activeTab === 'create' && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-amber-400/30 text-amber-300 hover:bg-amber-400/10 flex items-center gap-1.5`}
            >
              <span>✕ Cancel Edit & Create New</span>
            </button>
          )}
        </div>

        {/* TAB 1: CREATE & EDIT MASTERCLASS FORM */}
        {activeTab === 'create' && (
          <div className="space-y-8">
            {/* Studio Hero Banner or Edit Status Alert */}
            {editingCourseId ? (
              <div className="p-5 rounded-[24px] bg-amber-500/15 border border-amber-400/40 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-400/20 text-amber-300 text-2xl font-bold">
                    ✏️
                  </span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                      Currently Editing Masterclass
                    </span>
                    <h2 className="text-base sm:text-lg font-black tracking-tight">{title || 'Untitled Course'}</h2>
                    <p className="text-xs opacity-80">Make modifications to curriculum, lessons, pricing, and save directly.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 transition-all text-white border border-white/20 whitespace-nowrap"
                >
                  ✕ Discard & New Draft
                </button>
              </div>
            ) : (
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
            )}

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
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-2">
                        Instruction Language
                      </label>
                      <input
                        type="text"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className={`w-full px-4 py-3 text-xs sm:text-sm focus:outline-none ${theme.input}`}
                      />
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-current/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black tracking-tight block">Pricing Structure</span>
                        <span className="text-[11px] opacity-75">
                          Publish as a free public masterclass or premium paid offering
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFreeCourse}
                          onChange={(e) => handleFreeToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="ml-3 text-xs font-bold">{isFreeCourse ? 'Free Course' : 'Paid Course'}</span>
                      </label>
                    </div>

                    {!isFreeCourse && (
                      <div className="pt-2 border-t border-current/10 max-w-xs">
                        <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5">
                          Tuition Price (USD $) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold opacity-60">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.5"
                            max="500"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required={!isFreeCourse}
                            className={`w-full pl-8 pr-4 py-2.5 text-xs sm:text-sm font-mono font-bold focus:outline-none ${theme.input}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Card 2: Cover Thumbnail with Strict File Check */}
              <section className={`p-6 sm:p-8 space-y-6 ${theme.card}`}>
                <div className="flex items-center justify-between border-b border-current/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-purple-500/20 text-xs font-black text-purple-400">
                      2
                    </span>
                    <h2 className="text-base sm:text-lg font-black tracking-tight">
                      Masterclass Cover Artwork
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono opacity-70">PNG, JPG, WebP only • Max 8MB</span>
                </div>

                <div className="space-y-4">
                  {imageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/20 aspect-video max-w-md mx-auto shadow-2xl group">
                      <img src={imageUrl} alt="Uploaded thumbnail" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                        <label className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors shadow-lg">
                          Change Artwork
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp"
                            onChange={handleThumbnailUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-lg"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      className={`block p-8 sm:p-12 text-center cursor-pointer transition-all ${theme.dropzone}`}
                    >
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={handleThumbnailUpload}
                        disabled={isUploadingThumbnail}
                        className="hidden"
                      />
                      <div className="space-y-3">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-xl">
                          🖼️
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold">
                            {isUploadingThumbnail
                              ? `Uploading Artwork (${thumbnailProgress}%)...`
                              : 'Select high-resolution course artwork'}
                          </p>
                          <p className="text-[11px] opacity-60 mt-1">
                            Executable scripts & SVGs are blocked for sandbox safety.
                          </p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </section>

              {/* Card 3: Curriculum & Strict Video Attachments */}
              <section className={`p-6 sm:p-8 space-y-6 ${theme.card}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-current/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-purple-500/20 text-xs font-black text-purple-400">
                      3
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-black tracking-tight">
                        Curriculum & Video Content
                      </h2>
                      <p className="text-[11px] opacity-75">
                        Upload MP4 or WebM videos. Durations are extracted automatically.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSection}
                    className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto ${theme.pill}`}
                  >
                    <span>+ Add Learning Module</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {sections.map((section, sIndex) => (
                    <div
                      key={sIndex}
                      className={`p-5 sm:p-6 space-y-5 transition-all ${theme.nestedCard}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSections((prev) =>
                              prev.map((s, idx) => (idx === sIndex ? { ...s, title: val } : s))
                            );
                          }}
                          placeholder={`Module ${sIndex + 1} Title`}
                          className={`w-full px-4 py-2.5 text-xs sm:text-sm font-bold focus:outline-none ${theme.input}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(sIndex)}
                          title="Remove Module"
                          className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-all"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4 pl-1 sm:pl-3 border-l-2 border-white/10">
                        {section.lessons.map((lesson, lIndex) => {
                          const uploadId = sIndex * 1000 + lIndex;
                          const isThisUploading = isUploadingVideo === uploadId;

                          return (
                            <div
                              key={lIndex}
                              className={`p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 transition-all`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-xs font-mono opacity-60 shrink-0">
                                    {sIndex + 1}.{lIndex + 1}
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="Lecture Title (e.g. Master-Worker Architecture Deep Dive)"
                                    value={lesson.title}
                                    onChange={(e) =>
                                      handleLessonChange(sIndex, lIndex, 'title', e.target.value)
                                    }
                                    className={`w-full px-3.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none ${theme.input}`}
                                  />
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer opacity-80 hover:opacity-100">
                                    <input
                                      type="checkbox"
                                      checked={lesson.isFreePreview}
                                      onChange={(e) =>
                                        handleLessonChange(
                                          sIndex,
                                          lIndex,
                                          'isFreePreview',
                                          e.target.checked
                                        )
                                      }
                                      className="rounded"
                                    />
                                    <span>Free Preview</span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLesson(sIndex, lIndex)}
                                    title="Remove Lecture"
                                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>

                              {/* Upload media area */}
                              <div>
                                {lesson.videoUrl ? (
                                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-emerald-400 font-bold">✓</span>
                                      <div>
                                        <p className="text-xs font-bold text-emerald-300">
                                          {lesson.videoFileName || 'Playable Video Attached'}
                                        </p>
                                        <p className="text-[10px] font-mono opacity-75">
                                          Duration: {lesson.durationFormatted || `${lesson.durationMinutes}m`}
                                          {lesson.videoFileSize ? ` • Size: ${lesson.videoFileSize}` : ''}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <label className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/20 cursor-pointer transition-all">
                                        Re-upload
                                        <input
                                          type="file"
                                          accept=".mp4,.webm,.mov"
                                          onChange={(e) => handleVideoUpload(e, sIndex, lIndex)}
                                          className="hidden"
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateLessonData(sIndex, lIndex, {
                                            videoUrl: '',
                                            durationMinutes: 0,
                                            durationFormatted: '',
                                            videoFileName: '',
                                          })
                                        }
                                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-400 hover:bg-rose-500/10"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <label
                                    className={`block p-4 sm:p-5 text-center cursor-pointer transition-all ${theme.dropzone} ${
                                      isThisUploading ? 'opacity-50 pointer-events-none' : ''
                                    }`}
                                  >
                                    <input
                                      type="file"
                                      accept=".mp4,.webm,.mov"
                                      onChange={(e) => handleVideoUpload(e, sIndex, lIndex)}
                                      disabled={isThisUploading}
                                      className="hidden"
                                    />
                                    <div className="space-y-1.5">
                                      <span className="text-xl block">📹</span>
                                      <p className="text-xs font-bold">
                                        {isThisUploading
                                          ? `Uploading Video (${videoProgress}%)...`
                                          : 'Upload Lecture Video File'}
                                      </p>
                                      <p className="text-[10px] opacity-60">
                                        MP4, WebM or MOV • Duration detected automatically
                                      </p>
                                    </div>
                                    {isThisUploading && (
                                      <div className="w-full max-w-sm mx-auto bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                                        <div
                                          className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 h-full transition-all duration-300"
                                          style={{ width: `${videoProgress}%` }}
                                        />
                                      </div>
                                    )}
                                  </label>
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

              {/* Floating Bottom Bar with Save / Update Action */}
              <div
                className={`fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 backdrop-blur-2xl border-t border-white/15 shadow-[0_-12px_32px_rgba(0,0,0,0.5)] ${theme.header}`}
              >
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
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
                      onClick={editingCourseId ? handleCancelEdit : () => router.push('/dashboard')}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${theme.pill}`}
                    >
                      {editingCourseId ? 'Discard Edit' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || isUploadingVideo !== null || isUploadingThumbnail || !allLecturesHaveVideo}
                      title={!allLecturesHaveVideo ? 'Every lecture must have an uploaded video before saving' : 'Publish Course'}
                      className={`px-7 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${theme.buttonPrimary}`}
                    >
                      {loading
                        ? editingCourseId ? 'Saving Changes...' : 'Publishing Masterclass...'
                        : !allLecturesHaveVideo
                        ? `Upload Videos (${totalUploadedVideos}/${totalLessonsCount})`
                        : editingCourseId
                        ? '💾 Save Masterclass Changes'
                        : isFreeCourse
                        ? 'Publish Free Course'
                        : `Publish Paid Course (${price ? `$${price}` : '$0.00'})`}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: MY MASTERCLASSES & COURSE MANAGEMENT */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-3xl font-black tracking-tight">Your Course Portfolio</h2>
                <p className="text-xs sm:text-sm opacity-75">
                  Manage syllabus structures, edit pricing, or inspect classroom delivery.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search your courses..."
                  value={searchCourseQuery}
                  onChange={(e) => setSearchCourseQuery(e.target.value)}
                  className={`px-4 py-2.5 text-xs sm:text-sm focus:outline-none w-52 sm:w-64 ${theme.input}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    handleCancelEdit();
                    setActiveTab('create');
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shrink-0 ${theme.buttonPrimary}`}
                >
                  + New Course
                </button>
              </div>
            </div>

            {loadingCourses ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs font-bold opacity-75">Loading course catalog...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className={`p-12 text-center space-y-4 ${theme.card}`}>
                <span className="text-4xl block">🎓</span>
                <h3 className="text-lg font-black">No Masterclasses Found</h3>
                <p className="text-xs opacity-75 max-w-md mx-auto">
                  {searchCourseQuery
                    ? `No courses matching "${searchCourseQuery}". Try another keyword.`
                    : 'You have not published any masterclasses yet. Start building your first course now!'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleCancelEdit();
                    setActiveTab('create');
                  }}
                  className={`px-6 py-2.5 text-xs font-bold ${theme.buttonPrimary}`}
                >
                  Create Masterclass
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((c) => {
                  const numPrice = Number(c.price || 0);
                  const isFree = numPrice === 0;
                  const thumb = c.thumbnailUrl || c.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3';

                  return (
                    <div
                      key={c.id}
                      className={`overflow-hidden flex flex-col justify-between transition-all hover:scale-[1.01] ${theme.card}`}
                    >
                      <div>
                        {/* Course Thumbnail */}
                        <div className="relative aspect-video w-full overflow-hidden bg-black/20">
                          <img src={thumb} alt={c.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                          
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-white">
                              {c.category?.name || 'General'}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md border border-white/20 text-white">
                              {c.level}
                            </span>
                          </div>

                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <span className="text-base font-black text-white font-mono drop-shadow-md">
                              {isFree ? 'FREE' : `$${numPrice.toFixed(2)}`}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.status === 'PUBLISHED'
                                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                                  : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                        </div>

                        {/* Course Body */}
                        <div className="p-5 space-y-3">
                          <h3 className="text-sm font-black tracking-tight line-clamp-1">{c.title}</h3>
                          <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
                            {c.description || 'Comprehensive curriculum created by expert instructor.'}
                          </p>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center font-mono">
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[10px] opacity-60 block">Students</span>
                              <span className="text-xs font-black">{c.enrollmentCount || 0}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[10px] opacity-60 block">Rating</span>
                              <span className="text-xs font-black">⭐ {c.ratingAverage ? Number(c.ratingAverage).toFixed(1) : '5.0'}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[10px] opacity-60 block">Revenue</span>
                              <span className="text-xs font-black text-emerald-400">
                                ${c.revenue ? Number(c.revenue).toFixed(0) : '0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Course Action Buttons */}
                      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(c.id)}
                          disabled={loadingCourseForEdit}
                          className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${theme.pill} hover:bg-purple-500/20`}
                        >
                          ✏️ Edit Syllabus
                        </button>
                        <Link
                          href={`/courses/${c.id}`}
                          target="_blank"
                          className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${theme.pill} hover:bg-blue-500/20`}
                        >
                          👁️ Public Page
                        </Link>
                        <Link
                          href={`/courses/${c.id}/learn`}
                          className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${theme.pill} hover:bg-emerald-500/20`}
                        >
                          🎓 Classroom
                        </Link>
                        <button
                          type="button"
                          onClick={() => setCourseToDelete({ id: c.id, title: c.title })}
                          className="py-2 rounded-xl text-xs font-bold transition-all text-center text-rose-400 hover:bg-rose-500/20 border border-rose-400/20"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ANALYTICS & REVENUE DASHBOARD */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight">Instructor Analytics & Revenue</h2>
              <p className="text-xs sm:text-sm opacity-75">
                Real-time student enrollment trends, revenue yields, and lecture satisfaction ratings.
              </p>
            </div>

            {/* 4 KPI Glass Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className={`p-5 sm:p-6 space-y-2 ${theme.card}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-70">
                    Masterclasses
                  </span>
                  <span className="text-lg">📚</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
                  {myStats.totalCourses}
                </div>
                <span className="text-[11px] text-emerald-400 font-bold block">Active in catalog</span>
              </div>

              <div className={`p-5 sm:p-6 space-y-2 ${theme.card}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-70">
                    Total Students
                  </span>
                  <span className="text-lg">👥</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
                  {myStats.totalStudents.toLocaleString()}
                </div>
                <span className="text-[11px] text-blue-400 font-bold block">Enrolled learners</span>
              </div>

              <div className={`p-5 sm:p-6 space-y-2 ${theme.card}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-70">
                    Gross Revenue
                  </span>
                  <span className="text-lg">💰</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-emerald-400">
                  ${myStats.totalRevenue.toLocaleString()}
                </div>
                <span className="text-[11px] opacity-70 font-bold block">Total earnings</span>
              </div>

              <div className={`p-5 sm:p-6 space-y-2 ${theme.card}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-70">
                    Avg Student Rating
                  </span>
                  <span className="text-lg">⭐</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-amber-300">
                  {myStats.averageRating ? Number(myStats.averageRating).toFixed(1) : '5.0'}
                </div>
                <span className="text-[11px] opacity-70 font-bold block">Across all reviews</span>
              </div>
            </div>

            {/* Course Performance Breakdown Table */}
            <div className={`p-6 sm:p-8 space-y-5 ${theme.card}`}>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Masterclass Performance Breakdown</h3>
              
              {myCourses.length === 0 ? (
                <p className="text-xs opacity-75">No courses to analyze yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 opacity-70 uppercase tracking-wider text-[10px]">
                        <th className="pb-3 font-bold">Course Title</th>
                        <th className="pb-3 font-bold">Category</th>
                        <th className="pb-3 font-bold">Price</th>
                        <th className="pb-3 font-bold">Students</th>
                        <th className="pb-3 font-bold">Rating</th>
                        <th className="pb-3 font-bold">Revenue</th>
                        <th className="pb-3 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {myCourses.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 pr-4 font-bold max-w-[200px] truncate">{c.title}</td>
                          <td className="py-3.5 pr-4 opacity-80">{c.category?.name || 'General'}</td>
                          <td className="py-3.5 pr-4 font-mono">
                            {Number(c.price || 0) === 0 ? 'Free' : `$${Number(c.price).toFixed(2)}`}
                          </td>
                          <td className="py-3.5 pr-4 font-mono">{c.enrollmentCount || 0}</td>
                          <td className="py-3.5 pr-4 font-mono text-amber-300">
                            ⭐ {c.ratingAverage ? Number(c.ratingAverage).toFixed(1) : '5.0'}
                          </td>
                          <td className="py-3.5 pr-4 font-mono font-bold text-emerald-400">
                            ${c.revenue ? Number(c.revenue).toFixed(2) : '0.00'}
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(c.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/20 transition-all"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}