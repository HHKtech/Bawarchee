'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function MfaVerifyForm() {
  const router = useRouter();
  const supabase = createClient();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError || !factors?.totp?.length) {
        setError('No 2FA factor found. Please contact support.');
        return;
      }

      const factorId = factors.totp[0].id;
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (error) setError(null);
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl shadow-amber-100 backdrop-blur">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600">Two-factor auth</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-950">Verify your identity</h1>
        <p className="mt-2 text-sm text-gray-500">
          Open your authenticator app and enter the 6-digit code.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Authentication code
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="000000"
            maxLength={6}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none ring-amber-500 transition focus:border-amber-500 focus:ring-2"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Verifying...' : 'Verify code'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-gray-400">
        Lost access to your authenticator?{' '}
        <a href="/login" className="font-semibold text-amber-600 hover:text-amber-700">
          Sign out and contact support
        </a>
      </p>
    </div>
  );
}
