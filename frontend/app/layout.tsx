import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coursera Plus Student Portal',
  description: 'Learner dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070709] text-gray-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}