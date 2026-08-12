import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-6">
      <section className="max-w-3xl rounded-3xl border border-white/70 bg-white/85 p-10 text-center shadow-xl shadow-amber-100 backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">Bawarchee</p>
        <h1 className="text-4xl font-bold tracking-tight text-gray-950 sm:text-6xl">
          Your intelligent pantry and recipe companion.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          Manage household inventory, scan receipts, and generate personalized recipes from what you already have.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="rounded-full bg-amber-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-amber-700">
            Get started
          </Link>
          <Link href="/login" className="rounded-full border border-amber-200 bg-white px-6 py-3 font-semibold text-amber-700 transition hover:bg-amber-50">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
