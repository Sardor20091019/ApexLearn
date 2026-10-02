'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUploadThing } from '../../lib/uploadthing';

interface Category {
  id: string;
  name: string;
}

interface Lesson {  
  title: string;
  videoUrl: string;
  durationMinutes: number;
  isFreePreview: boolean;
}

interface Section {
  title: string;
  lessons: Lesson[];
}

export default function InstructorStudioPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' | 'info' } | null>(null);

  // Course Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFreeCourse, setIsFreeCourse] = useState(false);
  const [price, setPrice] = useState('49.99');
  const [level, setLevel] = useState('BEGINNER');
  const [language, setLanguage] = useState('English');
  const [imageUrl, setImageUrl] = useState('');
  
  // Curriculum State
  const [sections, setSections] = useState<Section[]>([
    {
      title: 'Introduction & Foundations',
      lessons: [{ title: 'Welcome & Course Overview', videoUrl: '', durationMinutes: 5, isFreePreview: true }],
    },
  ]);

  // Upload States
  const [isUploadingVideo, setIsUploadingVideo] = useState<number | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const { startUpload: startVideoUpload } = useUploadThing("chapterVideo", {
    onUploadProgress: (p) => setVideoProgress(p),
  });

  const { startUpload: startThumbnailUpload } = useUploadThing("courseImage", {
    onUploadProgress: (p) => setThumbnailProgress(p),
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setImageUrl(res[0].url);
        setIsUploadingThumbnail(false);
        setThumbnailProgress(0);
        showToast('Thumbnail successfully uploaded!', 'success');
      }
    },
    onUploadError: (error: Error) => {
      setIsUploadingThumbnail(false);
      setThumbnailProgress(0);
      showToast(`Thumbnail upload failed: ${error.message}`, 'error');
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const checkInstructorAccess = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const profile = await res.json();
          if (profile.role !== 'INSTRUCTOR' && profile.role !== 'ADMIN') {
            router.push('/dashboard');
            return false;
          }
          return true;
        } else {
          router.push('/auth');
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
    setTimeout(() => setToast(null), 4000);
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
    setSections([...sections, { title: `Section ${sections.length + 1}`, lessons: [] }]);
  };

  const handleAddLesson = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].lessons.push({ title: '', videoUrl: '', durationMinutes: 10, isFreePreview: isFreeCourse });
    setSections(updated);
  };

  const handleLessonChange = (sectionIndex: number, lessonIndex: number, field: keyof Lesson, value: any) => {
    const updated = [...sections];
    updated[sectionIndex].lessons[lessonIndex] = {
      ...updated[sectionIndex].lessons[lessonIndex],
      [field]: value,
    };
    setSections(updated);
  };

  const handleRemoveLesson = (sectionIndex: number, lessonIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].lessons.splice(lessonIndex, 1);
    setSections(updated);
  };

  const handleRemoveSection = (sectionIndex: number) => {
    if (sections.length === 1) {
      showToast('Course must have at least one section.', 'error');
      return;
    }
    const updated = [...sections];
    updated.splice(sectionIndex, 1);
    setSections(updated);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingThumbnail(true);
    setThumbnailProgress(0);
    showToast('Uploading course thumbnail image...', 'info');
    await startThumbnailUpload(Array.from(files));
  };

  const handleRealVideoUpload = async (sectionIndex: number, lessonIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadKey = sectionIndex * 100 + lessonIndex;
    setIsUploadingVideo(uploadKey);
    setVideoProgress(0);
    showToast('Uploading chapter video to secure storage...', 'info');

    try {
      const res = await startVideoUpload(Array.from(files));
      if (res && res[0]) {
        handleLessonChange(sectionIndex, lessonIndex, 'videoUrl', res[0].url);
        showToast('Video successfully uploaded & processed!', 'success');
      }
    } catch (error: any) {
      showToast(`Video upload failed: ${error.message}`, 'error');
    } finally {
      setIsUploadingVideo(null);
      setVideoProgress(0);
    }
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a course title.', 'error');
      return;
    }

    let finalPrice = 0;
    if (!isFreeCourse) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0.50 || parsedPrice > 500.00) {
        showToast('Paid courses must be priced between $0.50 and $500.00.', 'error');
        return;
      }
      finalPrice = parsedPrice;
    }

    setLoading(true);
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish course');

      showToast(isFreeCourse ? 'Free course successfully published!' : 'Course successfully published to catalog!', 'success');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      showToast(err.message || 'Error publishing course.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalLessonsCount = sections.reduce((acc, s) => acc + s.lessons.length, 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-sans antialiased pb-24">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-[#34592B] text-white border-[#274420]' :
          toast.type === 'error' ? 'bg-[#8C3A3A] text-white border-[#6B2C2C]' :
          'bg-[#3E3228] text-[#FAF7F2] border-[#2C231C]'
        }`}>
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#F3EEE7]/90 backdrop-blur-md border-b border-[#E3DACF] px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="h-10 w-10 rounded-xl bg-[#3E3228] flex items-center justify-center font-bold text-sm text-[#FAF7F2] shadow-sm">
            IS
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-stone-900 block leading-tight">Instructor Studio</span>
            <span className="text-[10px] text-[#8C6D53] font-bold uppercase tracking-widest block">Course Creation Suite</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-stone-700 hover:text-stone-900 px-4 py-2 rounded-lg bg-[#FAF7F2] border border-[#D8CEBF] hover:bg-[#EBE3D7] transition-all"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-6 pt-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Publish a New Course</h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            Create professional curriculums, configure pricing models, and publish your expertise to students worldwide.
          </p>
        </div>

        <form onSubmit={handleSubmitCourse} className="space-y-8">
          
          {/* SECTION 1: LANDING PAGE & METADATA */}
          <div className="bg-[#F3EEE7] border border-[#E3DACF] rounded-2xl p-7 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E3DACF] pb-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900">1. Course Landing Page Information</h2>
                <p className="text-xs text-stone-500 mt-0.5">Provide foundational metadata displayed in the course catalog.</p>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                isFreeCourse ? 'bg-[#E3EFE0] text-[#34592B] border-[#C6DCBF]' : 'bg-[#E8DFD5] text-[#5C4532] border-[#D1C3B2]'
              }`}>
                {isFreeCourse ? '✨ Free Course' : '💎 Paid Course'}
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Course Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Master Next.js 15 & Enterprise Architecture"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-4 py-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8C6D53] focus:ring-1 focus:ring-[#8C6D53]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Description *</label>
                <textarea
                  placeholder="Comprehensive overview, prerequisites, and learning outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-4 py-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8C6D53] focus:ring-1 focus:ring-[#8C6D53] h-32 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-4 py-3 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D53]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Pricing Model */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-700">Pricing Model *</label>
                    <label className="flex items-center gap-2 cursor-pointer bg-[#FAF7F2] border border-[#D8CEBF] px-3 py-1.5 rounded-lg hover:bg-[#EBE3D7] transition-all">
                      <input
                        type="checkbox"
                        checked={isFreeCourse}
                        onChange={(e) => handleFreeToggle(e.target.checked)}
                        className="rounded border-stone-300 text-[#3E3228] focus:ring-[#3E3228] h-4 w-4"
                      />
                      <span className="text-xs font-bold text-stone-800">Make course FREE</span>
                    </label>
                  </div>

                  {!isFreeCourse ? (
                    <div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-xs font-bold text-stone-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.50"
                          max="500.00"
                          placeholder="49.99"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required={!isFreeCourse}
                          className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl pl-8 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D53]"
                        />
                      </div>
                      <p className="text-[10px] text-stone-500 mt-1 flex items-center justify-between">
                        <span>Allowed range: $0.50 – $500.00</span>
                        <button
                          type="button"
                          onClick={() => handleFreeToggle(true)}
                          className="text-[#8C6D53] font-bold hover:underline"
                        >
                          Switch to Free
                        </button>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#E3EFE0] border border-[#C6DCBF] rounded-xl px-4 py-3 text-xs text-[#34592B] font-bold flex items-center justify-between">
                      <span>✨ Free Course Mode Active</span>
                      <span className="font-mono">$0.00</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-4 py-3 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D53]"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="EXPERT">Expert</option>
                    <option value="ALL">All Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-4 py-3 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D53]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Thumbnail Image</label>
                  <div className="flex items-center gap-2">
                    {/* LOCKED/READONLY THUMBNAIL URL INPUT */}
                    <input
                      type="url"
                      placeholder="Upload image via button →"
                      value={imageUrl}
                      readOnly
                      title="Thumbnail URL is locked and populated automatically via upload."
                      className="flex-1 bg-[#EBE3D7]/60 border border-[#D8CEBF] rounded-xl px-3.5 py-3 text-xs text-stone-600 font-mono cursor-not-allowed focus:outline-none"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      id="thumbnail-upload"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className={`bg-[#FAF7F2] hover:bg-[#3E3228] hover:text-[#FAF7F2] border border-[#D8CEBF] px-3.5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${isUploadingThumbnail ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isUploadingThumbnail ? `${thumbnailProgress}%` : 'Upload'}
                    </label>
                  </div>

                  {isUploadingThumbnail && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-stone-500">
                        <span>Uploading Thumbnail...</span>
                        <span>{thumbnailProgress}%</span>
                      </div>
                      <div className="w-full bg-[#E3DACF] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#3E3228] h-full transition-all duration-300" style={{ width: `${thumbnailProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CURRICULUM & VIDEOS */}
          <div className="bg-[#F3EEE7] border border-[#E3DACF] rounded-2xl p-7 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E3DACF] pb-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900">2. Course Curriculum & Video Uploads</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Organize your syllabus into sections and lecture modules ({sections.length} sections, {totalLessonsCount} lessons).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                className="bg-[#FAF7F2] hover:bg-[#EBE3D7] text-stone-900 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-[#D8CEBF] shadow-xs"
              >
                + Add Section
              </button>
            </div>

            <div className="space-y-6">
              {sections.map((section, sIndex) => (
                <div key={sIndex} className="bg-[#FAF7F2] border border-[#E3DACF] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="h-6 w-6 rounded-lg bg-[#E8DFD5] flex items-center justify-center text-xs font-bold text-stone-700">
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
                        className="flex-1 bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#8C6D53]"
                        placeholder="Section Title"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sIndex)}
                      className="text-xs font-bold text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all"
                    >
                      Delete Section
                    </button>
                  </div>

                  {/* Lessons */}
                  <div className="space-y-3 pl-4 border-l-2 border-[#8C6D53]/30">
                    {section.lessons.map((lesson, lIndex) => {
                      const uploadKey = sIndex * 100 + lIndex;
                      const isThisUploading = isUploadingVideo === uploadKey;

                      return (
                        <div key={lIndex} className="bg-[#F3EEE7] border border-[#E3DACF] rounded-xl p-4 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Lesson {lIndex + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLesson(sIndex, lIndex)}
                              className="text-[11px] text-rose-700 hover:underline font-semibold"
                            >
                              Remove Lesson
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                placeholder="Lesson Title"
                                value={lesson.title}
                                onChange={(e) => handleLessonChange(sIndex, lIndex, 'title', e.target.value)}
                                required
                                className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D53]"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                placeholder="Duration (mins)"
                                value={lesson.durationMinutes}
                                onChange={(e) => handleLessonChange(sIndex, lIndex, 'durationMinutes', parseInt(e.target.value) || 0)}
                                className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D53]"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#E3DACF]">
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                {/* LOCKED/READONLY VIDEO URL INPUT */}
                                <input
                                  type="text"
                                  placeholder="Upload video file via button →"
                                  value={lesson.videoUrl}
                                  readOnly
                                  title="Video URL is locked and populated automatically via upload."
                                  className="flex-1 bg-[#EBE3D7]/60 border border-[#D8CEBF] rounded-lg px-3 py-2 text-[11px] font-mono text-stone-600 cursor-not-allowed focus:outline-none"
                                />
                                
                                <input
                                  type="file"
                                  accept="video/*"
                                  id={`video-upload-${sIndex}-${lIndex}`}
                                  className="hidden"
                                  onChange={(e) => handleRealVideoUpload(sIndex, lIndex, e)}
                                />

                                <label
                                  htmlFor={`video-upload-${sIndex}-${lIndex}`}
                                  className={`bg-[#FAF7F2] hover:bg-[#3E3228] hover:text-[#FAF7F2] border border-[#D8CEBF] px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${isThisUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                  {isThisUploading ? `Uploading (${videoProgress}%)` : 'Upload Video'}
                                </label>
                              </div>

                              {isThisUploading && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-stone-500">
                                    <span>Uploading lesson video...</span>
                                    <span>{videoProgress}%</span>
                                  </div>
                                  <div className="w-full bg-[#E3DACF] h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-[#3E3228] h-full transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>

                            <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer select-none self-start sm:self-center">
                              <input
                                type="checkbox"
                                checked={isFreeCourse ? true : lesson.isFreePreview}
                                disabled={isFreeCourse}
                                onChange={(e) => handleLessonChange(sIndex, lIndex, 'isFreePreview', e.target.checked)}
                                className="rounded border-stone-300 text-[#3E3228] focus:ring-[#3E3228]"
                              />
                              {isFreeCourse ? 'Free Course Lesson' : 'Free Preview'}
                            </label>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddLesson(sIndex)}
                      className="text-xs font-bold text-[#8C6D53] hover:underline pt-2 block"
                    >
                      + Add Lesson to Section
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="bg-[#F3EEE7] hover:bg-[#EBE3D7] text-stone-700 border border-[#D8CEBF] px-6 py-3.5 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#3E3228] hover:bg-[#2C231C] text-[#FAF7F2] px-8 py-3.5 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Publishing Course...' : isFreeCourse ? 'Publish Free Course' : 'Publish Paid Course'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}