import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'APEXLEARN — Elite Knowledge Marketplace',
  description: 'The premium platform where independent creators upload and sell elite courses. Stream raw intellect.',
  icons: { icon: '/images/image.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </head>
      <body className="bg-[#070709] text-[#F3F4F6] antialiased selection:bg-[#2563EB] selection:text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}