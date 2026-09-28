// app/courses/[courseId]/learn/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  content?: string;
  duration?: string;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  sections?: Section[];
}

interface VideoNote {
  id: string;
  timestamp: number;
  formattedTime: string;
  text: string;
  createdAt: string;
}

type FilterPreset = 'none' | 'cinema' | 'cyberpunk' | 'noir' | 'hdr' | 'vintage';
type AudioEqPreset = 'flat' | 'bass' | 'vocal' | 'surround';

export default function CourseLearnPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Audio & Video Core Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ambientCanvasRef = useRef<HTMLCanvasElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio API Pipeline Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  // Player Engine State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bufferedProgress, setBufferedProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 0 to 3.0 (300% boost)
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState('1080p Ultra');

  // Video Scrub Dragging
  const [isScrubbing, setIsScrubbing] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Post-Processing Filters & Visual Effects
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [activePreset, setActivePreset] = useState<FilterPreset>('none');
  const [ambientOpacity, setAmbientOpacity] = useState(75);

  // Audio EQ Preset State
  const [audioPreset, setAudioPreset] = useState<AudioEqPreset>('flat');

  // Gestures & Double-Tap HUD Ripples
  const [gestureRipple, setGestureRipple] = useState<{ side: 'left' | 'right'; label: string } | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // UI Panels & Drawer Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'fx' | 'resources'>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'fx' | 'speed' | 'audio' | 'quality'>('fx');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Notes System State
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [noteInput, setNoteInput] = useState('');

  // Course Progress & Completion Tracking
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  // Timeline Hover Indicator
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  // HUD Keypress Notification Badge
  const [hudNotice, setHudNotice] = useState<string | null>(null);
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Instructor Form States
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [creating, setCreating] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const triggerHud = useCallback((text: string) => {
    setHudNotice(text);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => setHudNotice(null), 1000);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const triggerGestureRipple = (side: 'left' | 'right', label: string) => {
    setGestureRipple({ side, label });
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => setGestureRipple(null), 650);
  };

  // Real-time Canvas GPU Ambient Glow Engine
  useEffect(() => {
    let animId: number;
    const renderAmbient = () => {
      if (
        videoRef.current &&
        ambientCanvasRef.current &&
        !videoRef.current.paused &&
        !videoRef.current.ended &&
        ambientOpacity > 0
      ) {
        const ctx = ambientCanvasRef.current.getContext('2d');
        if (ctx) {
          try {
            ctx.drawImage(
              videoRef.current,
              0,
              0,
              ambientCanvasRef.current.width,
              ambientCanvasRef.current.height
            );
          } catch {
            // Ignore cross-origin stream canvas restrictions
          }
        }
      }
      animId = requestAnimationFrame(renderAmbient);
    };

    if (isPlaying && ambientOpacity > 0) {
      animId = requestAnimationFrame(renderAmbient);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, ambientOpacity]);

  // Web Audio Context & Hardware Equalizer Initialization
  const initAudioBooster = useCallback(() => {
    if (audioCtxRef.current || !videoRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(videoRef.current);
      const gainNode = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();

      filterNode.type = 'peaking';
      filterNode.frequency.value = 1000;
      filterNode.gain.value = 0;

      source.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gainNode;
      filterNodeRef.current = filterNode;
    } catch {
      // Node already linked
    }
  }, []);

  // Equalizer Preset Switcher
  const applyAudioPreset = useCallback((preset: AudioEqPreset) => {
    setAudioPreset(preset);
    if (!filterNodeRef.current) return;
    switch (preset) {
      case 'bass':
        filterNodeRef.current.type = 'lowshelf';
        filterNodeRef.current.frequency.value = 250;
        filterNodeRef.current.gain.value = 8;
        break;
      case 'vocal':
        filterNodeRef.current.type = 'peaking';
        filterNodeRef.current.frequency.value = 2500;
        filterNodeRef.current.gain.value = 6;
        break;
      case 'surround':
        filterNodeRef.current.type = 'highshelf';
        filterNodeRef.current.frequency.value = 4000;
        filterNodeRef.current.gain.value = 5;
        break;
      default:
        filterNodeRef.current.gain.value = 0;
        break;
    }
    triggerHud(`EQ: ${preset.toUpperCase()}`);
  }, [triggerHud]);

  // Fetch Course Data
  const fetchCourseContent = async (token: string, preserveSelectedSection = false) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_URL}/courses/${courseId}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch streaming catalog.');
      const data = await res.json();
      setCourse(data);

      if (data.sections && data.sections.length > 0) {
        if (!preserveSelectedSection || !selectedSectionId) {
          setSelectedSectionId(data.sections[0].id);
        }
        if (data.sections[0].lessons?.length > 0 && !activeLesson) {
          setActiveLesson(data.sections[0].lessons[0]);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Catalog server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = (payload.role || payload.userRole || payload.type || '').toString().toUpperCase();
      if (role === 'INSTRUCTOR' || role === 'ADMIN' || payload.isAdmin || payload.isInstructor) {
        setIsInstructor(true);
      }
    } catch (e) {
      console.error('Failed to parse token', e);
    }

    if (courseId) {
      fetchCourseContent(token);
    }
  }, [courseId, router, API_URL]);

  // Load Saved Notes & Completion Progress from localStorage
  useEffect(() => {
    if (!activeLesson?.id) return;
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setIsWaiting(false);
    setShowSettings(false);

    const savedNotes = localStorage.getItem(`lesson_notes_${activeLesson.id}`);
    if (savedNotes) {
      try { setNotes(JSON.parse(savedNotes)); } catch {}
    } else {
      setNotes([]);
    }

    const savedCompletion = localStorage.getItem(`course_completed_${courseId}`);
    if (savedCompletion) {
      try { setCompletedLessons(JSON.parse(savedCompletion)); } catch {}
    }
  }, [activeLesson, courseId]);

  // Auto-hide Controls Overlay Timer
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !showSettings && !isScrubbing) {
        setShowControls(false);
      }
    }, 2800);
  }, [showSettings, isScrubbing]);

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    initAudioBooster();
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        triggerHud('PLAY');
      }).catch(() => showToast('Playback blocked by browser settings'));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerHud('PAUSE');
    }
  }, [initAudioBooster, triggerHud]);

  // Video Time & Buffer Update Listener
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    setCurrentTime(current);
    setDuration(dur);
    setProgress((current / dur) * 100 || 0);

    // Calculate Stream Buffer Range
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBufferedProgress((bufferedEnd / dur) * 100 || 0);
    }

    // Auto mark lesson as completed at 90% progress
    if (dur > 0 && current / dur >= 0.9 && activeLesson?.id) {
      setCompletedLessons((prev) => {
        if (prev[activeLesson.id]) return prev;
        const updated = { ...prev, [activeLesson.id]: true };
        localStorage.setItem(`course_completed_${courseId}`, JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Timeline Drag & Scrub Engine
  const calculateScrubPosition = (e: React.MouseEvent | MouseEvent | TouchEvent) => {
    if (!timelineRef.current || !duration) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pos;
  };

  const handleScrubStart = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    const pos = calculateScrubPosition(e);
    if (videoRef.current && duration) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  useEffect(() => {
    const handleScrubMove = (e: MouseEvent | TouchEvent) => {
      if (!isScrubbing || !videoRef.current || !duration) return;
      const pos = calculateScrubPosition(e);
      videoRef.current.currentTime = pos * duration;
      setProgress(pos * 100);
    };

    const handleScrubEnd = () => {
      if (isScrubbing) {
        setIsScrubbing(false);
      }
    };

    if (isScrubbing) {
      window.addEventListener('mousemove', handleScrubMove);
      window.addEventListener('mouseup', handleScrubEnd);
      window.addEventListener('touchmove', handleScrubMove);
      window.addEventListener('touchend', handleScrubEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleScrubMove);
      window.removeEventListener('mouseup', handleScrubEnd);
      window.removeEventListener('touchmove', handleScrubMove);
      window.removeEventListener('touchend', handleScrubEnd);
    };
  }, [isScrubbing, duration]);

  const handleProgressBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const pos = calculateScrubPosition(e);
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  // Screen Click & Gesture Handler (Disambiguates Single vs Double Clicks)
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      // Screen Double-Tap Gesture
      if (clickX < width * 0.35) {
        skipTime(-10);
        triggerGestureRipple('left', '-10s');
      } else if (clickX > width * 0.65) {
        skipTime(10);
        triggerGestureRipple('right', '+10s');
      } else {
        toggleFullscreen();
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        togglePlay();
        clickTimeoutRef.current = null;
      }, 260);
    }
  };

  // Audio Control with Hardware Boost (up to 300%)
  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (videoRef.current) {
      if (val > 1) {
        videoRef.current.volume = 1;
        if (gainNodeRef.current) gainNodeRef.current.gain.value = val;
      } else {
        videoRef.current.volume = val;
        if (gainNodeRef.current) gainNodeRef.current.gain.value = 1;
      }
      const muted = val === 0;
      videoRef.current.muted = muted;
      setIsMuted(muted);
    }
  };

  const toggleMute = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      triggerHud('MUTED');
    } else {
      triggerHud(`${Math.round(volume * 100)}% VOL`);
    }
  }, [isMuted, volume, triggerHud]);

  // Picture in Picture Toggle
  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
        triggerHud('PIP OFF');
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
        triggerHud('PIP ON');
      } else {
        showToast('Picture-in-Picture not supported on this device.');
      }
    } catch {
      showToast('Picture-in-Picture window active');
    }
  }, [triggerHud]);

  // Fullscreen Toggle
  const toggleFullscreen = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      await playerContainerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Frame Snapshot Capture
  const captureFrame = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1920;
    canvas.height = videoRef.current.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      try {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `Snapshot_${activeLesson?.title || 'Episode'}_${Math.floor(currentTime)}s.png`;
        a.click();
        triggerHud('4K SNAPSHOT SAVED');
      } catch {
        showToast('Snapshot blocked by stream CORS policy.');
      }
    }
  }, [activeLesson, currentTime, triggerHud]);

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackRate(speed);
    triggerHud(`${speed}x Speed`);
  };

  const skipTime = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
    triggerHud(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
  }, [triggerHud]);

  // Dynamic CSS Filter Calculations
  const getFilterStyle = () => {
    let presetCSS = '';
    switch (activePreset) {
      case 'cinema':
        presetCSS = 'contrast(125%) saturate(130%) sepia(12%)';
        break;
      case 'cyberpunk':
        presetCSS = 'contrast(135%) saturate(180%) hue-rotate(-15deg)';
        break;
      case 'noir':
        presetCSS = 'grayscale(100%) contrast(145%)';
        break;
      case 'hdr':
        presetCSS = 'contrast(130%) saturate(140%) brightness(108%)';
        break;
      case 'vintage':
        presetCSS = 'sepia(40%) contrast(115%) brightness(95%)';
        break;
      default:
        presetCSS = '';
    }
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${presetCSS}`;
  };

  // Keyboard Hotkeys Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          handleMouseMove();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'c':
          e.preventDefault();
          setIsCinemaMode(prev => !prev);
          triggerHud(!isCinemaMode ? 'THEATER MODE' : 'NORMAL STAGE');
          break;
        case 'p':
          e.preventDefault();
          togglePiP();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 's':
          e.preventDefault();
          captureFrame();
          break;
        case 'l':
          e.preventDefault();
          skipTime(10);
          handleMouseMove();
          break;
        case 'j':
          e.preventDefault();
          skipTime(-10);
          handleMouseMove();
          break;
        case 'arrowright':
          e.preventDefault();
          skipTime(5);
          handleMouseMove();
          break;
        case 'arrowleft':
          e.preventDefault();
          skipTime(-5);
          handleMouseMove();
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(3.0, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case ',':
          e.preventDefault();
          skipTime(-0.04); // Frame back
          break;
        case '.':
          e.preventDefault();
          skipTime(0.04); // Frame forward
          break;
        case '?':
          e.preventDefault();
          setShowShortcutsModal(prev => !prev);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, togglePiP, toggleMute, captureFrame, skipTime, handleMouseMove, isCinemaMode, volume, triggerHud]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handlePiPChange = () => setIsPiP(!!document.pictureInPictureElement);

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('leavepictureinpicture', handlePiPChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Interactive Note Management
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !activeLesson?.id) return;

    const newNote: VideoNote = {
      id: Date.now().toString(),
      timestamp: currentTime,
      formattedTime: formatTime(currentTime),
      text: noteInput.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem(`lesson_notes_${activeLesson.id}`, JSON.stringify(updated));
    setNoteInput('');
    showToast('Note added at current timestamp!');
  };

  const jumpToTimestamp = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    if (videoRef.current.paused) videoRef.current.play();
    triggerHud(`JUMPED TO ${formatTime(seconds)}`);
  };

  const deleteNote = (noteId: string) => {
    if (!activeLesson?.id) return;
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    localStorage.setItem(`lesson_notes_${activeLesson.id}`, JSON.stringify(updated));
  };

  // Course Progress Stats
  const courseStats = useMemo(() => {
    if (!course?.sections) return { total: 0, completed: 0, percent: 0 };
    let total = 0;
    let completed = 0;
    course.sections.forEach(sec => {
      sec.lessons?.forEach(les => {
        total++;
        if (completedLessons[les.id]) completed++;
      });
    });
    return {
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [course, completedLessons]);

  const getNextLesson = (): Lesson | null => {
    if (!course?.sections || !activeLesson) return null;
    let foundCurrent = false;
    for (const sec of course.sections) {
      for (const les of sec.lessons || []) {
        if (foundCurrent) return les;
        if (les.id === activeLesson.id) foundCurrent = true;
      }
    }
    return null;
  };

  const nextLesson = getNextLesson();

  // Filtered Lessons Search Engine
  const filteredSections = useMemo(() => {
    if (!course?.sections) return [];
    if (!searchQuery.trim()) return course.sections;

    return course.sections.map(section => ({
      ...section,
      lessons: section.lessons.filter(les =>
        les.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        les.content?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter(section => section.lessons.length > 0);
  }, [course, searchQuery]);

  // Instructor Forms
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    setCreating(true);
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newSectionTitle }),
      });
      if (!res.ok) throw new Error('Failed to add section.');
      const newSection = await res.json();
      showToast('Season added to catalog!');
      setNewSectionTitle('');
      await fetchCourseContent(token!, true);
      if (newSection?.id) setSelectedSectionId(newSection.id);
    } catch (err: any) {
      showToast(err.message || 'Error creating section');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim() || !selectedSectionId) return showToast('Provide episode details.');
    setCreating(true);
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/courses/sections/${selectedSectionId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newLessonTitle, videoUrl: newLessonVideoUrl, content: newLessonContent }),
      });
      if (!res.ok) throw new Error('Failed to publish episode.');
      const savedLesson = await res.json();
      showToast('Episode published live!');
      setNewLessonTitle(''); setNewLessonVideoUrl(''); setNewLessonContent('');
      await fetchCourseContent(token!, true);
      if (savedLesson) setActiveLesson(savedLesson);
    } catch (err: any) {
      showToast(err.message || 'Error creating lesson');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#020408] text-white">
        <div className="relative flex items-center justify-center">
          <div className="h-24 w-24 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_50px_rgba(6,182,212,0.4)]"></div>
          <div className="absolute h-12 w-12 border-2 border-purple-500/20 border-b-purple-400 rounded-full animate-spin flex items-center justify-center" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        <p className="mt-8 text-xs font-mono tracking-[0.4em] text-cyan-400/80 uppercase animate-pulse">Initializing Dynamic HDR Player Engine...</p>
      </div>
    );
  }

  const hasContent = course?.sections && course.sections.length > 0 && course.sections.some(s => s.lessons && s.lessons.length > 0);

  return (
    <div className="min-h-screen bg-[#020408] text-gray-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      
      {/* Toast HUD Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#080D1A]/90 text-white px-6 py-4 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-cyan-500/30 text-xs font-semibold flex items-center gap-3 backdrop-blur-2xl animate-fade-in">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span>{toast}</span>
        </div>
      )}

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setShowShortcutsModal(false)}>
          <div className="bg-[#080D1A] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span className="text-cyan-400">⌨</span> Hotkey Master Controls
              </h3>
              <button onClick={() => setShowShortcutsModal(false)} className="text-gray-400 hover:text-white text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-colors">ESC</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5"><span className="text-gray-400">Play / Pause</span><kbd className="bg-white/10 px-2 py-1 rounded font-mono text-cyan-300">Space / K</kbd></div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5"><span className="text-gray-400">Fullscreen</span><kbd className="bg-white/10 px-2 py-1 rounded font-mono text-cyan-300">F</kbd></div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5"><span className="text-gray-400">Theater Stage</span><kbd className="bg-white/10 px-2 py-1 rounded font-mono text-cyan-300">C</kbd></div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5"><span className="text-gray-400">Picture-in-Picture</span><kbd className="bg-white/10 px-2 py-1 rounded font-mono text-cyan-300">P</kbd></div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5"><span className="text-gray-400">Mute Audio</span><kbd className="bg-white/10 px-2 py-1 rounded font-mono text-cyan-300">M</kbd></div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5"><span className="text-gray-400">Take 4K Snapshot</span><kbd className="bg-white/10 px-2 py-1 rounded font-mono text-cyan-300">S</kbd></div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5"><span className="text-gray-400">Seek ±5s</span><kbd className="bg-white/10 px-2 py-1 rounded font-mono text-cyan-300">← / →</kbd></div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5"><span className="text-gray-400">Seek ±10s</span><kbd className="bg-white/10 px-2 py-1 rounded font-mono text-cyan-300">J / L</kbd></div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5"><span className="text-gray-400">Frame Back/Next</span><kbd className="bg-white/10 px-2 py-1 rounded font-mono text-cyan-300">, / .</kbd></div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5"><span className="text-gray-400">Volume Up/Down</span><kbd className="bg-white/10 px-2 py-1 rounded font-mono text-cyan-300">↑ / ↓</kbd></div>
            </div>
            <p className="text-[10px] text-gray-500 text-center font-mono uppercase tracking-widest pt-2">Press ? anytime to toggle shortcut panel</p>
          </div>
        </div>
      )}

      {/* Modern Navigation Header Bar */}
      <header className="h-[72px] bg-[#020408]/80 backdrop-blur-3xl border-b border-white/[0.06] px-6 lg:px-12 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all cursor-pointer group py-2 px-3.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/10"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-xs font-bold uppercase tracking-wider">Catalog</span>
          </button>
          
          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
          
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              Cinema Ultra Stream
            </span>
            <h1 className="text-sm font-bold text-gray-100 truncate max-w-xs sm:max-w-md tracking-tight">{course?.title || 'Ultra Stream'}</h1>
          </div>
        </div>

        {/* Global Progress Bar Badge */}
        <div className="hidden lg:flex items-center gap-3 bg-white/[0.03] px-4 py-2 rounded-2xl border border-white/[0.06]">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Course Completed</span>
            <span className="text-xs font-black text-cyan-300">{courseStats.percent}% ({courseStats.completed}/{courseStats.total})</span>
          </div>
          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${courseStats.percent}%` }}></div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-all font-mono"
            title="Hotkey Cheat Sheet"
          >
            <span className="text-cyan-400 font-black">?</span> Hotkeys
          </button>

          <button
            onClick={() => setIsCinemaMode(!isCinemaMode)}
            className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isCinemaMode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-white/5 text-gray-300 hover:bg-white/10 border-white/10'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            <span>{isCinemaMode ? 'Wide Stage' : 'Theater'}</span>
          </button>

          <button 
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </div>
      </header>

      {/* Main Grid Stage Layout */}
      <div className={`flex-1 grid transition-all duration-500 min-h-[calc(100vh-72px)] ${
        isCinemaMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'
      }`}>
        
        {/* Cinema Stage Container */}
        <div className={`p-4 sm:p-6 lg:p-8 flex flex-col justify-start transition-all duration-500 ${
          isCinemaMode ? 'col-span-1 max-w-7xl mx-auto w-full' : 'lg:col-span-3'
        }`}>
          {hasContent && activeLesson ? (
            <div className="flex-1 flex flex-col gap-8 max-w-6xl mx-auto w-full">
              
              {/* --- AWWARDS VIDEO STAGE FRAME WITH DYNAMIC AMBIENT BACKDROP --- */}
              <div className="relative group/player">
                
                {/* Real-time Dynamic GPU Ambient Light Reflector Canvas */}
                <canvas
                  ref={ambientCanvasRef}
                  width={32}
                  height={18}
                  style={{ opacity: ambientOpacity / 100 }}
                  className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] rounded-3xl blur-[100px] pointer-events-none transition-opacity duration-700 -z-10"
                />

                {/* Main Dynamic Video Frame Container */}
                <div 
                  ref={playerContainerRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => isPlaying && setShowControls(false)}
                  className={`relative w-full bg-black overflow-hidden flex items-center justify-center transition-all duration-300 select-none ${
                    isFullscreen 
                      ? 'h-screen rounded-0' 
                      : 'aspect-video rounded-3xl border border-white/10 shadow-[0_35px_100px_rgba(0,0,0,0.95)]'
                  }`}
                >
                  {activeLesson.videoUrl ? (
                    <>
                      <video
                        ref={videoRef}
                        src={activeLesson.videoUrl}
                        style={{ filter: getFilterStyle() }}
                        loop={isLooping}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setIsPlaying(false)}
                        onWaiting={() => setIsWaiting(true)}
                        onPlaying={() => { setIsWaiting(false); setIsPlaying(true); }}
                        onClick={handleScreenClick}
                        playsInline
                        className="w-full h-full object-contain cursor-pointer transition-all duration-200"
                      />

                      {/* Screen Double-Tap Animated Arc Gesture Overlay */}
                      {gestureRipple && (
                        <div className={`absolute pointer-events-none z-30 inset-y-0 w-1/3 flex items-center justify-center bg-cyan-500/10 backdrop-blur-sm transition-all animate-pulse ${
                          gestureRipple.side === 'left' ? 'left-0 rounded-r-full' : 'right-0 rounded-l-full'
                        }`}>
                          <div className="flex flex-col items-center gap-1 text-cyan-300 font-mono font-black text-sm">
                            <svg className={`w-10 h-10 ${gestureRipple.side === 'left' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
                            <span>{gestureRipple.label}</span>
                          </div>
                        </div>
                      )}

                      {/* Floating HUD Feedback Badge */}
                      {hudNotice && (
                        <div className="absolute pointer-events-none z-30 inset-0 flex items-center justify-center">
                          <div className="bg-black/85 backdrop-blur-2xl border border-cyan-500/40 text-cyan-300 font-mono text-xs tracking-widest font-black px-6 py-3 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.5)] animate-ping-short uppercase">
                            {hudNotice}
                          </div>
                        </div>
                      )}

                      {/* Screen Header Control Bar Overlay */}
                      <div className={`absolute top-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-b from-black/95 via-black/50 to-transparent transition-all duration-500 z-20 flex items-center justify-between ${
                        showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                      }`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-black">Episode Stream</span>
                            {activePreset !== 'none' && (
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase font-mono">{activePreset} FX</span>
                            )}
                            {audioPreset !== 'flat' && (
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase font-mono">{audioPreset} EQ</span>
                            )}
                          </div>
                          <h2 className="text-white text-base sm:text-lg font-extrabold tracking-tight drop-shadow-md">{activeLesson.title}</h2>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={captureFrame}
                            className="hidden sm:flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-gray-300 hover:text-white transition-all"
                            title="Capture Frame (S)"
                          >
                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h0.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span>Snapshot</span>
                          </button>
                          <span className="text-[11px] font-mono text-cyan-300 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                            {selectedQuality}
                          </span>
                        </div>
                      </div>

                      {/* Center Play/Pause Indicator Pulse */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                        {isWaiting ? (
                          <div className="h-16 w-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_30px_rgba(6,182,212,0.5)]"></div>
                        ) : (
                          <div className={`h-20 w-20 bg-black/50 backdrop-blur-2xl border border-cyan-500/30 rounded-full flex items-center justify-center text-white transition-all duration-300 transform ${
                            !isPlaying ? 'opacity-100 scale-100 shadow-[0_0_50px_rgba(6,182,212,0.3)]' : 'opacity-0 scale-150 pointer-events-none'
                          }`}>
                            <svg className="w-9 h-9 ml-1 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        )}
                      </div>

                      {/* Autoplay Next Episode Prompt */}
                      {duration > 0 && (duration - currentTime <= 8) && nextLesson && (
                        <div className="absolute bottom-24 right-8 z-30 bg-[#080D1A]/95 backdrop-blur-2xl border border-cyan-500/40 p-5 rounded-3xl shadow-2xl max-w-sm flex flex-col gap-3 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-cyan-400 font-black uppercase tracking-widest">Up Next</span>
                            <span className="text-[10px] text-gray-400">Autoplay</span>
                          </div>
                          <p className="text-xs font-bold text-white line-clamp-1">{nextLesson.title}</p>
                          <button 
                            onClick={() => setActiveLesson(nextLesson)}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                          >
                            Play Next Episode
                          </button>
                        </div>
                      )}

                      {/* Bottom Floating Control Dock */}
                      <div className={`absolute bottom-0 left-0 right-0 px-6 pb-6 pt-24 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-4 transition-all duration-500 z-20 ${
                        showControls || !isPlaying || isScrubbing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                      }`}>
                        
                        {/* Interactive Scrubbing Timeline Bar */}
                        <div 
                          ref={timelineRef}
                          onMouseDown={handleScrubStart}
                          onMouseMove={handleProgressBarHover}
                          onMouseLeave={() => setHoverTime(null)}
                          className="w-full h-4 group/progress flex items-center cursor-pointer relative"
                        >
                          {/* Hover Timestamp Indicator */}
                          {hoverTime !== null && (
                            <div 
                              className="absolute -top-10 -translate-x-1/2 bg-black/90 text-cyan-300 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border border-cyan-500/30 shadow-2xl pointer-events-none"
                              style={{ left: `${hoverPosition}%` }}
                            >
                              {formatTime(hoverTime)}
                            </div>
                          )}

                          {/* Progress Track Background */}
                          <div className="w-full h-1.5 group-hover/progress:h-2.5 bg-white/20 rounded-full transition-all duration-200 overflow-hidden relative backdrop-blur-md">
                            
                            {/* Stream Buffer Bar */}
                            <div 
                              className="absolute top-0 bottom-0 left-0 bg-white/20 rounded-full transition-all duration-300"
                              style={{ width: `${bufferedProgress}%` }}
                            ></div>

                            {/* Ghost Hover Position Marker */}
                            {hoverTime !== null && (
                              <div 
                                className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full pointer-events-none"
                                style={{ width: `${hoverPosition}%` }}
                              ></div>
                            )}

                            {/* Active Played Track */}
                            <div 
                              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full transition-all duration-75 shadow-[0_0_15px_rgba(6,182,212,0.9)]"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>

                          {/* Interactive Handle Thumb */}
                          <div 
                            className="absolute h-4 w-4 bg-white border-2 border-cyan-400 rounded-full shadow-[0_0_20px_rgba(6,182,212,1)] transform -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity duration-150 pointer-events-none"
                            style={{ left: `${progress}%` }}
                          ></div>
                        </div>

                        {/* Control Buttons Bar */}
                        <div className="flex items-center justify-between text-white">
                          
                          {/* Left Dock Controls */}
                          <div className="flex items-center gap-4 sm:gap-6">
                            
                            {/* Play / Pause Toggle */}
                            <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-transform transform hover:scale-110 active:scale-95">
                              {isPlaying ? (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                              ) : (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                              )}
                            </button>

                            {/* Skip -10s */}
                            <button onClick={() => skipTime(-10)} className="text-gray-300 hover:text-white transition-transform hover:scale-110 hidden sm:block" title="Rewind 10s (J)">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
                            </button>

                            {/* Skip +10s */}
                            <button onClick={() => skipTime(10)} className="text-gray-300 hover:text-white transition-transform hover:scale-110 hidden sm:block" title="Forward 10s (L)">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" /></svg>
                            </button>

                            {/* Dynamic Volume + Hardware Booster Slider */}
                            <div className="flex items-center group/volume h-8">
                              <button onClick={toggleMute} className="text-gray-300 hover:text-cyan-400 transition-colors mr-2">
                                {isMuted || volume === 0 ? (
                                  <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                                ) : volume > 1 ? (
                                  <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                                ) : (
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                                )}
                              </button>
                              <input 
                                type="range" min="0" max="3.0" step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                className="w-0 group-hover/volume:w-20 sm:group-hover/volume:w-28 overflow-hidden transition-all duration-300 ease-out appearance-none bg-white/20 h-1 rounded-full outline-none accent-cyan-400 cursor-pointer"
                              />
                            </div>

                            {/* Digital Timestamp Badge */}
                            <div className="flex items-center gap-1 font-mono text-xs font-semibold text-gray-400 tracking-wider">
                              <span className="text-white">{formatTime(currentTime)}</span>
                              <span className="text-gray-600">/</span>
                              <span>{formatTime(duration)}</span>
                            </div>
                          </div>

                          {/* Right Dock Controls */}
                          <div className="flex items-center gap-4 sm:gap-5">
                            
                            {/* Loop Stream */}
                            <button
                              onClick={() => { setIsLooping(!isLooping); triggerHud(isLooping ? 'LOOP OFF' : 'LOOP ON'); }}
                              className={`transition-colors ${isLooping ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                              title="Toggle Loop Stream"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>

                            {/* Floating Window (Picture-in-Picture) */}
                            <button
                              onClick={togglePiP}
                              className={`transition-colors ${isPiP ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                              title="Floating Mini Window (P)"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v2m-6 12h6a2 2 0 002-2v-6a2 2 0 00-2-2h-6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                            </button>

                            {/* Visual Effects & Audio Master Settings */}
                            <div className="relative">
                              <button 
                                onClick={() => setShowSettings(!showSettings)} 
                                className={`text-gray-300 hover:text-white transition-all transform hover:rotate-45 ${showSettings ? 'text-cyan-400' : ''}`}
                                title="Player FX & Engine Controls"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              </button>

                              {/* Glassmorphic Settings Popup */}
                              {showSettings && (
                                <div className="absolute bottom-14 right-0 w-80 bg-[#080D1A]/95 backdrop-blur-3xl border border-cyan-500/20 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden text-xs z-40">
                                  {/* Tab Selector */}
                                  <div className="flex border-b border-white/10 bg-white/[0.02]">
                                    <button onClick={() => setSettingsTab('fx')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${settingsTab === 'fx' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>Visual FX</button>
                                    <button onClick={() => setSettingsTab('speed')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${settingsTab === 'speed' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>Speed</button>
                                    <button onClick={() => setSettingsTab('audio')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${settingsTab === 'audio' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>Audio</button>
                                    <button onClick={() => setSettingsTab('quality')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${settingsTab === 'quality' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>Quality</button>
                                  </div>

                                  {/* Tab Body */}
                                  <div className="p-4 space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                                    {settingsTab === 'fx' && (
                                      <div className="space-y-3">
                                        <div className="space-y-1">
                                          <span className="text-[10px] font-mono text-gray-400 uppercase">Preset Color Grading</span>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            {(['none', 'cinema', 'cyberpunk', 'noir', 'hdr', 'vintage'] as FilterPreset[]).map(p => (
                                              <button
                                                key={p}
                                                onClick={() => { setActivePreset(p); triggerHud(`${p.toUpperCase()} FX`); }}
                                                className={`px-2.5 py-1.5 rounded-xl capitalize font-mono text-[10px] transition-all border ${
                                                  activePreset === p ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                                                }`}
                                              >
                                                {p}
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="space-y-1 pt-1 border-t border-white/5">
                                          <div className="flex justify-between text-[10px] text-gray-400">
                                            <span>Ambient Glow Glow Intensity</span>
                                            <span>{ambientOpacity}%</span>
                                          </div>
                                          <input type="range" min="0" max="100" value={ambientOpacity} onChange={(e) => setAmbientOpacity(Number(e.target.value))} className="w-full accent-cyan-400 bg-white/10 h-1 rounded-full cursor-pointer" />
                                        </div>

                                        <div className="space-y-1">
                                          <div className="flex justify-between text-[10px] text-gray-400">
                                            <span>Brightness</span>
                                            <span>{brightness}%</span>
                                          </div>
                                          <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-cyan-400 bg-white/10 h-1 rounded-full cursor-pointer" />
                                        </div>

                                        <div className="space-y-1">
                                          <div className="flex justify-between text-[10px] text-gray-400">
                                            <span>Contrast</span>
                                            <span>{contrast}%</span>
                                          </div>
                                          <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-cyan-400 bg-white/10 h-1 rounded-full cursor-pointer" />
                                        </div>

                                        <div className="space-y-1">
                                          <div className="flex justify-between text-[10px] text-gray-400">
                                            <span>Saturation</span>
                                            <span>{saturation}%</span>
                                          </div>
                                          <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full accent-cyan-400 bg-white/10 h-1 rounded-full cursor-pointer" />
                                        </div>

                                        <button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); setActivePreset('none'); setAmbientOpacity(75); }} className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] transition-colors border border-white/5">Reset All Effects</button>
                                      </div>
                                    )}

                                    {settingsTab === 'speed' && (
                                      <div className="space-y-2">
                                        {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3].map(speed => (
                                          <button 
                                            key={speed} 
                                            onClick={() => { changeSpeed(speed); setShowSettings(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${playbackRate === speed ? 'bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/30' : 'text-gray-300 hover:bg-white/5'}`}
                                          >
                                            <span>{speed === 1 ? '1.0x Normal Speed' : `${speed}x Speed`}</span>
                                            {playbackRate === speed && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>}
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {settingsTab === 'audio' && (
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <div className="flex justify-between text-[10px] text-gray-400">
                                            <span>Volume Booster (Up to 300%)</span>
                                            <span className="text-cyan-300 font-mono">{Math.round(volume * 100)}%</span>
                                          </div>
                                          <input 
                                            type="range" min="0" max="3.0" step="0.05" 
                                            value={volume} 
                                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} 
                                            className="w-full accent-cyan-400 bg-white/10 h-1 rounded-full cursor-pointer" 
                                          />
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                                          <span className="text-[10px] font-mono text-gray-400 uppercase">Hardware Equalizer Preset</span>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            {(['flat', 'bass', 'vocal', 'surround'] as AudioEqPreset[]).map(eq => (
                                              <button
                                                key={eq}
                                                onClick={() => applyAudioPreset(eq)}
                                                className={`px-2.5 py-1.5 rounded-xl capitalize font-mono text-[10px] transition-all border ${
                                                  audioPreset === eq ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                                                }`}
                                              >
                                                {eq}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {settingsTab === 'quality' && (
                                      <div className="space-y-2">
                                        {['4K Ultra HD', '1080p Ultra', '720p HD', '480p SD'].map(qual => (
                                          <button 
                                            key={qual} 
                                            onClick={() => { setSelectedQuality(qual); setShowSettings(false); triggerHud(qual); }}
                                            className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${selectedQuality === qual ? 'bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/30' : 'text-gray-300 hover:bg-white/5'}`}
                                          >
                                            <span>{qual}</span>
                                            {selectedQuality === qual && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Fullscreen Toggle */}
                            <button onClick={toggleFullscreen} className="text-gray-300 hover:text-white transition-transform hover:scale-110">
                              {isFullscreen ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                              ) : (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-white text-center p-12 space-y-4">
                      <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 text-gray-500">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </div>
                      <p className="text-lg font-bold text-gray-300">Stream Signal Offline</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-Tab Below-Player Console Panel */}
              <div className="bg-[#060A14]/80 backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
                
                {/* Navigation Tab Line */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
                  <button 
                    onClick={() => setActiveTab('overview')} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' : 'text-gray-400 hover:text-white'}`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setActiveTab('notes')} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'notes' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' : 'text-gray-400 hover:text-white'}`}
                  >
                    <span>Notes</span>
                    {notes.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-mono">{notes.length}</span>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('fx')} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'fx' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' : 'text-gray-400 hover:text-white'}`}
                  >
                    Audio & FX Studio
                  </button>
                </div>

                {/* Tab: Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-black uppercase">Currently Streaming</span>
                        <h2 className="text-2xl font-black text-white tracking-tight mt-1">{activeLesson.title}</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            const newStatus = !completedLessons[activeLesson.id];
                            const updated = { ...completedLessons, [activeLesson.id]: newStatus };
                            setCompletedLessons(updated);
                            localStorage.setItem(`course_completed_${courseId}`, JSON.stringify(updated));
                            showToast(newStatus ? 'Episode marked completed!' : 'Episode progress reset.');
                          }} 
                          className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                            completedLessons[activeLesson.id] ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span>{completedLessons[activeLesson.id] ? 'Completed' : 'Mark Completed'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed font-normal max-w-4xl border-t border-white/[0.04] pt-4">
                      {activeLesson.content || 'No detailed synopsis provided for this streaming episode.'}
                    </p>
                  </div>
                )}

                {/* Tab: Interactive Notes */}
                {activeTab === 'notes' && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddNote} className="flex gap-3">
                      <input 
                        type="text" 
                        value={noteInput} 
                        onChange={(e) => setNoteInput(e.target.value)} 
                        placeholder={`Take a note at ${formatTime(currentTime)}...`} 
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-500 outline-none transition-colors placeholder:text-gray-600 font-medium"
                      />
                      <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold px-5 py-3 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        Add Note
                      </button>
                    </form>

                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                      {notes.length === 0 ? (
                        <p className="text-xs text-gray-500 font-mono py-4 text-center">No notes captured for this episode yet.</p>
                      ) : (
                        notes.map(n => (
                          <div key={n.id} className="bg-white/[0.02] border border-white/[0.05] p-3.5 rounded-2xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => jumpToTimestamp(n.timestamp)}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                              >
                                {n.formattedTime}
                              </button>
                              <span className="text-xs text-gray-200 font-medium">{n.text}</span>
                            </div>
                            <button onClick={() => deleteNote(n.id)} className="text-gray-500 hover:text-red-400 p-1 text-xs">✕</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Audio & FX Studio Quick Adjustments */}
                {activeTab === 'fx' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 font-black">Dynamic Visual Preset</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['none', 'cinema', 'cyberpunk', 'noir', 'hdr', 'vintage'] as FilterPreset[]).map(p => (
                          <button
                            key={p}
                            onClick={() => setActivePreset(p)}
                            className={`py-2 rounded-xl uppercase font-mono text-[10px] transition-all border ${
                              activePreset === p ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 font-black">Equalizer Mode</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['flat', 'bass', 'vocal', 'surround'] as AudioEqPreset[]).map(eq => (
                          <button
                            key={eq}
                            onClick={() => applyAudioPreset(eq)}
                            className={`py-2 rounded-xl uppercase font-mono text-[10px] transition-all border ${
                              audioPreset === eq ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            {eq}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-[#080D1A] border border-white/10 rounded-3xl p-12 text-center my-auto shadow-2xl max-w-md mx-auto w-full">
              <h2 className="text-xl font-black text-white mb-2">No Media Available</h2>
              <p className="text-xs text-gray-500 mb-6">Channel is currently offline without active stream units.</p>
              
              {/* Instructor Upload Studio */}
              {isInstructor && (
                <div className="text-left bg-black/60 p-6 rounded-2xl border border-white/10 space-y-4">
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-black">Studio Console</span>
                  <form onSubmit={handleCreateSection} className="flex gap-2">
                    <input type="text" placeholder="New Season Title" value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} className="flex-1 bg-[#101422] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none transition-colors" />
                    <button type="submit" disabled={creating} className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2.5 rounded-xl text-xs font-bold transition-all">Add</button>
                  </form>
                  {course?.sections && course.sections.length > 0 && (
                    <form onSubmit={handleCreateLesson} className="space-y-3 pt-3 border-t border-white/5">
                      <select value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} className="w-full bg-[#101422] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none">
                        <option value="">Select Target Season...</option>
                        {course.sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                      <input type="text" placeholder="Episode Title" value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} className="w-full bg-[#101422] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none" />
                      <input type="text" placeholder="Direct Stream MP4 URL" value={newLessonVideoUrl} onChange={(e) => setNewLessonVideoUrl(e.target.value)} className="w-full bg-[#101422] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none" />
                      <button type="submit" disabled={creating} className="w-full bg-white text-black hover:bg-gray-200 py-3 rounded-xl text-xs font-extrabold transition-all mt-1">Publish to Stream</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Searchable Episode Sidebar Catalog */}
        <div className={`bg-[#020408] border-l border-white/[0.06] p-6 lg:p-8 overflow-y-auto custom-scrollbar transition-all ${
          isCinemaMode ? 'hidden' : showMobileSidebar ? 'fixed inset-y-0 right-0 z-50 w-80 bg-[#080D1A] border-l border-white/10 shadow-2xl' : 'hidden lg:block'
        }`}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-base font-black text-white tracking-tight">Episodes</h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">{course?.sections?.length || 0} Seasons</p>
            </div>
            {showMobileSidebar && (
              <button onClick={() => setShowMobileSidebar(false)} className="text-gray-400 hover:text-white p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Episode Search Bar */}
          <div className="mb-6">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search episodes..." 
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 outline-none placeholder:text-gray-600 transition-colors"
            />
          </div>

          <div className="space-y-8">
            {filteredSections.map((section, sIdx) => (
              <div key={section.id || sIdx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-widest">{section.title}</span>
                  <span className="text-[10px] font-mono text-gray-600">{section.lessons?.length || 0} Episodes</span>
                </div>
                
                <div className="space-y-2">
                  {section.lessons?.map((lesson, index) => {
                    const isActive = activeLesson?.id === lesson.id;
                    const isDone = completedLessons[lesson.id];
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => { setActiveLesson(lesson); setShowMobileSidebar(false); }}
                        className={`w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex gap-4 items-center group relative overflow-hidden ${
                          isActive 
                            ? 'bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent border border-cyan-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
                            : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04]'
                        }`}
                      >
                        {/* Playing Neon Bar */}
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)]"></div>}

                        <div className={`text-xs font-mono font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isActive ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-500 group-hover:text-white'
                        }`}>
                          {isDone ? (
                            '✓'
                          ) : isActive ? (
                            <svg className="w-3.5 h-3.5 fill-current animate-pulse" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                            {lesson.title}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate mt-1">
                            {lesson.content || 'Ultra Stream Stream HD'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Scrollbar & HUD Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
        @keyframes pingShort {
          0% { transform: scale(0.85); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.95; }
        }
        .animate-ping-short { animation: pingShort 0.25s cubic-bezier(0, 0, 0.2, 1) forwards; }
      `}} />
    </div>
  );
}