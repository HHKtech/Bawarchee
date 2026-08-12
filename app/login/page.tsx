import { LoginForm } from '@/components/auth/LoginForm';

type LoginPageProps = {
  searchParams?: {
    error?: string | string[];
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const oauthError = Array.isArray(searchParams?.error) ? searchParams.error[0] : searchParams?.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 py-12">
      <LoginForm oauthError={oauthError} />
    </main>
  );
}
