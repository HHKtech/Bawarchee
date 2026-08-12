import Link from 'next/link';
import { LogoutButton } from '@/components/auth/LogoutButton';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-amber-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Bawarchee</p>
          <h1 className="truncate text-xl font-bold text-gray-950">Your cooking command center</h1>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/profile" className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50">
            Profile
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
