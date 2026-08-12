import { LogoutButton } from '@/components/auth/LogoutButton';

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-amber-50 px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-950">Profile</h1>
            <p className="mt-3 text-gray-600">Editable profile settings will be implemented in Module 2.</p>
          </div>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
