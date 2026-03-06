'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/journeys', label: 'Journeys' },
  { href: '/profile', label: 'Profile' },
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname?.startsWith('/auth');

  return (
    <div className="flex min-h-screen flex-col">
      {!isAuthPage && (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold text-slate-800">
              PrepOpening
            </Link>
            <nav className="flex items-center gap-6">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium ${
                    pathname === href ? 'text-accent' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </Link>
              ))}
              {user ? (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Log out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Log in
                </Link>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      {!isAuthPage && (
        <footer className="border-t border-slate-200 bg-slate-50 py-4">
          <div className="mx-auto max-w-4xl px-4 text-center text-xs text-slate-500">
            PrepOpening — Chess opening training platform
          </div>
        </footer>
      )}
    </div>
  );
}
