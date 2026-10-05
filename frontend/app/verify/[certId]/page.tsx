import { notFound } from "next/navigation";

export default async function VerifyCertificate({ params }: { params: { certId: string } }) {
  // Call your NestJS backend to verify the certificate ID
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/progress/verify-certificate/${params.certId}`, {
    cache: "no-store"
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-red-100 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Certificate Not Found</h1>
          <p className="text-stone-500">This certificate ID does not exist or has been revoked.</p>
        </div>
      </div>
    );
  }

  const cert = await res.json();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-stone-200 text-center">
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Verified Certificate</h1>
        <p className="text-stone-500 mb-8">This is an official document issued by ApexLearn.</p>
        
        <div className="bg-stone-50 rounded-2xl p-6 text-left space-y-4 border border-stone-100">
          <div>
            <div className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">Student</div>
            <div className="text-xl font-medium text-stone-900">{cert.studentName}</div>
          </div>
          <div>
            <div className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">Course Completed</div>
            <div className="text-xl font-medium text-stone-900">{cert.courseName}</div>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-4 mt-4">
            <div>
              <div className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">Issue Date</div>
              <div className="text-stone-700">{new Date(cert.issueDate).toLocaleDateString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">Certificate ID</div>
              <div className="text-stone-700 font-mono text-sm">{params.certId}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}