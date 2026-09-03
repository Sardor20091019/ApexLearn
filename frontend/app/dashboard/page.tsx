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
  workload: string;
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

    // Simulate authentic API sync
    const timer = setTimeout(() => {
      setCourses(courseraMockCourses);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [router]);

  const courseraMockCourses: Course[] = [
    {
      id: '1',
      title: 'Machine Learning Specialization',
      institution: 'Stanford University & DeepLearning.AI',
      description: 'Build machine learning models with Python, TensorFlow, and scikit-learn. Master supervised learning, neural networks, and decision trees.',
      progress: 68,
      category: 'Data Science',
      instructor: 'Andrew Ng',
      nextDeadline: 'Due in 2 days (Quiz: Neural Networks)',
      rating: 4.9,
      workload: '10 hours/week',
    },
    {
      id: '2',
      title: 'Financial Markets & Investment Strategy',
      institution: 'Yale University',
      description: 'An overview of security markets, behavioral finance, risk management, portfolio optimization, and central bank monetary policy.',
      progress: 35,
      category: 'Business',
      instructor: 'Robert Shiller',
      nextDeadline: 'Due tomorrow (Peer Assignment)',
      rating: 4.8,
      workload: '6 hours/week',
    },
    {
      id: '3',
      title: 'Google UX Design Professional Certificate',
      institution: 'Google',
      description: 'Learn wireframing, low-fidelity and high-fidelity prototyping, user research interviews, and Figma design systems from industry leaders.',
      progress: 90,
      category: 'Design',
      instructor: 'Michael Andrews',
      nextDeadline: 'Final Capstone Project Submission',
      rating: 4.85,
      workload: '8 hours/week',
    },
    {
      id: '4',
      title: 'Full-Stack Web Development: NestJS & Next.js',
      institution: 'Apex Institute & Unicon Soft',
      description: 'Build scalable modern backend architectures with NestJS, Prisma, PostgreSQL, and high-performance Next.js 15 frontends.',
      progress: 52,
      category: 'Computer Science',
      instructor: 'Sardor Sunatullayev',
      nextDeadline: 'Module 4 Lab: JWT & Guard Implementation',
      rating: 4.95,
      workload: '12 hours/week',
    },
  ];

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ffffff] text-gray-900 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0056D2] border-t-transparent"></div>
          <p className="text-xs font-medium text-gray-500 tracking-wide">Loading your Coursera learning dashboard...</p>
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
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] flex flex-col font-sans selection:bg-[#0056D2] selection:text-white">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F1F1F] text-white px-4 py-3 rounded-lg shadow-xl border border-gray-800 text-xs font-medium flex items-center gap-3 animate-slideUp">
          <span className="h-2 w-2 rounded-full bg-[#0056D2]"></span>
          <span>{toast}</span>
        </div>
      )}

      {/* Coursera Global Top Navbar */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-xl font-black tracking-tighter text-[#0056D2]">Coursera</span>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-[#0056D2]/10 text-[#0056D2] px-2 py-0.5 rounded">Plus</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'overview', label: 'My Learning' },
              { id: 'catalog', label: 'Catalog' },
              { id: 'certificates', label: 'Accomplishments' },
              { id: 'settings', label: 'Account Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#0056D2] bg-[#0056D2]/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-72">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="What do you want to learn?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-gray-900 placeholder-gray-400 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="h-8 w-8 rounded-full bg-[#0056D2] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              SS
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-600 hover:text-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden bg-white border-b border-gray-200 overflow-x-auto px-4 py-2 gap-2">
        {[
          { id: 'overview', label: 'Learning' },
          { id: 'catalog', label: 'Catalog' },
          { id: 'certificates', label: 'Certificates' },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
              activeTab === tab.id ? 'bg-[#0056D2] text-white' : 'text-gray-600 bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 space-y-8">
        {activeTab === 'overview' && (
          <>
            {/* Learner Welcome & Metrics */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#0056D2] uppercase tracking-wider">Subscriber Pass Active</span>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, Sardor Sunatullayev</h1>
                <p className="text-xs text-gray-500">You are on a 12-day learning streak. Keep up the momentum to hit your weekly goal.</p>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">Weekly Goal</p>
                  <p className="text-lg font-bold text-gray-900">4.5 / 5 hrs</p>
                </div>
                <div className="h-10 w-px bg-gray-200"></div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">Completed</p>
                  <p className="text-lg font-bold text-emerald-600">3 Courses</p>
                </div>
              </div>
            </div>

            {/* Resume Banner */}
            <div className="bg-gradient-to-r from-[#003087] to-[#0056D2] text-white rounded-xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl relative z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded">
                    Stanford University
                  </span>
                  <span className="text-xs text-blue-100 font-medium">⭐ 4.9 (184,200 learners)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Machine Learning Specialization</h2>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Continue learning: Neural Networks Intuition & Forward Propagation in Python.
                </p>
              </div>
              <button
                onClick={() => showToast('Launching Stanford classroom session...')}
                className="relative z-10 bg-white text-[#0056D2] hover:bg-gray-50 px-6 py-3 rounded-lg text-xs font-bold shadow-sm transition-all whitespace-nowrap active:scale-95"
              >
                Resume Learning →
              </button>
            </div>
          </>
        )}

        {activeTab === 'certificates' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Accomplishments & Certificates</h2>
              <p className="text-xs text-gray-500 mt-0.5">Verified certificates issued by top universities and industry leaders.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Google UX Design Professional', issuer: 'Google', date: 'January 2026', credentialId: 'GL-8923-UX' },
                { title: 'Python for Data Engineering', issuer: 'IBM', date: 'June 2025', credentialId: 'IBM-4912-DE' },
                { title: 'Financial Markets', issuer: 'Yale University', date: 'November 2025', credentialId: 'YALE-FM-22' },
              ].map((cert, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-[#0056D2] transition-colors bg-gray-50/50">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded inline-block">
                      Verified Credential
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">{cert.title}</h3>
                    <p className="text-xs text-gray-500 font-medium">{cert.issuer} • Issued {cert.date}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-mono text-[11px]">{cert.credentialId}</span>
                    <button
                      onClick={() => showToast(`Downloading ${cert.credentialId}.pdf`)}
                      className="text-[#0056D2] font-semibold hover:underline"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 max-w-xl shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Account Settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage your learner profile and verification credentials.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Registered Email</label>
                <input type="email" disabled value="sardor@apexlearn.uz" className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name (Displayed on Certificates)</label>
                <input type="text" defaultValue="Sardor Sunatullayev" className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#0056D2] focus:ring-1 focus:ring-[#0056D2]" />
              </div>
              <button
                onClick={() => showToast('Profile settings saved successfully.')}
                className="bg-[#0056D2] hover:bg-[#00419E] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {(activeTab === 'overview' || activeTab === 'catalog') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Enrolled Specializations & Courses</h2>
                <p className="text-xs text-gray-500 mt-0.5">Filter across university degrees and professional tracks</p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {['All', 'Data Science', 'Business', 'Design', 'Computer Science'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filterCategory === cat
                        ? 'bg-[#0056D2] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Course Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCourses.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium">No courses match your search criteria.</p>
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:border-gray-300 hover:shadow-md transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded">
                          {course.institution}
                        </span>
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                          <span className="text-amber-500">★</span> {course.rating}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0056D2] transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#0056D2] font-semibold">Taught by: {course.instructor}</p>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{course.description}</p>
                      
                      {course.nextDeadline && (
                        <div className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded">
                          📌 {course.nextDeadline}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-6 border-t border-gray-100 mt-6">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                        <span>Progress</span>
                        <span className="text-[#0056D2]">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#0056D2] h-full rounded-full transition-all duration-500"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <button
                        onClick={() => showToast(`Opening classroom for ${course.title}`)}
                        className="w-full bg-gray-50 hover:bg-[#0056D2] hover:text-white border border-gray-200 hover:border-[#0056D2] py-2.5 rounded-lg text-xs font-bold text-gray-800 transition-colors"
                      >
                        Go to course →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}