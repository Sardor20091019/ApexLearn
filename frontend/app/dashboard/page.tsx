// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
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
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'chat' | 'certificates'>('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isInstructor, setIsInstructor] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'admin', text: 'Welcome to ApexLearn support. How can we assist you today?', timestamp: '10:00 AM' }
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

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'INSTRUCTOR' || payload.role === 'ADMIN') {
        setIsInstructor(true);
      }
    } catch (e) {
      console.error('Failed to parse token role', e);
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const coursesRes = await fetch(`${API_URL}/courses`, { headers });
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData);
        }

        try {
          const enrollmentsRes = await fetch(`${API_URL}/enrollments/me`, { headers });
          if (enrollmentsRes.ok) {
            const enrollmentsData = await enrollmentsRes.json();
            setMyEnrollments(enrollmentsData.map((e: any) => ({ ...e.course, progress: e.progress || 0 })));
          }
        } catch {
          setMyEnrollments([]);
        }

        const catRes = await fetch(`${API_URL}/categories`, { headers });
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
    processingCourseId && setProcessingCourseId(null);
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
          text: 'Thank you for your message. An instructor or support agent will respond shortly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] text-gray-900 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#0056D2] border-t-transparent shadow-xs"></div>
          <p className="text-xs font-semibold text-gray-600">Loading ApexLearn...</p>
        </div>
      </div>
    );
  }

  const filteredCourses = courses.filter((c) => {
    const catName = typeof c.category === 'object' && c.category !== null ? c.category.name : c.category;
    const matchesCat = selectedCategory === 'All' || catName === selectedCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] flex flex-col font-sans">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F1F1F] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-gray-800 text-xs font-medium flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0056D2]"></span>
          <span>{toast}</span>
        </div>
      )}

      <header className="h-18 bg-white border-b border-gray-200 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#003087] to-[#0056D2] flex items-center justify-center font-black text-base text-white shadow-md shadow-blue-500/20">
              A
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-gray-900 block leading-tight">ApexLearn</span>
              <span className="text-[10px] text-[#0056D2] font-bold uppercase tracking-widest block">Learning Platform</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-1.5">
            {[
              { id: 'overview', label: 'My Learning' },
              { id: 'catalog', label: 'Catalog' },
              { id: 'chat', label: 'Support' },
              { id: 'certificates', label: 'Certificates' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-[#0056D2] bg-[#0056D2]/10 shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {isInstructor && (
              <button
                onClick={() => router.push('/instructor')}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5"
              >
                <span>⚡</span> Instructor Studio →
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 w-72 focus-within:border-[#0056D2] focus-within:bg-white transition-all shadow-inner">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-gray-900 placeholder-gray-400 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-3.5 pl-4 border-l border-gray-200">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#0056D2] to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              SS
            </div>
            <button
              onClick={() => { localStorage.clear(); router.push('/auth'); }}
              className="text-xs font-semibold text-gray-600 hover:text-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 space-y-8">
        {activeTab === 'overview' && (
          <>
            <div className="bg-gradient-to-r from-[#002B49] via-[#003C70] to-[#0056D2] text-white rounded-2xl p-8 sm:p-10 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl relative z-10">
                <span className="bg-white/15 text-blue-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md border border-white/10 backdrop-blur-md">
                  Student Dashboard
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Keep up the great progress</h1>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
                  Access your enrolled courses and continue learning professional backend development.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('catalog')}
                className="relative z-10 bg-white text-[#0056D2] hover:bg-blue-50 px-7 py-3.5 rounded-xl text-xs font-bold shadow-md transition-all whitespace-nowrap"
              >
                Explore Catalog →
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-500">Enrolled Courses ({myEnrollments.length})</h2>
                <button onClick={() => setActiveTab('catalog')} className="text-xs font-bold text-[#0056D2] hover:underline">Browse All Courses →</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myEnrollments.length === 0 ? (
                  <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
                    <p className="text-sm font-bold text-gray-800">You are not enrolled in any courses yet.</p>
                    <p className="text-xs text-gray-500">Explore the catalog to enroll in professional courses.</p>
                    <button 
                      onClick={() => setActiveTab('catalog')}
                      className="mt-2 bg-[#0056D2] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm"
                    >
                      Browse Catalog
                    </button>
                  </div>
                ) : (
                  myEnrollments.map((course) => (
                    <div key={course.id} className="bg-white border border-gray-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200/50">
                            {typeof course.category === 'object' ? course.category?.name : course.category}
                          </span>
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/50">
                            <span className="text-amber-500 font-black">★</span> {course.ratingAverage || 5.0}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-snug">{course.title}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{course.description}</p>
                      </div>

                      <div className="space-y-3.5 pt-6 border-t border-gray-100 mt-6">
                        <div className="flex justify-between text-xs font-semibold text-gray-600">
                          <span>Course Progress</span>
                          <span className="text-[#0056D2] font-extrabold">{course.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-gray-200/60">
                          <div className="bg-[#0056D2] h-full rounded-full transition-all duration-700" style={{ width: `${course.progress || 0}%` }}></div>
                        </div>
                        <button 
                          onClick={() => showToast(`Opening player for ${course.title}`)}
                          className="w-full bg-gray-50 hover:bg-[#0056D2] hover:text-white border border-gray-200 hover:border-[#0056D2] py-3 rounded-xl text-xs font-bold text-gray-800 transition-all"
                        >
                          Continue Learning →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Course Catalog</h2>
                <p className="text-xs text-gray-500 mt-1">Explore and enroll in professional courses</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {['All', ...categories.map(c => c.name)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedCategory === cat 
                        ? 'bg-[#0056D2] text-white shadow-sm shadow-blue-500/20' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const catName = typeof course.category === 'object' && course.category !== null ? course.category.name : course.category;
                return (
                  <div key={course.id} className="bg-white border border-gray-200/80 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-300 hover:shadow-lg transition-all group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#0056D2] uppercase tracking-wider bg-[#0056D2]/10 px-2.5 py-1 rounded-md border border-[#0056D2]/20">
                        {typeof catName === 'object' && catName !== null
                          ? (catName as { name: string }).name
                          : typeof catName === 'string'
                            ? catName
                            : 'General'}
                        </span>
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                          <span className="text-amber-500">★</span> {course.ratingAverage || 0}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#0056D2] transition-colors leading-snug">{course.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{course.description}</p>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-gray-100 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-gray-900">${course.price}</span>
                        <span className="text-[11px] text-gray-400 font-medium">{course.enrollmentCount} enrolled</span>
                      </div>
                      <button
                        onClick={() => handleStripeCheckout(course.id)}
                        disabled={processingCourseId === course.id}
                        className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processingCourseId === course.id ? 'Processing...' : `Enroll via Stripe — $${course.price}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs flex flex-col h-[600px] max-w-3xl mx-auto">
            <div className="border-b border-gray-200 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Support & Assistance</h3>
                <p className="text-[11px] text-emerald-600 flex items-center gap-1.5 mt-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Connected to support team
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md rounded-2xl px-4.5 py-3 text-xs shadow-2xs ${msg.sender === 'user' ? 'bg-[#0056D2] text-white rounded-br-xs' : 'bg-gray-100 text-gray-800 border border-gray-200/80 rounded-bl-xs'}`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className={`text-[9px] block mt-1.5 font-medium ${msg.sender === 'user' ? 'text-blue-100 text-right' : 'text-gray-400'}`}>{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendMessage} className="pt-4 border-t border-gray-200 flex gap-3 mt-4">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition-all"
              />
              <button type="submit" className="bg-[#0056D2] hover:bg-[#00419E] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-sm">
                Send
              </button>
            </form>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-8 shadow-xs space-y-6 max-w-3xl mx-auto text-center">
            <div className="h-16 w-16 bg-[#0056D2]/10 border border-[#0056D2]/20 rounded-2xl mx-auto flex items-center justify-center text-[#0056D2] text-2xl font-black">
              🏆
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Your Certificates</h2>
              <p className="text-xs text-gray-500 mt-1">Verified course completion diplomas</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-[#002B49] text-white text-left space-y-4 shadow-xl border border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">ApexLearn Diploma</span>
                  <h3 className="text-base font-extrabold mt-1">Full-Stack Web Development & Microservices</h3>
                </div>
                <span className="text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-lg font-mono">VERIFIED</span>
              </div>
              <p className="text-xs text-gray-300">Awarded for successful completion of all core modules and milestone projects.</p>
              <div className="pt-4 border-t border-gray-800 flex justify-between items-center text-[11px] text-gray-400">
                <span>Status: Active</span>
                <button onClick={() => showToast('Downloading certificate PDF...')} className="text-blue-400 font-bold hover:underline">Download PDF →</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}