import Link from 'next/link';
import { LogoutButton } from '@/components/auth/LogoutButton';

type DashboardHeaderProps = {
  className?: string;
};

export function DashboardHeader({ className = '' }: DashboardHeaderProps) {
  return (
    <header className={`z-30 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md ${className}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-50 via-white to-amber-100 shadow-md ring-1 ring-orange-200/70 sm:h-20 sm:w-20">
            <img src="/logo.png" alt="Bawarchee Logo" className="h-14 w-14 object-contain drop-shadow-sm sm:h-[4.5rem] sm:w-[4.5rem]" />
          </span>
          <div className="min-w-0">
            <p className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-xl font-black uppercase tracking-[0.16em] text-transparent sm:text-2xl">
              Bawarchee
            </p>
            <h1 className="truncate text-base font-bold text-slate-900 sm:text-xl">Your cooking command center</h1>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/profile" className="rounded-full border border-orange-200/70 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50">
            Profile
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
