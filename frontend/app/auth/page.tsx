'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

function InteractiveDrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const hueRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI (Retina) scaling for sharp mobile & desktop rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas) return;
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx?.drawImage(canvas, 0, 0);

      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
      ctx.drawImage(tempCanvas, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
    };

    window.addEventListener('resize', handleResize);

    const getPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const startDrawing = (clientX: number, clientY: number) => {
      isDrawingRef.current = true;
      lastPosRef.current = getPos(clientX, clientY);
    };

    const drawLine = (clientX: number, clientY: number) => {
      if (!isDrawingRef.current) return;
      const pos = getPos(clientX, clientY);

      hueRef.current = (hueRef.current + 3) % 360;
      ctx.strokeStyle = `hsl(${hueRef.current}, 95%, 55%)`;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      lastPosRef.current = pos;
    };

    const stopDrawing = () => {
      isDrawingRef.current = false;
    };

    // Native touch listeners with { passive: false } to allow e.preventDefault() and prevent page scroll on mobile
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        startDrawing(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        drawLine(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    const onMouseDown = (e: MouseEvent) => {
      startDrawing(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      drawLine(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      stopDrawing();
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
      />
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={clearCanvas}
          className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-stone-800 text-xs font-extrabold shadow-lg backdrop-blur-sm transition-all border border-amber-200 active:scale-95 flex items-center gap-2"
        >
          <span>🧹 Clear Doodle</span>
        </button>
      </div>
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

  useEffect(() => {
    try {
      const notice = sessionStorage.getItem("auth_notice");
      if (notice) {
        setError(notice);
        sessionStorage.removeItem("auth_notice");
      }
    } catch {}
  }, []);

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

      <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col lg:flex-row font-sans selection:bg-amber-400 selection:text-stone-900 overflow-x-hidden">
        

        <div className="lg:w-1/2 bg-gradient-to-br from-amber-100/70 via-rose-100/40 to-sky-100/60 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-[#E3DACF] overflow-hidden min-h-[400px]">
          
          <div className="absolute top-10 left-10 w-72 h-72 bg-amber-300/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-300/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center font-black text-sm text-white shadow-md">
                🌈
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-stone-900 block leading-tight">Creative Canvas</span>
                <span className="text-[10px] text-amber-800 font-bold uppercase tracking-widest block">Draw & Express</span>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-amber-200 text-xs font-bold text-stone-700 shadow-xs">
              ✨ Draw here!
            </div>
          </div>

          <div className="relative z-20 my-auto text-center pointer-events-none">
            <div className="inline-block bg-white/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/80 shadow-sm">
              <h1 className="text-xl sm:text-2xl font-black text-stone-800 mb-1">
                Doodle your own sunshine & rainbows! ☀️
              </h1>
              <p className="text-xs text-stone-600 font-medium">
                Tap and drag anywhere on this panel to draw with rainbow strokes.
              </p>
            </div>
          </div>

          <InteractiveDrawingCanvas />

        </div>


        <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-[#FAF7F2] relative">
          <div className="w-full max-w-[440px] bg-[#F3EEE7] border border-[#E3DACF] rounded-3xl p-8 sm:p-10 shadow-xl shadow-stone-200/50 relative z-10 transition-all duration-300">
            
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
      </div>
    </>
  );
}