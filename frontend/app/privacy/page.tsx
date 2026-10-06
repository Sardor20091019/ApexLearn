'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-lg shadow-lg">
              A
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Privacy Policy</h1>
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
            <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when registering an account, purchasing courses, or contacting student support. This includes your name, email address, password hash, and course progress data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. How We Use Your Data</h2>
            <p>
              Your data is used to provide, personalize, and improve ApexLearn services, process payment transactions securely via Stripe, deliver course progress metrics, and send enrollment confirmations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Payment Security & Processing</h2>
            <p>
              Payment credentials (such as credit card numbers) are handled directly by Stripe in compliance with PCI-DSS standards. ApexLearn does not store full payment card details on our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Data Storage & Protection</h2>
            <p>
              We employ encryption in transit (HTTPS/TLS) and at rest (PostgreSQL security controls) to safeguard your personal information against unauthorized access or disclosure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Cookies & Local Storage</h2>
            <p>
              We use local storage and session tokens to store authentication access state, cart selections, and user theme preferences.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">6. Contact Us</h2>
            <p>
              If you have any questions regarding this Privacy Policy or wish to request data removal, please reach out via our Student Support Center on the dashboard.
            </p>
          </section>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 ApexLearn Inc. All rights reserved.</p>
          <div className="flex gap-4 font-semibold text-cyan-400">
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
