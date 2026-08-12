import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bawarchee',
  description: 'Intelligent pantry inventory and conversational recipe assistant.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
