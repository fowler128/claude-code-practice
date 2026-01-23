import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizDeedz Filing Tracker',
  description: 'Track court filings and document submissions across Texas counties',
  keywords: ['paralegal', 'court filing', 'texas law', 'legal ops', 'document tracker'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
