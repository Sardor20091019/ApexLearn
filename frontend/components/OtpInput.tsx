'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  status?: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  successMessage?: string;
  resendSeconds?: number;
  onResend?: () => Promise<void> | void;
  isResending?: boolean;
  targetEmail?: string;
  onEditEmail?: () => void;
  variant?: 'warm' | 'dashboard';
  isDark?: boolean;
  label?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  status = 'idle',
  errorMessage,
  successMessage,
  resendSeconds = 45,
  onResend,
  isResending = false,
  targetEmail,
  onEditEmail,
  variant = 'warm',
  isDark = false,
  label = 'Verification Code',
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(resendSeconds);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [shouldShake, setShouldShake] = useState(false);

  // Convert string value to array of characters
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  // Trigger subtle shake animation on error
  useEffect(() => {
    if (status === 'error') {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 600);
      return () => clearTimeout(timer);
    }
  }, [status, errorMessage]);

  // Auto-focus first empty box on load
  useEffect(() => {
    if (autoFocus && !disabled) {
      const firstEmptyIndex = digits.findIndex((d) => !d);
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputRefs.current[targetIndex]?.focus();
    }
  }, [autoFocus, disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      setIsResendDisabled(true);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleResendClick = async () => {
    if (isResendDisabled || isResending || !onResend) return;
    try {
      await onResend();
      setCountdown(resendSeconds);
      setIsResendDisabled(true);
      // Clear inputs and refocus first box
      onChange('');
      inputRefs.current[0]?.focus();
    } catch {
      // Handled by parent
    }
  };

  const updateDigits = useCallback(
    (newDigits: string[], triggerComplete = true) => {
      const sanitized = newDigits.join('').slice(0, length);
      onChange(sanitized);

      if (triggerComplete && sanitized.length === length && onComplete) {
        onComplete(sanitized);
      }
    },
    [length, onChange, onComplete],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, '');

    // Handle mobile auto-fill or pasting into a single input field
    if (cleanDigits.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < cleanDigits.length && index + i < length; i++) {
        newDigits[index + i] = cleanDigits[i];
      }
      updateDigits(newDigits);

      const nextFocus = Math.min(length - 1, index + cleanDigits.length);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigit = cleanDigits.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = newDigit;
    updateDigits(newDigits);

    if (newDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current box is already empty, move to previous box and clear it
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        updateDigits(newDigits, false);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box
        const newDigits = [...digits];
        newDigits[index] = '';
        updateDigits(newDigits, false);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleanDigits = pastedText.replace(/\D/g, '').slice(0, length);

    if (!cleanDigits) return;

    const newDigits = Array.from({ length }, (_, i) => cleanDigits[i] || '');
    updateDigits(newDigits);

    // Focus the box following the last pasted digit, or the final box
    const nextIndex = Math.min(length - 1, cleanDigits.length);
    inputRefs.current[nextIndex]?.focus();
  };

  const isComplete = value.length === length;
  const isDashboard = variant === 'dashboard';

  const getInputClass = (index: number) => {
    const isFilled = Boolean(digits[index]);
    if (status === 'error') {
      return isDashboard
        ? (isDark
            ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-200 focus:ring-3 focus:ring-rose-500/30'
            : 'bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-500 text-rose-900 dark:text-rose-200 focus:ring-3 focus:ring-rose-200')
        : 'bg-rose-50/70 border-2 border-rose-400 text-rose-900 focus:ring-3 focus:ring-rose-200';
    }
    if (status === 'success') {
      return isDashboard
        ? (isDark
            ? 'bg-emerald-950/40 border-2 border-emerald-500 text-emerald-200 focus:ring-3 focus:ring-emerald-500/30'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 focus:ring-3 focus:ring-emerald-200')
        : 'bg-emerald-50/70 border-2 border-emerald-500 text-[#34592B] focus:ring-3 focus:ring-emerald-200';
    }
    if (isFilled) {
      return isDashboard
        ? (isDark
            ? 'bg-violet-950/40 border-2 border-violet-400 text-white shadow-xs'
            : 'bg-violet-50/80 dark:bg-violet-950/40 border-2 border-violet-600 dark:border-violet-400 text-slate-900 dark:text-white shadow-xs')
        : 'bg-[#FAF7F2] border-2 border-stone-800 text-stone-900 shadow-xs';
    }
    return isDashboard
      ? (isDark
          ? 'bg-black/35 border border-white/15 text-white hover:border-violet-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/25 focus:scale-[1.02]'
          : 'bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white hover:border-violet-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 focus:scale-[1.02]')
      : 'bg-[#FAF7F2] border border-[#D8CEBF] text-stone-900 hover:border-stone-400 focus:border-[#8C6D53] focus:ring-2 focus:ring-[#8C6D53]/20 focus:scale-[1.02]';
  };

  return (
    <div className="w-full space-y-4 text-left">
      {/* Header Info: Target Email & Edit action */}
      {targetEmail && (
        <div
          className={`flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl ${
            isDashboard
              ? (isDark
                  ? 'bg-white/5 border border-white/10 text-slate-300'
                  : 'bg-violet-500/10 dark:bg-white/5 border border-violet-500/20 dark:border-white/10 text-slate-700 dark:text-slate-300')
              : 'bg-stone-100/70 border border-stone-200/80 text-stone-600'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="opacity-60 text-[11px]">Sent to:</span>
            <span className="font-bold truncate font-mono text-[11px]">{targetEmail}</span>
          </div>
          {onEditEmail && (
            <button
              type="button"
              onClick={onEditEmail}
              disabled={disabled || status === 'loading'}
              className={`font-bold hover:underline shrink-0 text-[11px] cursor-pointer ${
                isDashboard ? (isDark ? 'text-violet-400' : 'text-violet-600 dark:text-violet-400') : 'text-[#8C6D53] hover:text-stone-900'
              }`}
            >
              Change
            </button>
          )}
        </div>
      )}

      {/* Main OTP Input Group */}
      <div className="space-y-2">
        <label
          className={`block uppercase tracking-wider ${
            isDashboard
              ? (isDark
                  ? 'text-[11px] font-black opacity-90 text-slate-200'
                  : 'text-[11px] font-black opacity-80 text-slate-800 dark:text-slate-200')
              : 'text-[11px] font-bold text-stone-700'
          }`}
        >
          {label}
        </label>

        <div
          role="group"
          aria-label="One-time password input"
          className={`flex items-center justify-between gap-1.5 sm:gap-2.5 transition-transform ${
            shouldShake ? 'animate-shake' : ''
          }`}
        >
          {Array.from({ length }, (_, index) => {
            const isMiddleSeparator = length === 6 && index === 2;

            return (
              <React.Fragment key={index}>
                <div className="relative flex-1">
                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digits[index]}
                    disabled={disabled || status === 'loading'}
                    onChange={(e) => handleInputChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Digit ${index + 1} of ${length}`}
                    className={`
                      w-full h-11 sm:h-12 text-center font-mono text-xl sm:text-2xl font-black rounded-xl
                      transition-all duration-200 outline-none select-none
                      ${getInputClass(index)}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  />
                  {/* Subtle placeholder dot when empty */}
                  {!digits[index] && (
                    <span className={`pointer-events-none absolute inset-0 flex items-center justify-center font-sans text-2xl select-none ${
                      isDark ? 'text-white/20' : 'text-slate-300 dark:text-white/20'
                    }`}>
                      ·
                    </span>
                  )}
                </div>

                {/* Cognitive divider between groups of 3 digits */}
                {isMiddleSeparator && (
                  <div className={`flex items-center justify-center font-bold px-0.5 select-none text-lg ${
                    isDark ? 'text-white/30' : 'text-slate-300 dark:text-white/20'
                  }`}>
                    –
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Dynamic Status Feedback */}
      <div aria-live="polite" className="min-h-5 flex items-center text-xs">
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold animate-pulse">
            <svg className="animate-spin h-3.5 w-3.5 text-violet-600" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Verifying code...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage || 'Code verified successfully!'}</span>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold">
            <svg className="w-4 h-4 text-rose-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {status === 'idle' && !errorMessage && (
          <p className="text-[11px] opacity-70">
            {isComplete ? 'Code entered. Ready to proceed.' : 'Enter the 6 digits sent to your email.'}
          </p>
        )}
      </div>

      {/* Human-Friendly Resend Timer Section */}
      {onResend && (
        <div
          className={`pt-2 border-t flex items-center justify-between text-xs ${
            isDashboard
              ? (isDark ? 'border-white/10 text-slate-300' : 'border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300')
              : 'border-stone-200/80'
          }`}
        >
          <span className="opacity-70 font-medium">Didn't receive code?</span>

          {countdown > 0 ? (
            <div
              className={`flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-lg ${
                isDashboard
                  ? (isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-300')
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Resend in <strong>{countdown}s</strong></span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResendClick}
              disabled={isResendDisabled || isResending || disabled}
              className={`font-bold transition-colors cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                isDashboard ? (isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 dark:text-violet-400') : 'text-[#8C6D53] hover:text-stone-900'
              }`}
            >
              {isResending ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>↻ Resend Code</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* CSS Shake Animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
};

