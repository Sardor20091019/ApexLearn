'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('49.99');
  const [level, setLevel] = useState('BEGINNER');
  const [language, setLanguage] = useState('English');
  const [imageUrl, setImageUrl] = useState('');
  
  // Curriculum State
  const [sections, setSections] = useState<Section[]>([
    {
      title: 'Introduction to the Course',
      lessons: [{ title: 'Welcome & Overview', videoUrl: '', durationMinutes: 5, isFreePreview: true }],
    },
  ]);

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const fetchCategories = async () => {
      try {
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddSection = () => {
    setSections([...sections, { title: `Section ${sections.length + 1}`, lessons: [] }]);
  };

  const handleAddLesson = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].lessons.push({ title: '', videoUrl: '', durationMinutes: 10, isFreePreview: false });
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
    const updated = [...sections];
    updated.splice(sectionIndex, 1);
    setSections(updated);
  };

  const handleSimulateVideoUpload = async (sectionIndex: number, lessonIndex: number) => {
    setIsUploadingVideo(true);
    showToast('Uploading video chunk to MinIO S3 bucket...');
    setTimeout(() => {
      handleLessonChange(sectionIndex, lessonIndex, 'videoUrl', `https://s3.amazonaws.com/courseapp-videos/lesson_${Date.now()}.mp4`);
      setIsUploadingVideo(false);
      showToast('Video uploaded & processed successfully!');
    }, 1500);
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a course title.');
      return;
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
          price: parseFloat(price) || 0,
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

      showToast('Course successfully published to PostgreSQL database!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      showToast(err.message || 'Error publishing course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] font-sans">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F1F1F] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-gray-800 text-xs font-medium flex items-center gap-3 animate-bounce">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0056D2] animate-ping"></span>
          <span>{toast}</span>
        </div>
      )}

      <header className="h-18 bg-white border-b border-gray-200 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#003087] to-[#0056D2] flex items-center justify-center font-black text-base text-white shadow-md">
            A
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-gray-900 block leading-tight">Instructor Studio</span>
            <span className="text-[10px] text-[#0056D2] font-bold uppercase tracking-widest block">Course Creator Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl bg-gray-100 transition-all"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmitCourse} className="space-y-8">
          
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 space-y-6 shadow-xs">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">1. Course Landing Page Information</h2>
              <p className="text-xs text-gray-500 mt-1">Provide the foundational metadata displayed in the course catalog.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Course Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Master NestJS & Microservices Architecture"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition-all"
                />
              </div>


              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description *</label>
                <textarea
                  placeholder="Detailed course description, prerequisites, and learning outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition-all h-32 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition-all"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pricing ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="49.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition-all"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="EXPERT">Expert</option>
                    <option value="ALL">All Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Thumbnail Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum Builder */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">2. Course Curriculum & Video Uploads</h2>
                <p className="text-xs text-gray-500 mt-1">Organize your syllabus into sections and lecture modules.</p>
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-gray-300"
              >
                + Add Section
              </button>
            </div>

            <div className="space-y-6">
              {sections.map((section, sIndex) => (
                <div key={sIndex} className="bg-gray-50/80 border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[sIndex].title = e.target.value;
                        setSections(updated);
                      }}
                      className="flex-1 bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#0056D2]"
                      placeholder="Section Title"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sIndex)}
                      className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
                    >
                      Delete Section
                    </button>
                  </div>

                  {/* Lessons */}
                  <div className="space-y-3 pl-4 border-l-2 border-[#0056D2]/30">
                    {section.lessons.map((lesson, lIndex) => (
                      <div key={lIndex} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-bold text-gray-400">Lesson {lIndex + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLesson(sIndex, lIndex)}
                            className="text-[11px] text-red-500 hover:underline font-semibold"
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
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2]"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Duration (mins)"
                              value={lesson.durationMinutes}
                              onChange={(e) => handleLessonChange(sIndex, lIndex, 'durationMinutes', parseInt(e.target.value) || 0)}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2]"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="MinIO Video URL (or click upload)"
                              value={lesson.videoUrl}
                              onChange={(e) => handleLessonChange(sIndex, lIndex, 'videoUrl', e.target.value)}
                              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-[11px] font-mono text-gray-700 focus:outline-none focus:border-[#0056D2]"
                            />
                            <button
                              type="button"
                              disabled={isUploadingVideo}
                              onClick={() => handleSimulateVideoUpload(sIndex, lIndex)}
                              className="bg-gray-100 hover:bg-[#0056D2] hover:text-white border border-gray-300 px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap"
                            >
                              {isUploadingVideo ? 'Uploading...' : 'Upload Video'}
                            </button>
                          </div>

                          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={lesson.isFreePreview}
                              onChange={(e) => handleLessonChange(sIndex, lIndex, 'isFreePreview', e.target.checked)}
                              className="rounded border-gray-300 text-[#0056D2] focus:ring-[#0056D2]"
                            />
                            Free Preview
                          </label>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddLesson(sIndex)}
                      className="text-xs font-bold text-[#0056D2] hover:underline pt-2 block"
                    >
                      + Add Lesson to Section
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3.5 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0056D2] hover:bg-[#00419E] text-white px-8 py-3.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 active:scale-98"
            >
              {loading ? 'Publishing Course...' : 'Publish Course to Catalog'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}