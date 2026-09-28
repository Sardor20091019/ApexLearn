// app/dashboard/page.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
  isEnrolled?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'catalog' | 'overview' | 'chat'>('catalog');
  const [courses, setCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'asc' | 'desc'>('default');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const [isInstructor, setIsInstructor] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'admin', text: 'Welcome to ApexLearn support. How can our engineering mentors assist you today?', timestamp: '10:00 AM' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [processingCourseId, setProcessingCourseId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    // 1. Check token payload for instructor/admin role (case-insensitive & multiple keys)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = (payload.role || payload.userRole || payload.type || '').toString().toUpperCase();
      if (role === 'INSTRUCTOR' || role === 'ADMIN' || payload.isAdmin || payload.isInstructor) {
        setIsInstructor(true);
      }
    } catch (e) {
      console.error('Failed to parse token role', e);
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // 2. Fetch user profile from backend to ensure authoritative database role check
        try {
          const profileRes = await fetch(`${API_URL}/auth/profile`, { headers });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const userRole = (profileData.role || profileData.userRole || '').toString().toUpperCase();
            if (userRole === 'INSTRUCTOR' || userRole === 'ADMIN' || profileData.isAdmin || profileData.isInstructor) {
              setIsInstructor(true);
            }
          }
        } catch (err) {
          // Fallback gracefully if /auth/profile endpoint is structured differently
        }

        const [coursesRes, enrollmentsRes, catRes] = await Promise.all([
          fetch(`${API_URL}/courses`, { headers }),
          fetch(`${API_URL}/enrollments/me`, { headers }).catch(() => null),
          fetch(`${API_URL}/categories`, { headers })
        ]);

        const enrolledIds = new Set<string>();
        if (enrollmentsRes && enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json();
          setMyEnrollments(enrollmentsData.map((e: any) => ({ ...e.course, progress: e.progress || 0 })));
          enrollmentsData.forEach((e: any) => {
            if (e.course?.id) enrolledIds.add(e.course.id);
            if (e.courseId) enrolledIds.add(e.courseId);
          });
        }

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          const mappedCourses = coursesData.map((c: any) => ({
            ...c,
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

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreateCourseClick = () => {
    if (isInstructor) {
      router.push('/instructor');
    } else {
      showToast('Instructor privileges required to add courses. Contact support to request instructor access.');
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
      showToast(err.message || 'Could not connect to payment gateway.');
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
        throw new Error(data.message || data.error || 'Failed to enroll in free course');
      }

      showToast('Successfully enrolled in free course! Access granted.');

      const [enrollmentsRes, coursesRes] = await Promise.all([
        fetch(`${API_URL}/enrollments/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const enrolledIds = new Set<string>();
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        setMyEnrollments(enrollmentsData.map((e: any) => ({ ...e.course, progress: e.progress || 0 })));
        enrollmentsData.forEach((e: any) => {
          if (e.course?.id) enrolledIds.add(e.course.id);
          if (e.courseId) enrolledIds.add(e.courseId);
        });
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.map((c: any) => ({
          ...c,
          isEnrolled: enrolledIds.has(c.id) || c.id === courseId
        })));
      } else {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isEnrolled: true } : c));
      }
    } catch (err: any) {
      console.error('Free enrollment error:', err);
      showToast(err.message || 'Could not complete free enrollment.');
    } finally {
      setProcessingCourseId(null);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'admin',
          text: 'Thank you for your message. An instructor or support agent will review your query and respond shortly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] text-gray-900 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#0056D2] border-t-transparent shadow-md"></div>
          <p className="text-xs font-semibold text-gray-600 tracking-wider">Preparing ApexLearn Workspace...</p>
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] flex flex-col font-sans selection:bg-[#0056D2] selection:text-white">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F1F1F] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-800 text-xs font-medium flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0056D2] animate-pulse"></span>
          <span>{toast}</span>
        </div>
      )}

      {/* Fixed Enterprise Navbar with Centered Max-Width Container */}
      <header className="h-20 bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto h-full px-6 sm:px-10 flex items-center justify-between">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('catalog')}>
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0056D2] flex items-center justify-center font-black text-base text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              A
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-gray-900 block leading-tight">ApexLearn</span>
              <span className="text-[10px] text-[#0056D2] font-bold uppercase tracking-widest block">Academy</span>
            </div>
          </div>
          
          {/* Center: Navigation Pill */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/70 shadow-inner">
            {[
              { id: 'catalog', label: 'Course Catalog' },
              { id: 'overview', label: 'My Learning' },
              { id: 'chat', label: 'Support' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-[#0056D2] bg-white shadow-sm font-bold scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right: Search & User Profile */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#0056D2] to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20">
                  SS
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"></span>
              </div>
              <button
                onClick={() => { localStorage.clear(); router.push('/auth'); }}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-center gap-1 bg-white border-b border-gray-200 p-2 shadow-xs sticky top-20 z-30">
        {[
          { id: 'catalog', label: 'Catalog' },
          { id: 'overview', label: 'My Learning' },
          { id: 'chat', label: 'Support' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id ? 'bg-[#0056D2] text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 space-y-8">
        {/* Catalog Tab */}
        {activeTab === 'catalog' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-[#002B49] via-[#003C70] to-[#0056D2] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none"></div>
              <div className="space-y-3 max-w-2xl relative z-10 flex flex-col items-center md:items-start">
                <span className="bg-white/15 text-blue-100 text-[10px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                  Professional Curriculum
                </span>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">Master Modern Software Architecture</h1>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
                  Explore industry-grade courses, build scalable microservices, and accelerate your engineering career with ApexLearn.
                </p>
                <div className="flex items-center justify-center md:justify-start gap-6 pt-2 text-xs font-semibold text-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    <span>{courses.length} Active Courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-300"></span>
                    <span>Practical Training Tracks</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="bg-white text-[#0056D2] hover:bg-blue-50 px-6 py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-black/10 transition-all whitespace-nowrap active:scale-98 cursor-pointer"
                >
                  View My Learning
                </button>
                <button
                  onClick={handleCreateCourseClick}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-black/10 transition-all whitespace-nowrap active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <span>+</span> Add Course
                </button>
              </div>
            </div>

            {/* Layout with Left Sidebar Filters and Right Course Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* Left Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-6 sticky top-28">
                  {/* Category Filter */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 text-center sm:text-left">Categories</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedCategory('All')}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          selectedCategory === 'All' ? 'bg-[#0056D2] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            selectedCategory === cat.name ? 'bg-[#0056D2] text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Free / Paid Filter */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 text-center sm:text-left">Price Type</h3>
                    <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'free', label: 'Free' },
                        { id: 'paid', label: 'Paid' },
                      ].map((pf) => (
                        <button
                          key={pf.id}
                          onClick={() => setPriceFilter(pf.id as any)}
                          className={`py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            priceFilter === pf.id ? 'bg-white text-[#0056D2] shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {pf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Sort By Price */}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 text-center sm:text-left">Sort By Price</h3>
                    <div className="space-y-1">
                      {[
                        { id: 'default', label: 'Recommended' },
                        { id: 'asc', label: 'Price: Low to High' },
                        { id: 'desc', label: 'Price: High to Low' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSortBy(s.id as any)}
                          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            sortBy === s.id ? 'bg-blue-50 text-[#0056D2] font-bold border border-blue-100' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Dual-Range Slider with Two Dots */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Price Range</h3>
                      <span className="text-xs font-bold text-[#0056D2] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                        ${minPrice} —${maxPrice}
                      </span>
                    </div>

                    <div className="relative flex items-center h-8 px-1">
                      <div className="absolute left-0 right-0 h-2 bg-gray-200 rounded-full"></div>
                      <div
                        className="absolute h-2 bg-[#0056D2] rounded-full"
                        style={{
                          left: `${(minPrice / 500) * 100}%`,
                          right: `${100 - (maxPrice / 500) * 100}%`,
                        }}
                      ></div>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="5"
                        value={minPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val <= maxPrice) setMinPrice(val);
                        }}
                        className="absolute w-full appearance-none bg-transparent pointer-events-none accent-[#0056D2] cursor-pointer z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0056D2] [&::-webkit-slider-thumb]:shadow-md"
                      />
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="5"
                        value={maxPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= minPrice) setMaxPrice(val);
                        }}
                        className="absolute w-full appearance-none bg-transparent pointer-events-none accent-[#0056D2] cursor-pointer z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0056D2] [&::-webkit-slider-thumb]:shadow-md"
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                      <span>$0</span>
                      <span>$250</span>
                      <span>$500</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Courses Grid */}
              <div className="lg:col-span-3 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs text-center sm:text-left">
                  <div>
                    <h2 className="text-base font-black text-gray-900 tracking-tight">Available Courses</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Showing {filteredCourses.length} professional training tracks</p>
                  </div>
                  <div className="w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2] w-full sm:w-60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.length === 0 ? (
                    <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3 flex flex-col items-center justify-center">
                      <p className="text-sm font-bold text-gray-800">No courses match your active filters.</p>
                      <p className="text-xs text-gray-500">Try adjusting your category, price range slider, or search query.</p>
                      <button 
                        onClick={() => { setSelectedCategory('All'); setPriceFilter('all'); setSearchQuery(''); setMinPrice(0); setMaxPrice(500); setSortBy('default'); }}
                        className="mt-2 bg-[#0056D2] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    filteredCourses.map((course) => {
                      const catName = typeof course.category === 'object' && course.category !== null ? course.category.name : course.category;
                      const isFree = course.price < 0.5;

                      return (
                        <div key={course.id} className="bg-white border border-gray-200/80 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-300 hover:shadow-xl transition-all duration-300 group overflow-hidden text-center sm:text-left">
                          <div className="space-y-3">
                            {course.thumbnailUrl ? (
                              <div className="w-full h-44 overflow-hidden rounded-xl mb-4 bg-gray-100 border border-gray-100 relative">
                                <img 
                                  src={course.thumbnailUrl} 
                                  alt={course.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                               {typeof catName === 'object' && catName !== null 
  ? (catName).name 
  : (typeof catName === 'string' && catName ? catName : 'General')}
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-44 bg-gradient-to-tr from-[#003087] to-[#0056D2] rounded-xl mb-4 flex items-center justify-center text-white font-black text-2xl shadow-inner relative overflow-hidden">
                                <span className="absolute inset-0 bg-black/10"></span>
                                <span className="relative z-10">{course.title.charAt(0)}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                                isFree 
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                  : 'text-[#0056D2] bg-[#0056D2]/10 border-[#0056D2]/20'
                              }`}>
                      {isFree ? 'Free Course' : (typeof catName === 'object' && catName !== null ? (catName).name : (typeof catName === 'string' && catName ? catName : 'General'))}
                              </span>
                              <span className="text-xs font-bold text-gray-900 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/50">
                                <span className="text-amber-500 font-black">★</span> {course.ratingAverage || 5.0}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#0056D2] transition-colors leading-snug">{course.title}</h3>
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{course.description}</p>
                          </div>

                          <div className="space-y-4 pt-6 border-t border-gray-100 mt-6">
                            <div className="flex items-center justify-between">
                              <span className={`text-base font-black ${isFree ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {isFree ? 'Free' : `$${course.price}`}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium">{course.enrollmentCount} enrolled</span>
                            </div>

                            {course.isEnrolled ? (
                              <button
                                onClick={() => setActiveTab('overview')}
                                className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-100 transition-all"
                              >
                                ✓ Enrolled (View in My Learning)
                              </button>
                            ) : (
                              <button
                                onClick={() => isFree ? handleFreeEnrollment(course.id) : handleStripeCheckout(course.id)}
                                disabled={processingCourseId === course.id}
                                className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
                                  isFree 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                                    : 'bg-[#0056D2] hover:bg-[#00419E] text-white shadow-blue-500/20'
                                }`}
                              >
                                {processingCourseId === course.id 
                                  ? 'Processing...' 
                                  : isFree 
                                    ? 'Enroll Free' 
                                    : `Enroll via Stripe — $${course.price}`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Learning Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs text-center sm:text-left">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Enrolled Courses</h2>
                <p className="text-xs text-gray-500 mt-1">Track your progress across your active learning enrollments</p>
              </div>
              <button onClick={() => setActiveTab('catalog')} className="text-xs font-bold text-[#0056D2] hover:underline cursor-pointer">Explore More Courses →</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myEnrollments.length === 0 ? (
                <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3 shadow-xs flex flex-col items-center justify-center">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#0056D2] flex items-center justify-center mx-auto text-lg">🎓</div>
                  <h3 className="text-sm font-bold text-gray-800">No active enrollments yet.</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">Explore our course catalog and enroll in your first professional training track.</p>
                  <button 
                    onClick={() => setActiveTab('catalog')}
                    className="mt-4 bg-[#0056D2] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                myEnrollments.map((course) => (
                  <div key={course.id} className="bg-white border border-gray-200/80 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs text-center sm:text-left">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#0056D2] uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded border border-blue-100">Enrolled</span>
                        <span className="text-xs font-bold text-gray-500">{course.progress || 0}% Completed</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{course.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2">{course.description}</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0056D2] rounded-full transition-all duration-500" style={{ width: `${course.progress || 0}%` }}></div>
                      </div>
                      <button 
                        onClick={() => router.push(`/courses/${course.id}/learn`)}
                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        Continue Learning →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Support Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white border border-gray-200/85 rounded-2xl shadow-sm flex flex-col h-[650px] overflow-hidden max-w-4xl mx-auto w-full">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#0056D2] font-bold text-xs">
                  SL
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">ApexLearn Support & Mentorship</h3>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Mentors Online
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FAFBFD]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user' 
                      ? 'bg-[#0056D2] text-white font-medium rounded-br-xs' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-xs'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200/80 flex items-center gap-3">
              <input
                type="text"
                placeholder="Ask an engineering mentor a question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0056D2]"
              />
              <button
                type="submit"
                className="bg-[#0056D2] hover:bg-[#00419E] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Enterprise Footer */}
      <footer className="bg-white border-t border-gray-200/80 py-8 px-6 sm:px-10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">ApexLearn Academy</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#0056D2] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#0056D2] transition-colors">Terms of Service</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('chat'); }} className="hover:text-[#0056D2] transition-colors cursor-pointer">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}