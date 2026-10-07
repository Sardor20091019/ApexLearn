"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface CertVerification {
  valid: boolean;
  status: string;
  certId: string;
  studentName: string;
  courseName: string;
  courseDescription?: string;
  instructorName?: string;
  issueDate?: string;
  verifiedAt?: string;
  issuer?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function VerifyCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const certId = (params?.certId as string) || "";

  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState("");

  useEffect(() => {
    if (!certId) return;

    setLoading(true);
    setError(null);

    fetch(`${API}/progress/verify-certificate/${certId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Certificate ID not found or invalid.");
        return res.json();
      })
      .then((data) => setCert(data))
      .catch((err) => setError(err.message || "Could not verify certificate."))
      .finally(() => setLoading(false));
  }, [certId]);

  const handleSearchAnother = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    router.push(`/verify/${encodeURIComponent(searchId.trim())}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-white/10 px-6 py-4 rounded-2xl border border-white/20 backdrop-blur-md">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold tracking-wide">Verifying Official Certificate Record...</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 space-y-6 text-center shadow-2xl">
          <div className="mx-auto grid h-16 w-16 place-items-center bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/40 text-3xl">
            ⚠️
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Certificate Record Not Found</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              We could not locate an official issue record for Certificate ID <code className="bg-black/50 px-2 py-0.5 rounded text-amber-300">{certId}</code>.
            </p>
          </div>

          <form onSubmit={handleSearchAnother} className="space-y-2 pt-2">
            <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider text-left">
              Verify Another Certificate ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. APEX-COURSE-2026"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition-all active:scale-95"
              >
                Verify
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-white/10">
            <Link
              href="/dashboard"
              className="text-xs text-slate-400 hover:text-white underline font-bold"
            >
              ← Back to Student Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-[32px] p-6 sm:p-10 shadow-[0_0_80px_rgba(16,185,129,0.15)] space-y-8 relative overflow-hidden">
        
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Verification Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
              <img
                src="/images/image.png"
                alt="ApexLearn Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Official Authenticated Record</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase">
                  Verified 100%
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">ApexLearn Verified Certificate</h1>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">Certificate ID</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-amber-400 bg-black/40 px-3 py-1 rounded-lg border border-white/10 inline-block">
              {cert.certId}
            </span>
          </div>
        </div>

        {/* Certificate Details Card */}
        <div className="bg-black/40 rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Certified Student</span>
              <p className="text-lg sm:text-xl font-black text-white">{cert.studentName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Authorized Instructor</span>
              <p className="text-base font-bold text-slate-200">{cert.instructorName || "ApexLearn Faculty"}</p>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completed Course</span>
            <p className="text-base sm:text-lg font-black text-emerald-400">{cert.courseName}</p>
            {cert.courseDescription && (
              <p className="text-xs text-slate-300 leading-relaxed pt-1">{cert.courseDescription}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Issued Date</span>
              <span className="font-bold text-white">
                {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "October 2026"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Issuing Authority</span>
              <span className="font-bold text-white">{cert.issuer || "ApexLearn Academy"}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verification Timestamp</span>
              <span className="font-mono text-slate-300 text-[11px]">
                {cert.verifiedAt ? new Date(cert.verifiedAt).toLocaleTimeString() : "Live Verified"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 active:scale-95"
          >
            ← Back to Student Dashboard
          </Link>

          <form onSubmit={handleSearchAnother} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Verify another ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="bg-black/50 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 flex-1 sm:w-48"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition-all active:scale-95 shrink-0"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}