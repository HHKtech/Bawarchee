'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { signInWithGoogle, signupWithPassword, type AuthActionState } from '@/app/auth/actions';

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Creating account...' : 'Create account'}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(signupWithPassword, initialState);

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl shadow-amber-100 backdrop-blur">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600">Start cooking smarter</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-950">Create your Bawarchee account</h1>
        <p className="mt-2 text-sm text-gray-600">Sign up to begin personalized pantry and recipe planning.</p>
      </div>

      {state.error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      {state.message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none ring-amber-500 transition focus:border-amber-500 focus:ring-2"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none ring-amber-500 transition focus:border-amber-500 focus:ring-2"
            placeholder="At least 6 characters"
          />
        </label>
        <SubmitButton />
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        or
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form action={signInWithGoogle}>
        <button className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 transition hover:bg-gray-50" type="submit">
          Continue with Google
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-amber-700 hover:text-amber-800">
          Sign in
        </Link>
      </p>
    </div>
  );
}
