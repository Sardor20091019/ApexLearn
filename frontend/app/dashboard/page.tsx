'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  institution: string;
  description: string;
  progress: number;
  category: string;
  instructor: string;
  nextDeadline?: string;
  rating: number;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'certificates' | 'settings'>('overview');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    setTimeout(() => {
      setCourses(mockStudentCourses);
      setLoading(false);
    }, 300);
  }, [router]);

  const mockStudentCourses: Course[] = [
    {
      id: '1',
      title: 'Machine Learning Specialization',
      institution: 'Stanford University & DeepLearning.AI',
      description: 'Master fundamental AI concepts, supervised learning, neural networks, and decision trees.',
      progress: 68,
      category: 'Data Science',
      instructor: 'Andrew Ng',
      nextDeadline: 'Due in 2 days (Quiz 3)',
      rating: 4.9,
    },
    {
      id: '2',
      title: 'Financial Markets & Investment Strategy',
      institution: 'Yale University',
      description: 'An overview of security markets, behavioral finance, risk management, and portfolio optimization.',
      progress: 35,
      category: 'Business',
      instructor: 'Robert Shiller',
      nextDeadline: 'Due tomorrow (Peer Assignment)',
      rating: 4.8,
    },
    {
      id: '3',
      title: 'UI/UX Design Professional Certificate',
      institution: 'Google',
      description: 'Learn wireframing, prototyping, user research, and Figma design systems from industry leaders.',
      progress: 90,
      category: 'Design',
      instructor: 'Michael Andrews',
      nextDeadline: 'Final Capstone Project',
      rating: 4.85,
    },
    {
      id: '4',
      title: 'Full-Stack Web Development with NestJS & Next.js',
      institution: 'Apex Institute',
      description: 'Build scalable modern backend architectures and lightning-fast frontend applications.',
      progress: 52,
      category: 'Computer Science',
      instructor: 'Sardor S.',
      nextDeadline: 'Module 4 Lab Assignment',
      rating: 4.95,
    },
  ];

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070709] text-white font-sans">
        <div className="relative flex flex-col items-center gap-4">
          <div className="absolute -inset-8 rounded-full bg-blue-600/15 blur-3xl animate-pulse"></div>
          <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent shadow-xl shadow-blue-500/40"></div>
          <p className="relative text-[11px] font-bold tracking-widest text-blue-400 uppercase">Loading Environment...</p>
        </div>
      </div>
    );
  }

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = filterCategory === 'All' || course.category === filterCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.institution.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce bg-blue-600/95 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-400/30 text-xs font-semibold flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-white animate-ping"></span>
          <span>{toast}</span>
        </div>
      )}

      {/* Sophisticated Ambient Glows */}
      <div className="absolute -top-32 left-1/3 w-[700px] h-[700px] bg-blue-600/[0.08] rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute -bottom-32 right-10 w-[600px] h-[600px] bg-purple-600/[0.06] rounded-full blur-[160px] pointer-events-none"></div>

      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-white/[0.06] bg-[#09090d]/80 backdrop-blur-3xl p-6 hidden md:flex flex-col justify-between z-20">
        <div>
          <div className="flex items-center gap-3.5 mb-10 px-2 group cursor-pointer">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center font-black text-base text-white shadow-xl shadow-blue-600/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-300">
              C
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">Coursera Plus</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Student Hub</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'Learner Home', icon: '⚡' },
              { id: 'catalog', label: 'Explore & Enroll', icon: '🔍' },
              { id: 'certificates', label: 'Accomplishments', icon: '🏆' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'text-gray-400 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/[0.06] space-y-3">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] shadow-inner">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
              S
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Sardor S.</p>
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Unlimited Pass
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto z-10">
        {/* Top Header */}
        <header className="h-20 border-b border-white/[0.06] bg-[#070709]/60 backdrop-blur-2xl px-8 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white capitalize flex items-center gap-2">
              {activeTab === 'overview' ? 'Welcome back, Sardor' : `${activeTab} Hub`}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Track your weekly learning goals and upcoming milestones.</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Verified Registry Online
            </span>
            <button
              onClick={handleLogout}
              className="md:hidden rounded-lg bg-red-600/20 px-3 py-1.5 text-xs text-red-400 border border-red-500/30"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Active Courses', value: '4 Enrolled', change: '2 due this week', color: 'text-emerald-400', bg: 'from-emerald-500/10' },
                  { label: 'Learning Hours', value: '42.5 hrs', change: 'Top 5% learner tier', color: 'text-blue-400', bg: 'from-blue-500/10' },
                  { label: 'Certificates Earned', value: '3 Completed', change: 'Verified credentials', color: 'text-purple-400', bg: 'from-purple-500/10' },
                  { label: 'Study Streak', value: '🔥 12 Days', change: 'Personal best!', color: 'text-amber-400', bg: 'from-amber-500/10' },
                ].map((stat, i) => (
                  <div key={i} className={`rounded-3xl border border-white/[0.06] bg-gradient-to-b ${stat.bg} to-[#0b0b10]/90 p-6 backdrop-blur-2xl shadow-xl hover:border-white/15 transition-all group`}>
                    <p className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-black text-white tracking-tight mb-2 group-hover:scale-[1.02] transition-transform origin-left">{stat.value}</p>
                    <span className={`text-xs font-semibold ${stat.color} inline-block`}>{stat.change}</span>
                  </div>
                ))}
              </div>

              {/* Resume Learning Banner */}
              <div className="relative rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-[#0b0b10] to-[#0b0b10] p-8 overflow-hidden shadow-2xl group">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/15 to-transparent pointer-events-none group-hover:scale-105 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Stanford University
                      </span>
                      <span className="text-xs text-amber-400 font-bold">⭐ 4.9 (184k reviews)</span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Machine Learning Specialization</h2>
                    <p className="text-sm text-gray-300 leading-relaxed font-normal">
                      Next up: Neural Networks Intuition & Forward Propagation in Python.
                    </p>
                    <p className="text-xs text-orange-400 font-semibold flex items-center gap-1.5">
                      <span>⚠️</span> Assignment due in 2 days (Quiz 3)
                    </p>
                  </div>
                  <button 
                    onClick={() => showToast('Launching Stanford ML classroom...')}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-xs font-bold text-white hover:brightness-110 transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 whitespace-nowrap active:scale-95"
                  >
                    Resume Course →
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'certificates' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/[0.06] bg-[#0b0b10]/90 p-8 backdrop-blur-2xl shadow-2xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Your Earned Credentials</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Verified digital certificates issued by top global institutions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {[
                    { title: 'Google UX Design Professional', issuer: 'Google', date: 'Issued Jan 2026', id: 'CR-8923-GL' },
                    { title: 'Python for Data Engineering', issuer: 'IBM', date: 'Issued Jun 2025', id: 'IBM-4912-DE' },
                    { title: 'Introduction to Financial Markets', issuer: 'Yale University', date: 'Issued Nov 2025', id: 'YALE-FM-22' },
                  ].map((cert, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/[0.08] bg-black/40 p-6 flex flex-col justify-between space-y-6 hover:border-blue-500/40 transition-all group">
                      <div>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20 inline-block mb-3.5">
                          Verified Certificate
                        </span>
                        <h4 className="text-sm font-bold text-white mb-1.5 group-hover:text-blue-400 transition-colors">{cert.title}</h4>
                        <p className="text-xs text-gray-400 font-medium">{cert.issuer}</p>
                      </div>
                      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-gray-500 font-semibold">
                        <span>{cert.date}</span>
                        <button onClick={() => showToast(`Downloading ${cert.id}.pdf`)} className="text-blue-400 font-bold hover:underline">
                          Download PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="rounded-3xl border border-white/[0.06] bg-[#0b0b10]/90 p-8 space-y-6 max-w-2xl backdrop-blur-2xl shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-white">Student Account Settings</h3>
                <p className="text-xs text-gray-400 mt-0.5">Update your personal learner profile and certificate details.</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Registered Email</label>
                  <input type="email" disabled value="sardor@apexlearn.uz" className="w-full rounded-2xl border border-white/[0.06] bg-black/40 px-4 py-3.5 text-xs text-gray-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name on Certificate</label>
                  <input type="text" defaultValue="Sardor Sunatullayev" className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3.5 text-xs text-white focus:border-blue-500 focus:outline-none shadow-inner" />
                </div>
                <button 
                  onClick={() => showToast('Learner profile updated successfully!')}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white hover:brightness-110 transition shadow-lg shadow-blue-600/25 active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'overview' || activeTab === 'catalog') && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Enrolled Specializations & Catalog</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Filter across university specializations and professional tracks</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  {/* Search Bar */}
                  <input
                    type="text"
                    placeholder="Search courses or universities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 bg-black/50 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 shadow-inner"
                  />

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    {['All', 'Data Science', 'Business', 'Design', 'Computer Science'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all ${
                          filterCategory === cat
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCourses.length === 0 ? (
                  <div className="col-span-full py-16 text-center rounded-3xl border border-white/[0.06] bg-[#0b0b10]/50">
                    <p className="text-sm font-semibold text-gray-400">No courses match your search criteria.</p>
                  </div>
                ) : (
                  filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-3xl border border-white/[0.06] bg-[#0b0b10]/90 p-7 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 relative overflow-hidden backdrop-blur-2xl"
                    >
                      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-all"></div>
                      <div>
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/[0.04] text-gray-300 border border-white/[0.06]">
                            {course.institution}
                          </span>
                          <span className="text-xs font-bold text-amber-400">⭐ {course.rating}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                          {course.title}
                        </h4>
                        <p className="text-xs text-blue-400 font-semibold mb-3">Instructor: {course.instructor}</p>
                        <p className="text-xs text-gray-400 mb-6 leading-relaxed line-clamp-2">{course.description}</p>
                        {course.nextDeadline && (
                          <div className="mb-4 text-[11px] font-semibold text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20 inline-block">
                            📌 {course.nextDeadline}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
                          <span>Overall Progress</span>
                          <span className="text-blue-400 font-bold">{course.progress}%</span>
                        </div>
                        {/* Smooth Progress Bar */}
                        <div className="w-full bg-white/[0.06] rounded-full h-2.5 overflow-hidden p-0.5 border border-white/[0.06]">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-700 shadow-sm"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <button 
                          onClick={() => showToast(`Opening classroom for ${course.title}`)}
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.02] py-3 text-xs font-bold text-white hover:bg-blue-600 hover:border-blue-600 transition-all shadow-sm active:scale-95"
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
        </div>
      </main>
    </div>
  );
}