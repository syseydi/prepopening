import type { Metadata } from 'next';
import './globals.css';
import { LayoutShell } from '@/components/LayoutShell';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'PrepOpening — Chess Opening Training',
  description: 'Learn chess openings with spaced repetition and structured journeys.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
