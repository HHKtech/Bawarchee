import { MfaVerifyForm } from '@/components/auth/MfaVerifyForm';

export default function MfaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 py-12">
      <MfaVerifyForm />
    </main>
  );
}
