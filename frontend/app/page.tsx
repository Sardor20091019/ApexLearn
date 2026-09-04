'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    const apiUrl = 'http://localhost:4000';
    const endpoint = isLogin ? `${apiUrl}/auth/signin` : `${apiUrl}/auth/signup`;
    const payload = isLogin ? { email, password } : { name, email, password };

    console.log('🚀 --- SUBMIT STARTED ---');
    console.log('Mode:', isLogin ? 'Sign In' : 'Sign Up');
    console.log('Target Endpoint:', endpoint);
    console.log('Payload being sent:', payload);

    try {
      console.log('📡 Executing fetch request...');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response Status:', response.status);
      console.log('📥 Response OK:', response.ok);

      const data = await response.json();
      console.log('📦 Response Data Body:', data);

      if (!response.ok) {
        throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Something went wrong');
      }

      console.log('🔑 Storing tokens in localStorage...');
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      setSuccessMessage(isLogin ? 'Logged in successfully!' : 'Account created successfully!');
      
      setTimeout(() => {
        console.log('🔄 Redirecting to /dashboard...');
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      console.error('❌ Catch block triggered:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] flex flex-col lg:flex-row font-sans selection:bg-[#0056D2] selection:text-white overflow-x-hidden">
      {/* Left Column: Brand Showcase & Value Proposition */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#002B49] via-[#003C70] to-[#0056D2] p-8 sm:p-12 lg:p-20 flex flex-col justify-between relative text-white border-b lg:border-b-0 lg:border-r border-blue-900/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-white text-[#0056D2] flex items-center justify-center font-black text-xl shadow-xl">
            A
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white block leading-tight">ApexLearn</span>
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-widest block">Enterprise Academy</span>
          </div>
        </div>

        {/* Center Hero Copy */}
        <div className="relative z-10 my-12 lg:my-0 space-y-5 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            NestJS Backend & Next.js Architecture
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
            Build production-grade systems with absolute confidence.
          </h1>
          <p className="text-sm sm:text-base text-blue-100 font-normal leading-relaxed">
            Access enterprise courses, chunked MinIO storage pipelines, Redis background queues, and real-time WebSocket communication.
          </p>
        </div>

        {/* Bottom Creator Info */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xs text-white shadow-sm">
            SS
          </div>
          <div>
            <p className="text-xs font-bold text-white">Sardor Sunatullayev</p>
            <p className="text-[11px] text-blue-200">Backend Developer & Creator</p>
          </div>
        </div>
      </div>

      {/* Right Column: Clean Light-Mode Auth Form Card */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-[#F8F9FA] relative">
        <div className="w-full max-w-[440px] bg-white border border-gray-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-gray-200/60 relative z-10">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-1.5">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              {isLogin ? 'Enter your credentials to access your dashboard' : 'Sign up to unlock professional engineering courses'}
            </p>
          </div>

          {/* Error / Success Banners */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fadeIn">
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
              <span className="leading-tight">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fadeIn">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
              <span className="leading-tight">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  placeholder="Sardor Sunatullayev"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/20 transition-all shadow-2xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/20 transition-all shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">Password (min 8 chars)</label>
                {isLogin && (
                  <button type="button" onClick={() => alert('Password reset instructions sent.')} className="text-[11px] text-[#0056D2] hover:underline font-bold">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/20 transition-all shadow-2xs pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-[11px] font-bold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 bg-[#0056D2] hover:bg-[#00419E] text-white font-extrabold py-4 rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed active:scale-98"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <span>{isLogin ? 'Sign In to Dashboard' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Footer Toggle */}
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }}
              className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="text-[#0056D2] font-extrabold hover:underline ml-1">{isLogin ? 'Sign Up' : 'Sign In'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}