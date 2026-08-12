import Link from 'next/link';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-amber-50">
      <header className="border-b border-amber-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Bawarchee</p>
            <h1 className="text-xl font-bold text-gray-950">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50">
              Profile
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
