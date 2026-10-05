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

  const [name, setName] = useState<string>(() => {
    if (typeof window === "undefined") return studentName || "";
    return localStorage.getItem(`cert_name_${certificateId}`) || studentName || "";
  });

  const [isConfirmed, setIsConfirmed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`cert_confirmed_${certificateId}`) === "true";
  });

  const [downloading, setDownloading] = useState(false);
  const [baseUrl, setBaseUrl] = useState("https://apex-learn-delta.vercel.app");
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const handleConfirmName = () => {
    if (!name || !name.trim()) return;
    const trimmedName = name.trim();
    setIsConfirmed(true);
    setName(trimmedName);
    localStorage.setItem(`cert_confirmed_${certificateId}`, "true");
    localStorage.setItem(`cert_name_${certificateId}`, trimmedName);
  };

  const handleDownloadImage = async () => {
    if (!certRef.current || !isConfirmed) return;
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

  return (
    <div className="flex flex-col items-center w-full">

      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 bg-stone-900/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-stone-800">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-300 uppercase tracking-wider px-2">
            {isConfirmed ? "Confirmed Name:" : "Edit Name:"}
          </label>
          <input
            type="text"
            value={name}
            disabled={isConfirmed}
            onChange={(e) => setName(e.target.value)}
            className={
              "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none " +
              (isConfirmed
                ? "bg-stone-900 border-stone-800 text-stone-400 cursor-not-allowed"
                : "bg-stone-800 border-stone-700 text-white focus:border-amber-500")
            }
            placeholder="Student Name"
          />
        </div>

        {!isConfirmed ? (
          <button
            onClick={handleConfirmName}
            disabled={!name || !name.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            ✓ Confirm Name
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60 px-3.5 py-2 text-xs font-bold text-emerald-400">
            🔒 Name Locked
          </span>
        )}

        <button
          onClick={handleDownloadImage}
          disabled={!isConfirmed || downloading}
          title={!isConfirmed ? "Please confirm your name first to unlock download" : ""}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? "Generating Image..." : "📥 Download as Image (PNG)"}
        </button>
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
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-stone-900 font-extrabold text-white text-lg">
              A
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