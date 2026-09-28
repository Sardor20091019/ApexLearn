'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// High-Performance Interactive Canvas Dot Grid with Repulsion (Wide Gap Effect)
function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000, active: false };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const spacing = 32;
    const maxDistance = 130;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          const dx = x - mouseRef.current.x;
          const dy = y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let renderX = x;
          let renderY = y;
          let alpha = 0.2;
          let dotRadius = 1.2;

          if (mouseRef.current.active && dist < maxDistance) {
            const force = (1 - dist / maxDistance);
            const angle = Math.atan2(dy, dx);
            const push = force * 26;
            
            renderX += Math.cos(angle) * push;
            renderY += Math.sin(angle) * push;

            alpha = 0.2 + force * 0.6;
            dotRadius = 1.2 + force * 1.6;
          }

          ctx.beginPath();
          ctx.arc(renderX, renderY, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
    />
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'request' | 'verify'>('request');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mouse tracking for reactive spotlight
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!leftPanelRef.current) return;
    const rect = leftPanelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (isForgotPassword) {
      if (forgotPasswordStep === 'request') {
        // Step 1: Request OTP
        try {
          const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Failed to send OTP');
          }

          setSuccessMessage('OTP sent to your email. Please check your inbox.');
          setForgotPasswordStep('verify');
        } catch (err: any) {
          setError(err.message || 'Failed to connect to backend server');
        } finally {
          setIsLoading(false);
        }
        return;
      } else {
        // Step 2: Verify OTP & Reset Password
        try {
          const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Failed to reset password');
          }

          setSuccessMessage('Password reset successful! Redirecting to sign in...');
          setTimeout(() => {
            setIsForgotPassword(false);
            setForgotPasswordStep('request');
            setIsLogin(true);
            setSuccessMessage('');
            setPassword('');
            setOtp('');
            setNewPassword('');
          }, 1500);
        } catch (err: any) {
          setError(err.message || 'Failed to connect to backend server');
        } finally {
          setIsLoading(false);
        }
        return;
      }
    }

    // Standard Sign In / Sign Up Request
    const endpoint = isLogin ? `${API_BASE_URL}/auth/signin` : `${API_BASE_URL}/auth/signup`;
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Authentication failed');
      }

      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('access_token', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      setSuccessMessage(isLogin ? 'Successfully authenticated! Redirecting...' : 'Account created successfully! Redirecting...');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#111827] flex flex-col lg:flex-row font-sans selection:bg-[#0056D2] selection:text-white overflow-x-hidden">
      
      {/* Left Column: Reactive Awwwards-Style Showcase */}
      <div 
        ref={leftPanelRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="lg:w-1/2 bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0A0E17] p-8 sm:p-12 lg:p-20 flex flex-col justify-between relative text-white border-b lg:border-b-0 lg:border-r border-slate-800/80 overflow-hidden cursor-crosshair group"
      >
        <InteractiveDotGrid />

        <div 
          className="absolute pointer-events-none transition-opacity duration-500 rounded-full blur-[90px] z-10"
          style={{
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(0, 115, 255, 0.25) 0%, rgba(56, 189, 248, 0.1) 50%, transparent 80%)',
            left: `${mousePos.x - 200}px`,
            top: `${mousePos.y - 200}px`,
            opacity: isHovered ? 1 : 0.4,
          }}
        />

        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-20 flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#003087] via-[#0056D2] to-[#38bdf8] flex items-center justify-center font-black text-lg text-white shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
            A
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block leading-tight">ApexLearn</span>
            <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest block">Enterprise Academy</span>
          </div>
        </div>

        <div className="relative z-20 my-12 lg:my-0 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold backdrop-blur-md shadow-inner">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping"></span>
            Professional Engineering Paths
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-white leading-[1.1]">
            Build production-grade systems with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">absolute confidence</span>.
          </h1>
          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            Master full-stack architecture, chunked MinIO storage pipelines, Redis queues, and scalable microservices.
          </p>
        </div>

        <div className="relative z-20 pt-6 border-t border-slate-800/80 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-xs text-white shadow-md ring-1 ring-white/10">
            SS
          </div>
          <div>
            <p className="text-xs font-extrabold text-white">Sardor Sunatullayev</p>
            <p className="text-[11px] text-slate-400 font-medium">Lead Developer & Instructor</p>
          </div>
        </div>
      </div>

      {/* Right Column: Clean Light-Mode Auth Form Card */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-[#FAFAFC] relative">
        <div className="w-full max-w-[440px] bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-200/50 relative z-10">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-1.5">
              {isForgotPassword 
                ? (forgotPasswordStep === 'request' ? 'Reset password' : 'Enter OTP & New Password') 
                : isLogin 
                ? 'Welcome back' 
                : 'Create an account'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isForgotPassword 
                ? (forgotPasswordStep === 'request' 
                    ? "Enter your email address and we'll send you a 6-digit OTP" 
                    : `Enter the 6-digit code sent to ${email}`) 
                : isLogin 
                ? 'Enter your credentials to access your dashboard' 
                : 'Sign up to unlock professional courses'}
            </p>
          </div>

          {/* Error / Success Banners */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            {!isForgotPassword && !isLogin && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin && !isForgotPassword}
                  placeholder="Sardor Sunatullayev"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/20 transition-all shadow-2xs"
                />
              </div>
            )}

            {/* Email Field (disabled in verify step of forgot password) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isForgotPassword && forgotPasswordStep === 'verify'}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/20 transition-all shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Forgot Password Verify Step Inputs */}
            {isForgotPassword && forgotPasswordStep === 'verify' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">6-Digit OTP Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/20 transition-all shadow-2xs tracking-widest font-mono text-center text-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/20 transition-all shadow-2xs pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-[11px] font-bold"
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Standard Password Field */}
            {!isForgotPassword && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">Password</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={() => { 
                        setIsForgotPassword(true); 
                        setForgotPasswordStep('request'); 
                        setError(''); 
                        setSuccessMessage(''); 
                      }} 
                      className="text-[11px] text-[#0056D2] hover:underline font-bold"
                    >
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/20 transition-all shadow-2xs pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-[11px] font-bold"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {!isLogin && <span className="text-[10px] text-slate-400 block mt-1 font-medium">Minimum 8 characters required</span>}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#0056D2] hover:bg-[#00419E] text-white font-extrabold py-4 rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed active:scale-98"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <span>
                  {isForgotPassword 
                    ? (forgotPasswordStep === 'request' ? 'Send Reset OTP' : 'Reset Password') 
                    : isLogin 
                    ? 'Sign In to Dashboard' 
                    : 'Create Account'}
                </span>
              )}
            </button>
          </form>

          {/* Footer Toggle */}
          <div className="text-center mt-8 pt-6 border-t border-slate-100">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => { 
                  setIsForgotPassword(false); 
                  setForgotPasswordStep('request'); 
                  setError(''); 
                  setSuccessMessage(''); 
                }}
                className="text-xs text-[#0056D2] font-extrabold hover:underline transition-colors"
              >
                ← Back to Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="text-[#0056D2] font-extrabold hover:underline ml-1">{isLogin ? 'Sign Up' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}