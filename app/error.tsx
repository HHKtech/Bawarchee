'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-8 shadow-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-600">Application Error</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-950">Something went wrong</h2>
        <p className="mt-3 text-sm text-gray-600">
          {error?.message || 'An unexpected error occurred while rendering the page.'}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-amber-700"
          >
            Try again
          </button>
          <Link
            href="/profile/setup"
            className="rounded-full border border-amber-200 bg-white px-5 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-50"
          >
            Complete Onboarding
          </Link>
        </div>
      </div>
    </div>
  );
}
