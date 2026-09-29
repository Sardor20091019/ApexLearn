'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SupportChat from '../../components/SupportChat';

interface Course {
  id: string;
  title: string;
  description: string;
  category: { name: string } | string;
  price: number;
  ratingAverage: number;
  enrollmentCount: number;
  progress?: number;
  thumbnailUrl?: string;
  thumbnail?: string;
  coverImage?: string;
  isEnrolled?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Web Development': '💻',
  'Data Science': '📈',
  'Design': '🎨',
  'Mobile': '📱',
  'DevOps': '⚡',
  'Security': '🛡️',
  'AI': '🤖',
  'default': '📚',
};

function getCategoryIcon(cat: string): string {
  return CATEGORY_ICONS[cat] || CATEGORY_ICONS['default'];
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400 text-xs">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < full ? 'opacity-100' : i === full && half ? 'opacity-70' : 'text-zinc-300 dark:text-zinc-700'}>
            ★
          </span>
        ))}
      </div>
      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function StudentDashboard() {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'catalog' | 'overview' | 'chat'>('catalog');
  const [courses, setCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'asc' | 'desc'>('default');

  // Dual Range Price Slider States ($0 - $500)
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(500);

  const [isInstructor, setIsInstructor] = useState(false);
  const [userRole, setUserRole] = useState<string>('USER');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [toast, setToast] = useState<string | null>(null);
  const [processingCourseId, setProcessingCourseId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    const savedTheme = localStorage.getItem('apexlearn-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('apexlearn-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = (payload.role || payload.userRole || payload.type || '').toString().toUpperCase();
      setUserRole(role);
      setCurrentUserId(payload.id || payload.userId || payload.sub || '');
      if (role === 'INSTRUCTOR' || role === 'ADMIN' || payload.isAdmin || payload.isInstructor) {
        setIsInstructor(true);
      }
    } catch (e) {
      console.error('Failed to parse token role', e);
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        try {
          const profileRes = await fetch(`${API_URL}/auth/profile`, { headers });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const userRoleVal = (profileData.role || profileData.userRole || '').toString().toUpperCase();
            setUserRole(userRoleVal);
            if (profileData.id) setCurrentUserId(profileData.id);
            if (userRoleVal === 'INSTRUCTOR' || userRoleVal === 'ADMIN' || profileData.isAdmin || profileData.isInstructor) {
              setIsInstructor(true);
            }
          }
        } catch (err) {}

        const [coursesRes, enrollmentsRes, catRes] = await Promise.all([
          fetch(`${API_URL}/courses`, { headers }),
          fetch(`${API_URL}/enrollments/me`, { headers }).catch(() => null),
          fetch(`${API_URL}/categories`, { headers })
        ]);

        const enrolledIds = new Set<string>();
        if (enrollmentsRes && enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json();
          setMyEnrollments(
            enrollmentsData.map((e: any) => ({
              ...e.course,
              thumbnailUrl: e.course?.thumbnailUrl || e.course?.thumbnail || e.course?.coverImage,
              progress: e.progress || 0
            }))
          );
          enrollmentsData.forEach((e: any) => {
            if (e.course?.id) enrolledIds.add(e.course.id);
            if (e.courseId) enrolledIds.add(e.courseId);
          });
        }

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          const mappedCourses = coursesData.map((c: any) => ({
            ...c,
            thumbnailUrl: c.thumbnailUrl || c.thumbnail || c.coverImage,
            isEnrolled: enrolledIds.has(c.id)
          }));
          setCourses(mappedCourses);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }
      } catch (err) {
        console.error('Failed to load dashboard records', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, API_URL]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreateCourseClick = () => {
    if (isInstructor) {
      router.push('/instructor');
    } else {
      showToast('Instructor privileges required to publish courses.');
    }
  };

  const handleStripeCheckout = async (courseId: string) => {
    setProcessingCourseId(courseId);
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');

    if (!token) {
      localStorage.clear();
      router.push('/auth');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        router.push('/auth');
        return;
      }

      if (!res.ok) throw new Error(data.message || 'Payment initiation failed');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Unable to connect to payment checkout.');
    } finally {
      setProcessingCourseId(null);
    }
  };

  const handleFreeEnrollment = async (courseId: string) => {
    setProcessingCourseId(courseId);
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');

    if (!token) {
      localStorage.clear();
      router.push('/auth');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to complete enrollment');
      }

      showToast('Successfully enrolled in course.');

      const [enrollmentsRes, coursesRes] = await Promise.all([
        fetch(`${API_URL}/enrollments/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const enrolledIds = new Set<string>();
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        setMyEnrollments(
          enrollmentsData.map((e: any) => ({
            ...e.course,
            thumbnailUrl: e.course?.thumbnailUrl || e.course?.thumbnail || e.course?.coverImage,
            progress: e.progress || 0
          }))
        );
        enrollmentsData.forEach((e: any) => {
          if (e.course?.id) enrolledIds.add(e.course.id);
          if (e.courseId) enrolledIds.add(e.courseId);
        });
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.map((c: any) => ({
          ...c,
          thumbnailUrl: c.thumbnailUrl || c.thumbnail || c.coverImage,
          isEnrolled: enrolledIds.has(c.id) || c.id === courseId
        })));
      } else {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isEnrolled: true } : c));
      }
    } catch (err: any) {
      console.error('Free enrollment error:', err);
      showToast(err.message || 'Could not process enrollment.');
    } finally {
      setProcessingCourseId(null);
    }
  };

  const isDark = theme === 'dark';

  const containerBg = isDark ? 'bg-[#0b1120] text-slate-100' : 'bg-[#f4f7fb] text-slate-900';
  const headerBg = isDark ? 'bg-slate-950/65 border-white/10' : 'bg-white/65 border-white/80';
  const cardBg = isDark
    ? 'bg-slate-900/55 border-white/10 hover:border-indigo-400/35 hover:bg-slate-900/75 shadow-[0_16px_42px_rgba(0,0,0,0.16)] backdrop-blur-xl'
    : 'bg-white/70 border-white/80 hover:border-indigo-200 hover:shadow-[0_16px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl';
  const sidebarBg = isDark ? 'bg-slate-900/45 border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl' : 'bg-white/65 border-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl';
  const inputStyle = isDark
    ? 'bg-slate-950/45 border-white/10 text-slate-100 placeholder-slate-500 focus:border-indigo-400/70 focus:ring-1 focus:ring-indigo-400/40'
    : 'bg-white/70 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200';

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center font-sans ${containerBg}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-zinc-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const filteredCourses = courses.filter((c) => {
    const catName = typeof c.category === 'object' && c.category !== null ? c.category.name : c.category;
    const matchesCat = selectedCategory === 'All' || catName === selectedCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const isFree = c.price < 0.5;
    const matchesPriceType =
      priceFilter === 'all' ? true :
      priceFilter === 'free' ? isFree : !isFree;
    const matchesPriceRange = c.price >= minPrice && c.price <= maxPrice;
    return matchesCat && matchesSearch && matchesPriceType && matchesPriceRange;
  }).sort((a, b) => {
    if (sortBy === 'asc') return a.price - b.price;
    if (sortBy === 'desc') return b.price - a.price;
    return 0;
  });

  const tabs = [
    { id: 'catalog', label: 'Explore' },
    { id: 'overview', label: 'My Learning' },
    { id: 'chat', label: userRole === 'ADMIN' ? 'Support Inbox' : 'Support' },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${containerBg} ${isDark ? 'bg-[radial-gradient(circle_at_15%_0%,rgba(79,70,229,0.16),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(14,165,233,0.11),transparent_28%)]' : 'bg-[radial-gradient(circle_at_15%_0%,rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(14,165,233,0.08),transparent_28%)]'}`}>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg text-xs font-medium border shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
          isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-zinc-900 border-zinc-800 text-white'
        }`}>
          <span>{toast}</span>
        </div>
      )}

      {/* Clean Navbar */}
      <header className={`h-14 sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${headerBg}`}>
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab('catalog')} className="flex items-center gap-2 cursor-pointer">
              <div className="h-7 w-7 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center font-bold text-xs text-white dark:text-zinc-900">
                A
              </div>
              <span className="font-bold tracking-tight text-sm">ApexLearn</span>
            </button>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Theme Switcher & Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700' 
                  : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
              }`}
              title="Toggle theme"
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>

            <div className={`h-7 w-7 rounded-full border flex items-center justify-center font-semibold text-xs ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-200 border-zinc-300 text-zinc-700'
            }`}>
              {userRole === 'ADMIN' ? 'AD' : 'SS'}
            </div>

            <button
              onClick={() => { localStorage.clear(); router.push('/auth'); }}
              className="text-xs font-medium text-zinc-500 hover:text-red-500 transition-colors cursor-pointer hidden sm:block"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className={`md:hidden flex items-center justify-around sticky top-14 z-30 py-2 border-b backdrop-blur-md ${headerBg}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`text-xs font-medium transition-colors cursor-pointer ${
              activeTab === tab.id ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">

        {/* ─── CATALOG TAB ─── */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">

            {/* Clean Hero Header */}
            <div className={`border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div className="space-y-1.5 max-w-xl">
                <p className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-500">Course Catalog</p>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Learn with focus, not noise
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Browse {courses.length} thoughtfully structured courses for practical, modern engineering work.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isDark
                      ? 'bg-zinc-100 text-zinc-900 border-zinc-100 hover:bg-zinc-200'
                      : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                  }`}
                >
                  My Enrollments ({myEnrollments.length})
                </button>
                {isInstructor && (
                  <button
                    onClick={handleCreateCourseClick}
                    className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:bg-zinc-800' : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    + Create Course
                  </button>
                )}
              </div>
            </div>

            {/* Layout: Filters Sidebar + Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

              {/* Refined Sidebar */}
              <aside className={`border rounded-2xl p-5 space-y-5 sticky top-20 ${sidebarBg}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Filter Courses</h3>
                  <button
                    onClick={() => { setSelectedCategory('All'); setPriceFilter('all'); setSearchQuery(''); setMinPrice(0); setMaxPrice(500); setSortBy('default'); }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                {/* Search */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">Search</label>
                  <input
                    type="text"
                    placeholder="Title or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 text-xs font-medium focus:outline-none transition-all ${inputStyle}`}
                  />
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                {/* Categories */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">Category</label>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                        selectedCategory === 'All'
                          ? isDark ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'bg-zinc-100 text-zinc-900 font-semibold'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <span>All Categories</span>
                      <span className="text-[10px] opacity-60">{courses.length}</span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                          selectedCategory === cat.name
                            ? isDark ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'bg-zinc-100 text-zinc-900 font-semibold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-xs">{getCategoryIcon(cat.name)}</span>
                        <span className="truncate">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                {/* Dual-Thumb Price Slider ($0 - $500) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Price Range</label>
                    <span className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      ${minPrice} –${maxPrice}
                    </span>
                  </div>

                  <div className="relative w-full h-5 flex items-center select-none">
                    {/* Track Background */}
                    <div className="absolute w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />

                    {/* Active Track Highlight */}
                    <div
                      className="absolute h-1.5 bg-zinc-900 dark:bg-zinc-100 rounded-full"
                      style={{
                        left: `${(minPrice / 500) * 100}%`,
                        width: `${((maxPrice - minPrice) / 500) * 100}%`,
                      }}
                    />

                    {/* Min Price Handle */}
                    <input
                      type="range"
                      min={0}
                      max={500}
                      step={5}
                      value={minPrice}
                      onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 10))}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-900 dark:[&::-webkit-slider-thumb]:border-zinc-100 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-900 dark:[&::-moz-range-thumb]:border-zinc-100 [&::-moz-range-thumb]:shadow-sm"
                    />

                    {/* Max Price Handle */}
                    <input
                      type="range"
                      min={0}
                      max={500}
                      step={5}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 10))}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-900 dark:[&::-webkit-slider-thumb]:border-zinc-100 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-900 dark:[&::-moz-range-thumb]:border-zinc-100 [&::-moz-range-thumb]:shadow-sm"
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>$0</span>
                    <span>$250</span>
                    <span>$500</span>
                  </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                {/* Price Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">Pricing Tier</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'free', label: 'Free' },
                      { id: 'paid', label: 'Paid' },
                    ].map((pf) => (
                      <button
                        key={pf.id}
                        onClick={() => setPriceFilter(pf.id as any)}
                        className={`py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border text-center ${
                          priceFilter === pf.id
                            ? isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-900 border-zinc-900 text-white'
                            : isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                        }`}
                      >
                        {pf.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                {/* Sort Order */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className={`w-full rounded-lg px-3 py-2 text-xs font-medium focus:outline-none transition-all cursor-pointer ${inputStyle}`}
                  >
                    <option value="default">Default</option>
                    <option value="asc">Price: Low to High</option>
                    <option value="desc">Price: High to Low</option>
                  </select>
                </div>
              </aside>

              {/* Course Cards Grid */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Showing <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{filteredCourses.length}</strong> courses</span>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className={`border rounded-2xl p-12 text-center flex flex-col items-center gap-2 ${sidebarBg}`}>
                    <p className="font-semibold text-sm">No courses matching your criteria</p>
                    <p className="text-xs text-zinc-500 max-w-xs">Try relaxing your price constraints or category selections.</p>
                    <button
                      onClick={() => { setSelectedCategory('All'); setPriceFilter('all'); setSearchQuery(''); setMinPrice(0); setMaxPrice(500); setSortBy('default'); }}
                      className="mt-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4 hover:opacity-80"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => {
                      const catName = typeof course.category === 'object' && course.category !== null ? course.category.name : course.category;
                      const catStr = typeof catName === 'object' && catName !== null ? (catName as any).name : (typeof catName === 'string' ? catName : 'General');
                      const isFree = course.price < 0.5;
                      const thumb = course.thumbnailUrl || course.thumbnail || course.coverImage;

                      return (
                        <div
                          key={course.id}
                          className={`border rounded-xl flex flex-col justify-between transition-all duration-200 overflow-hidden ${cardBg}`}
                        >
                          <div>
                            {/* Thumbnail or Icon Cover */}
                            {thumb ? (
                              <div className="h-36 overflow-hidden relative border-b border-zinc-200 dark:border-zinc-800">
                                <img src={thumb} alt={course.title} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="h-32 bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-3xl border-b border-zinc-200 dark:border-zinc-800">
                                {getCategoryIcon(catStr)}
                              </div>
                            )}

                            <div className="p-4 space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                  {catStr}
                                </span>
                                <StarRating rating={course.ratingAverage || 5} />
                              </div>

                              <div>
                                <h3 className="font-semibold text-sm leading-snug line-clamp-1">{course.title}</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                  {course.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 pt-0 space-y-3">
                            <div className="flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                              <span className="font-mono font-bold text-sm">
                                {isFree ? 'Free' : `$${course.price}`}
                              </span>
                              <span className="text-[11px] text-zinc-500">{course.enrollmentCount} enrolled</span>
                            </div>

                            {course.isEnrolled ? (
                              <button
                                onClick={() => setActiveTab('overview')}
                                className="w-full py-2 rounded-lg text-xs font-medium border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              >
                                Enrolled — View Course
                              </button>
                            ) : (
                              <button
                                onClick={() => isFree ? handleFreeEnrollment(course.id) : handleStripeCheckout(course.id)}
                                disabled={processingCourseId === course.id}
                                className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer ${
                                  isFree
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : isDark
                                      ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                                }`}
                              >
                                {processingCourseId === course.id
                                  ? 'Processing...'
                                  : isFree
                                    ? 'Enroll for Free'
                                    : `Enroll — $${course.price}`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── MY LEARNING TAB ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight">My Enrolled Courses</h2>
                <p className="text-xs text-zinc-500">Track your progress and continue course material.</p>
              </div>
              <button
                onClick={() => setActiveTab('catalog')}
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:underline"
              >
                Browse catalog →
              </button>
            </div>

            {myEnrollments.length === 0 ? (
              <div className={`border rounded-2xl p-12 text-center flex flex-col items-center gap-2 ${sidebarBg}`}>
                <p className="font-semibold text-sm">No active course enrollments</p>
                <p className="text-xs text-zinc-500 max-w-xs">You have not enrolled in any courses yet.</p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`mt-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myEnrollments.map((course) => {
                  const progress = course.progress || 0;
                  const catName = typeof course.category === 'object' && course.category !== null ? course.category.name : course.category;
                  const catStr = typeof catName === 'object' && catName !== null ? (catName as any).name : (typeof catName === 'string' ? catName : 'General');
                  const thumb = course.thumbnailUrl || course.thumbnail || course.coverImage;

                  return (
                    <div key={course.id} className={`border rounded-xl flex flex-col justify-between overflow-hidden transition-all duration-200 ${cardBg}`}>
                      <div>
                        {/* Course Thumbnail */}
                        {thumb ? (
                          <div className="h-36 overflow-hidden relative border-b border-zinc-200 dark:border-zinc-800">
                            <img src={thumb} alt={course.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-32 bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-3xl border-b border-zinc-200 dark:border-zinc-800">
                            {getCategoryIcon(catStr)}
                          </div>
                        )}

                        <div className="p-5 space-y-4">
                          <div>
                            <span className="text-[10px] font-mono font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                              {catStr}
                            </span>
                            <h3 className="font-semibold text-sm truncate mt-2">{course.title}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{course.description}</p>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-zinc-500">Completion</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0">
                        <button
                          onClick={() => router.push(`/courses/${course.id}/learn`)}
                          className={`w-full py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-zinc-100 text-zinc-900 border-zinc-100 hover:bg-zinc-200'
                              : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                          }`}
                        >
                          {progress > 0 ? 'Continue Learning' : 'Start Course'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── SUPPORT CHAT TAB ─── */}
        {activeTab === 'chat' && (
          <div className={`border rounded-2xl p-6 ${sidebarBg}`}>
            <SupportChat userRole={userRole} currentUserId={currentUserId} />
          </div>
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className={`border-t py-5 px-4 sm:px-6 mt-auto transition-colors ${headerBg}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">ApexLearn</span>
            <span>© {new Date().getFullYear()} Inc.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Terms</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('chat'); }} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}