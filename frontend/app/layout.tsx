export const metadata = {
  title: 'ApexLearn',
  description: 'Learning Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f9' }}>
        {children}
      </body>
    </html>
  );
}