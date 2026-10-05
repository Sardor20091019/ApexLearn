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

export default function MobileInstructorStudioPage() {
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
    showToast('Uploading chapter video...', 'info');

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

      showToast(isFreeCourse ? 'Free course successfully published!' : 'Course published to catalog!', 'success');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      showToast(err.message || 'Error publishing course.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalLessonsCount = sections.reduce((acc, s) => acc + s.lessons.length, 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-950 font-sans antialiased pb-32">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-[#34592B] text-white border-[#274420]' :
          toast.type === 'error' ? 'bg-[#8C3A3A] text-white border-[#6B2C2C]' :
          'bg-[#3E3228] text-[#FAF7F2] border-[#2C231C]'
        }`}>
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0"></span>
          <span className="leading-tight">{toast.msg}</span>
        </div>
      )}

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 bg-[#F3EEE7]/95 backdrop-blur-md border-b border-[#E3DACF] px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="h-9 w-9 rounded-xl bg-[#3E3228] flex items-center justify-center font-bold text-xs text-[#FAF7F2]">
            IS
          </div>
          <div>
            <span className="font-bold text-xs tracking-tight text-stone-900 block leading-tight">Instructor Studio</span>
            <span className="text-[9px] text-[#8C6D53] font-bold uppercase tracking-widest block">Mobile Edition</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs font-bold text-stone-700 px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#D8CEBF]"
        >
          ← Dashboard
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">New Course Studio</h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            Configure your curriculum, pricing model, and lecture videos directly from your mobile device.
          </p>
        </div>

        <form onSubmit={handleSubmitCourse} className="space-y-6">
          
          {/* SECTION 1: LANDING PAGE & METADATA */}
          <div className="bg-[#F3EEE7] border border-[#E3DACF] rounded-2xl p-5 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E3DACF] pb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">1. Course Details</h2>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                isFreeCourse ? 'bg-[#E3EFE0] text-[#34592B] border-[#C6DCBF]' : 'bg-[#E8DFD5] text-[#5C4532] border-[#D1C3B2]'
              }`}>
                {isFreeCourse ? 'Free' : 'Paid'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Course Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js 15 Mastery"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-3.5 py-3 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D53]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Description *</label>
                <textarea
                  placeholder="Course overview and learning outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-3.5 py-3 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D53] h-28 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-3.5 py-3 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D53]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Pricing Model */}
              <div className="space-y-3 bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">Pricing Model</label>
                  <label className="flex items-center gap-2 cursor-pointer bg-[#F3EEE7] border border-[#D8CEBF] px-3 py-1.5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={isFreeCourse}
                      onChange={(e) => handleFreeToggle(e.target.checked)}
                      className="rounded border-stone-300 text-[#3E3228] h-4 w-4"
                    />
                    <span className="text-xs font-bold text-stone-800">Free Course</span>
                  </label>
                </div>

                {!isFreeCourse ? (
                  <div className="space-y-1">
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
                        className="w-full bg-[#F3EEE7] border border-[#D8CEBF] rounded-xl pl-8 pr-4 py-3 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D53]"
                      />
                    </div>
                    <p className="text-[10px] text-stone-500 flex justify-between px-1">
                      <span>Range: $0.50 - $500.00</span>
                      <button type="button" onClick={() => handleFreeToggle(true)} className="text-[#8C6D53] font-bold">Make Free</button>
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#E3EFE0] border border-[#C6DCBF] rounded-xl px-3.5 py-2.5 text-xs text-[#34592B] font-bold flex items-center justify-between">
                    <span>Free Mode Active</span>
                    <span className="font-mono">$0.00</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-3 py-3 text-xs text-stone-900"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="EXPERT">Expert</option>
                    <option value="ALL">All Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-3 py-3 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Thumbnail Image</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Upload image file →"
                    value={imageUrl}
                    readOnly
                    className="flex-1 bg-[#EBE3D7]/60 border border-[#D8CEBF] rounded-xl px-3 py-2.5 text-[11px] font-mono text-stone-600 cursor-not-allowed truncate"
                  />
                  <input type="file" accept="image/*" id="thumb-up" className="hidden" onChange={handleThumbnailUpload} />
                  <label
                    htmlFor="thumb-up"
                    className={`bg-[#FAF7F2] hover:bg-[#3E3228] hover:text-[#FAF7F2] border border-[#D8CEBF] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${isUploadingThumbnail ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {isUploadingThumbnail ? `${thumbnailProgress}%` : 'Upload'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CURRICULUM & VIDEOS */}
          <div className="bg-[#F3EEE7] border border-[#E3DACF] rounded-2xl p-5 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E3DACF] pb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">2. Curriculum ({totalLessonsCount})</h2>
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                className="bg-[#FAF7F2] hover:bg-[#EBE3D7] text-stone-900 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#D8CEBF]"
              >
                + Section
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section, sIndex) => (
                <div key={sIndex} className="bg-[#FAF7F2] border border-[#E3DACF] rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-[#E8DFD5] flex items-center justify-center text-xs font-bold text-stone-700 shrink-0">
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
                      className="flex-1 bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-3 py-2 text-xs font-bold text-stone-900"
                      placeholder="Section Title"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sIndex)}
                      className="text-rose-700 font-bold text-xs p-2"
                      title="Delete Section"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Lessons */}
                  <div className="space-y-3 pl-3 border-l-2 border-[#8C6D53]/30">
                    {section.lessons.map((lesson, lIndex) => {
                      const uploadKey = sIndex * 100 + lIndex;
                      const isThisUploading = isUploadingVideo === uploadKey;

                      return (
                        <div key={lIndex} className="bg-[#F3EEE7] border border-[#E3DACF] rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-stone-500 uppercase">Lesson {lIndex + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLesson(sIndex, lIndex)}
                              className="text-[11px] text-rose-700 font-semibold"
                            >
                              Remove
                            </button>
                          </div>

                          <input
                            type="text"
                            placeholder="Lesson Title"
                            value={lesson.title}
                            onChange={(e) => handleLessonChange(sIndex, lIndex, 'title', e.target.value)}
                            required
                            className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-lg px-3 py-2 text-xs text-stone-900"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-stone-500 font-bold block mb-1">Duration (min)</label>
                              <input
                                type="number"
                                value={lesson.durationMinutes}
                                onChange={(e) => handleLessonChange(sIndex, lIndex, 'durationMinutes', parseInt(e.target.value) || 0)}
                                className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-lg px-3 py-2 text-xs text-stone-900"
                              />
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-1.5 text-[11px] font-medium text-stone-700 cursor-pointer pb-2">
                                <input
                                  type="checkbox"
                                  checked={isFreeCourse ? true : lesson.isFreePreview}
                                  disabled={isFreeCourse}
                                  onChange={(e) => handleLessonChange(sIndex, lIndex, 'isFreePreview', e.target.checked)}
                                  className="rounded border-stone-300 text-[#3E3228]"
                                />
                                Free Preview
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-[#E3DACF]">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Upload video file →"
                                value={lesson.videoUrl}
                                readOnly
                                className="flex-1 bg-[#EBE3D7]/60 border border-[#D8CEBF] rounded-lg px-2.5 py-2 text-[10px] font-mono text-stone-600 truncate"
                              />
                              <input
                                type="file"
                                accept="video/*"
                                id={`vid-${sIndex}-${lIndex}`}
                                className="hidden"
                                onChange={(e) => handleRealVideoUpload(sIndex, lIndex, e)}
                              />
                              <label
                                htmlFor={`vid-${sIndex}-${lIndex}`}
                                className={`bg-[#FAF7F2] hover:bg-[#3E3228] hover:text-[#FAF7F2] border border-[#D8CEBF] px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${isThisUploading ? 'opacity-50 pointer-events-none' : ''}`}
                              >
                                {isThisUploading ? `${videoProgress}%` : 'Video'}
                              </label>
                            </div>
                            {isThisUploading && (
                              <div className="w-full bg-[#E3DACF] h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#3E3228] h-full transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddLesson(sIndex)}
                      className="text-xs font-bold text-[#8C6D53] pt-1 block"
                    >
                      + Add Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STICKY BOTTOM ACTION BAR FOR MOBILE */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#F3EEE7]/95 backdrop-blur-md border-t border-[#E3DACF] px-4 py-3 flex items-center gap-3 shadow-lg">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-[#FAF7F2] hover:bg-[#EBE3D7] text-stone-700 border border-[#D8CEBF] py-3 rounded-xl text-xs font-bold transition-all text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 bg-[#3E3228] hover:bg-[#2C231C] text-[#FAF7F2] py-3 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 text-center"
            >
              {loading ? 'Publishing...' : isFreeCourse ? 'Publish Free Course' : 'Publish Paid Course'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}