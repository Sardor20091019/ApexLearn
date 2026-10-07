'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, isTokenExpired } from '../lib/auth';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (token && !isTokenExpired(token)) {
      router.replace('/dashboard');
    } else {
      router.replace('/auth');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-800 border-t-transparent"></div>
    </div>
  );
}