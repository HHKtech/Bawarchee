import { LogoutButton } from '@/components/auth/LogoutButton';

export default function ProfileSetupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 py-12">
      <section className="w-full max-w-2xl rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl shadow-amber-100 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600">Onboarding required</p>
            <h1 className="mt-3 text-3xl font-bold text-gray-950">Set up your profile</h1>
          </div>
          <LogoutButton />
        </div>
        <p className="mt-4 text-gray-600">
          Module 2 will replace this placeholder with profile and family setup fields. Module 1 middleware routes new users here until `profiles.is_onboarded` is true.
        </p>
      </section>
    </main>
  );
}
