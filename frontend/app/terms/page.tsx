'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
              <img
                src="/images/image.png"
                alt="ApexLearn Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Terms of Service</h1>
              <p className="text-xs text-slate-400">Effective Date: October 6, 2026</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
          >
            ← Go Back
          </button>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By creating an account, accessing, or using ApexLearn ("Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. User Accounts & Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information upon registration.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Course Purchases & Refunds</h2>
            <p>
              Courses offered on ApexLearn may be free or paid. Payments are processed securely via Stripe. Paid courses grant a non-exclusive, non-transferable license to stream and view course materials for personal educational purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Intellectual Property</h2>
            <p>
              All course content, video streams, text, images, and brand assets available on ApexLearn are protected by copyright and intellectual property laws. Redistribution or resale of course materials is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Code of Conduct</h2>
            <p>
              Users agree not to upload malicious code, engage in fraudulent transactions, or abuse student support channels. Violation of platform guidelines may result in immediate account suspension.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">6. Changes to Terms</h2>
            <p>
              ApexLearn reserves the right to update these terms at any time. Continued use of the service following updates constitutes acceptance of the modified terms.
            </p>
          </section>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 ApexLearn Inc. All rights reserved.</p>
          <div className="flex gap-4 font-semibold text-violet-400">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
