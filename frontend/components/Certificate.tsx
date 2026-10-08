"use client";
import React, { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";

type CertificateProps = {
  courseName: string;
  studentName?: string;
  certificateId: string;
  issueDate: string;
  instructorName?: string;
};

export default function Certificate({
  courseName,
  studentName = "",
  certificateId,
  issueDate,
  instructorName = "ApexLearn Expert Faculty",
}: CertificateProps) {

  const name = studentName?.trim() || "Student";
  const [downloading, setDownloading] = useState(false);
  const [baseUrl, setBaseUrl] = useState("https://apex-learn-delta.vercel.app");
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const handleDownloadImage = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(certRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `ApexLearn-Certificate-${certificateId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate certificate image", err);
    } finally {
      setDownloading(false);
    }
  };

  const verificationUrl = `${baseUrl}/verify/${certificateId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    verificationUrl,
  )}`;

  const parsedDate = issueDate ? new Date(issueDate) : new Date();
  const issueYear = isNaN(parsedDate.getFullYear()) ? new Date().getFullYear() : parsedDate.getFullYear();
  const issueMonth = isNaN(parsedDate.getMonth()) ? new Date().getMonth() + 1 : parsedDate.getMonth() + 1;

  const linkedInCertUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
    courseName,
  )}&organizationName=ApexLearn&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(
    verificationUrl,
  )}&certId=${encodeURIComponent(certificateId)}`;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 w-full max-w-5xl bg-stone-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-stone-800">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-stone-200">
            Official Issued Certificate for <strong className="text-amber-400">{name}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={linkedInCertUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95"
            title="Add this verified credential directly to your LinkedIn profile"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            Add to LinkedIn
          </a>

          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition-colors active:scale-95 disabled:opacity-50"
          >
            {downloading ? "Generating Certificate..." : "📥 Download (PNG)"}
          </button>
        </div>
      </div>


      <div
        ref={certRef}
        className="relative w-full max-w-5xl aspect-[1.414/1] bg-[#FFFEFC] text-stone-900 border-[16px] border-stone-900 p-8 sm:p-12 shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        

        <div className="absolute inset-4 border-2 border-amber-500/40 pointer-events-none flex flex-col justify-between p-2">
          <div className="flex justify-between w-full">
            <span className="text-amber-600 font-serif text-xl">❖</span>
            <span className="text-amber-600 font-serif text-xl">❖</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-amber-600 font-serif text-xl">❖</span>
            <span className="text-amber-600 font-serif text-xl">❖</span>
          </div>
        </div>


        <div className="relative z-10 flex items-center justify-between border-b border-stone-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white border border-stone-200 p-1 overflow-hidden shadow-xs">
              <img src="/images/image.png" alt="ApexLearn Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight text-stone-900">ApexLearn</h3>
              <p className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Global Academy of Engineering</p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[11px] uppercase tracking-wider font-bold text-stone-400">Certificate ID</span>
            <span className="font-mono text-xs font-bold text-stone-700">{certificateId}</span>
          </div>
        </div>


        <div className="relative z-10 text-center space-y-4 my-auto py-4">
          <p className="font-serif italic text-lg sm:text-xl text-amber-800 tracking-wide">
            This is proudly presented to
          </p>

          <div className="py-2">
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight underline decoration-amber-500/50 decoration-2 underline-offset-8">
              {name || "Student Name"}
            </h1>
          </div>

          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto font-medium leading-relaxed pt-2">
            for successfully completing all curriculum requirements, passing practical assessments, and demonstrating mastery in
          </p>

          <div className="pt-2">
            <h2 className="text-xl sm:text-3xl font-extrabold text-stone-900 tracking-tight bg-stone-100 py-3 px-6 rounded-2xl inline-block border border-stone-200 shadow-xs">
              {courseName}
            </h2>
          </div>
        </div>


        <div className="relative z-10 grid grid-cols-4 items-end border-t border-stone-200 pt-6 gap-4">
          

          <div className="text-left space-y-1">
            <div className="w-32 border-b border-stone-400 pb-1">
              <p className="font-mono text-xs font-bold text-stone-800">{issueDate}</p>
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500"></p>
          </div>


          <div className="flex flex-col items-center justify-center">
            <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-1 shadow-md flex items-center justify-center">
              <div className="h-full w-full rounded-full border-2 border-dashed border-amber-100 flex flex-col items-center justify-center text-center bg-amber-600 text-white">
                <span className="text-[9px] uppercase font-black tracking-tighter">Verified</span>
                <span className="text-[11px] font-bold">100%</span>
              </div>
            </div>
          </div>


          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-1.5 rounded-lg border border-stone-200 shadow-xs">
              <img src={qrCodeUrl} alt="Certificate Verification QR Code" className="h-14 w-14 object-contain" />
            </div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-stone-500 mt-1">Scan to Verify</span>
          </div>


          <div className="text-right space-y-1">
            <div className="w-36 border-b border-stone-400 pb-1 ml-auto">
              <p className="font-serif italic text-sm font-bold text-stone-800">{instructorName}</p>
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Authorized Instructor</p>
          </div>

        </div>

      </div>
    </div>
  );
}