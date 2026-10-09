'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, setAuthToken, isTokenExpired } from '../../lib/auth';

function AppleHelloTransition({ onComplete }: { onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const greetings = [
    { text: "Hello", gradient: "from-stone-900 via-stone-800 to-amber-900" },
    { text: "Salom", gradient: "from-amber-700 via-rose-700 to-purple-800" },
    { text: "Bonjour", gradient: "from-blue-700 via-teal-700 to-emerald-800" },
    { text: "Hola", gradient: "from-orange-700 via-pink-700 to-rose-800" },
    { text: "Ciao", gradient: "from-emerald-700 via-cyan-700 to-blue-800" },
    { text: "こんにちは", gradient: "from-purple-700 via-pink-700 to-rose-700" },
    { text: "안녕하세요", gradient: "from-amber-800 via-red-700 to-orange-800" },
    { text: "你好", gradient: "from-cyan-800 via-blue-700 to-indigo-800" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev < greetings.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setIsFadingOut(true);
          setTimeout(onComplete, 600);
          return prev;
        }
      });
    }, 400); // Fluid timing per greeting

    return () => clearInterval(interval);
  }, [greetings.length, onComplete]);

  return (
    <div className={`fixed inset-0 z-50 bg-[#FAF7F2]/85 backdrop-blur-3xl flex items-center justify-center overflow-hidden transition-all duration-700 ease-out ${isFadingOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>
      

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-300/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-300/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 text-center px-6">
        <div className="h-48 flex items-center justify-center">
          <span 
            key={currentIndex}
            className={`text-6xl sm:text-8xl lg:text-9xl font-serif italic font-light tracking-wide bg-gradient-to-r ${greetings[currentIndex].gradient} bg-clip-text text-transparent`}
            style={{
              fontFamily: "'Playfair Display', 'Dancing Script', 'Caveat', Georgia, serif",
              animation: 'comeAndLeave 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            {greetings[currentIndex].text}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes comeAndLeave {
          0% {
            opacity: 0;
            transform: translateY(35px) scale(0.92);
            filter: blur(10px);
          }
          30% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          70% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: translateY(-35px) scale(1.06);
            filter: blur(10px);
          }
        }
      `}</style>
    </div>
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
  const [showHelloTransition, setShowHelloTransition] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '210623201179-5m7ldfjiamtj939t9qstgnb9q1sneo3e.apps.googleusercontent.com';

  useEffect(() => {
    // Check URL query parameters for OAuth redirect callback
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const refresh = params.get('refresh');
      const err = params.get('error');

      if (err) {
        setError(decodeURIComponent(err));
      } else if (token) {
        setAuthToken(token, refresh || undefined);
        setSuccessMessage('Successfully signed in with Google!');
        setShowHelloTransition(true);
        return;
      }
    }

    try {
      const notice = sessionStorage.getItem("auth_notice");
      if (notice) {
        setError(notice);
        sessionStorage.removeItem("auth_notice");
      }
    } catch {}

    const token = getAuthToken();
    if (token && !isTokenExpired(token)) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleGoogleCredential = async (credential: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }
      if (data.accessToken) {
        setAuthToken(data.accessToken, data.refreshToken);
      }
      setSuccessMessage('Successfully authenticated with Google!');
      setTimeout(() => {
        setShowHelloTransition(true);
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setError('');
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            if (response.credential) {
              handleGoogleCredential(response.credential);
            }
          },
        });
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            window.location.href = `${API_BASE_URL}/auth/google`;
          }
        });
        return;
      } catch (e) {
        console.warn('Google prompt fallback:', e);
      }
    }
    // Direct redirect flow fallback
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFQSRo6sBGqF0bm7';

  // Render or reset Cloudflare Turnstile when login state changes
  useEffect(() => {
    if (!isLogin || isForgotPassword) {
      if (turnstileWidgetId.current && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(turnstileWidgetId.current);
        } catch {}
        turnstileWidgetId.current = null;
      }
      setTurnstileToken('');
      return;
    }

    let interval: NodeJS.Timeout;
    const renderWidget = () => {
      if (typeof window !== 'undefined' && (window as any).turnstile && turnstileContainerRef.current) {
        if (!turnstileWidgetId.current) {
          try {
            turnstileWidgetId.current = (window as any).turnstile.render(turnstileContainerRef.current, {
              sitekey: TURNSTILE_SITE_KEY,
              callback: (token: string) => {
                setTurnstileToken(token);
                setError('');
              },
              'error-callback': () => {
                setTurnstileToken('');
              },
              'expired-callback': () => {
                setTurnstileToken('');
              },
              theme: 'light',
            });
          } catch (e) {
            console.error('Failed to render Turnstile widget', e);
          }
        }
        clearInterval(interval);
      }
    };

    interval = setInterval(renderWidget, 100);
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLogin, isForgotPassword, TURNSTILE_SITE_KEY]);


  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (isForgotPassword) {
      if (forgotPasswordStep === 'request') {
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

    if (isLogin && TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Please complete the Cloudflare security verification.');
      return;
    }

    const endpoint = isLogin ? `${API_BASE_URL}/auth/signin` : `${API_BASE_URL}/auth/signup`;
    const payload = isLogin 
      ? { email, password, turnstileToken } 
      : { name, email, password };

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
        setAuthToken(data.accessToken, data.refreshToken);
      }

      setSuccessMessage(isLogin ? 'Successfully authenticated!' : 'Account created successfully!');
      

      setTimeout(() => {
        setShowHelloTransition(true);
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showHelloTransition && (
        <AppleHelloTransition onComplete={() => router.push('/dashboard')} />
      )}

      <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col items-center justify-center p-4 sm:p-8 font-sans selection:bg-amber-400 selection:text-stone-900 relative overflow-x-hidden">
        
        {/* Ambient soft glow backdrop */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-300/20 rounded-full blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-300/20 rounded-full blur-[130px] pointer-events-none"></div>

        {/* Navigation back bar */}
        <div className="w-full max-w-[440px] mb-4 flex items-center justify-between relative z-10">
          <Link
            href="/"
            className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1.5"
          >
            <span>← Back to Home</span>
          </Link> 
        </div>

        <div className="w-full max-w-[440px] bg-[#F3EEE7] border border-[#E3DACF] rounded-3xl p-8 sm:p-10 shadow-xl shadow-stone-200/50 relative z-10 transition-all duration-300">
            
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white border border-[#E3DACF] shadow-sm flex items-center justify-center p-1 overflow-hidden shrink-0">
                <img
                  src="/images/image.png"
                  alt="ApexLearn Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-stone-900 block leading-none">ApexLearn</span>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Access Portal</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-black tracking-tight text-stone-900 mb-1.5">
                {isForgotPassword 
                  ? (forgotPasswordStep === 'request' ? 'Reset password' : 'Enter OTP & New Password') 
                  : isLogin 
                  ? 'Welcome back' 
                  : 'Create an account'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium">
                {isForgotPassword 
                  ? (forgotPasswordStep === 'request' 
                      ? "Enter your email address and we'll send you a 6-digit OTP" 
                      : `Enter the 6-digit code sent to ${email}`) 
                  : isLogin 
                  ? 'Enter your credentials to access your dashboard' 
                  : 'Sign up to unlock professional courses'}
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-[#34592B] px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
                <span>{successMessage}</span>
              </div>
            )}

            {!isForgotPassword && (
              <div className="mb-6 space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-stone-50 border border-[#D8CEBF] text-stone-800 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative text-center my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#D8CEBF]" />
                  </div>
                  <span className="relative bg-[#F3EEE7] px-3 font-mono text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    or continue with email
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4.5">
              {!isForgotPassword && !isLogin && (
                <div className="space-y-1.5">
                  <label htmlFor="name-input" className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">Full Name</label>
                  <input
                    id="name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin && !isForgotPassword}
                    placeholder="Sardor Sunatullayev"
                    className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-4 py-3.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8C6D53] focus:ring-1 focus:ring-[#8C6D53] transition-all shadow-2xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email-input" className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">Email Address</label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isForgotPassword && forgotPasswordStep === 'verify'}
                  placeholder="name@example.com"
                  className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-4 py-3.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8C6D53] focus:ring-1 focus:ring-[#8C6D53] transition-all shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {isForgotPassword && forgotPasswordStep === 'verify' && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="otp-input" className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">6-Digit OTP Code</label>
                    <input
                      id="otp-input"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      placeholder="123456"
                      className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-4 py-3.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8C6D53] focus:ring-1 focus:ring-[#8C6D53] transition-all shadow-2xs tracking-widest font-mono text-center text-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="new-password-input" className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">New Password</label>
                    <div className="relative">
                      <input
                        id="new-password-input"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="••••••••"
                        className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-4 py-3.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8C6D53] focus:ring-1 focus:ring-[#8C6D53] transition-all shadow-2xs pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 text-[11px] font-bold"
                      >
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!isForgotPassword && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password-input" className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">Password</label>
                    {isLogin && (
                      <button 
                        type="button" 
                        onClick={() => { 
                          setIsForgotPassword(true); 
                          setForgotPasswordStep('request'); 
                          setError(''); 
                          setSuccessMessage(''); 
                        }} 
                        className="text-[11px] text-[#8C6D53] hover:underline font-bold"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="w-full bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl px-4 py-3.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8C6D53] focus:ring-1 focus:ring-[#8C6D53] transition-all shadow-2xs pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 text-[11px] font-bold"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {!isLogin && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1 h-1 w-full bg-[#E3DACF] rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${passwordStrength > 0 ? 'w-1/4 bg-rose-400' : 'w-0'}`}></div>
                        <div className={`h-full transition-all duration-300 ${passwordStrength > 1 ? 'w-1/4 bg-amber-400' : 'w-0'}`}></div>
                        <div className={`h-full transition-all duration-300 ${passwordStrength > 2 ? 'w-1/4 bg-[#8C6D53]' : 'w-0'}`}></div>
                        <div className={`h-full transition-all duration-300 ${passwordStrength > 3 ? 'w-1/4 bg-[#34592B]' : 'w-0'}`}></div>
                      </div>
                      <span className="text-[10px] text-stone-500 block font-medium">Use 8+ characters with a mix of letters, numbers & symbols</span>
                    </div>
                  )}
                </div>
              )}

              {isLogin && !isForgotPassword && (
                <div className="pt-1 pb-1 flex justify-center">
                  <div ref={turnstileContainerRef} className="min-h-[65px] flex items-center justify-center" />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-[#3E3228] hover:bg-[#2C231C] text-[#FAF7F2] font-extrabold py-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FAF7F2] border-t-transparent"></div>
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

            <div className="text-center mt-8 pt-6 border-t border-[#E3DACF]">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => { 
                    setIsForgotPassword(false); 
                    setForgotPasswordStep('request'); 
                    setError(''); 
                    setSuccessMessage(''); 
                  }}
                  className="text-xs text-[#8C6D53] font-extrabold hover:underline transition-colors"
                >
                  ← Back to Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }}
                  className="text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors"
                >
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span className="text-[#8C6D53] font-extrabold hover:underline ml-1">{isLogin ? 'Sign Up' : 'Sign In'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
    </>
  );
}