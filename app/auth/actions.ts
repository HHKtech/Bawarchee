'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';

export type AuthActionState = {
  error?: string;
  message?: string;
};

function getAuthFields(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  return { email, password };
}

export async function loginWithPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const fields = getAuthFields(formData);
  if ('error' in fields) return { error: fields.error };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(fields);

  if (error) return { error: error.message };
  redirect('/dashboard');
}

export async function signupWithPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const fields = getAuthFields(formData);
  if ('error' in fields) return { error: fields.error };

  if (fields.password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: fields.email,
    password: fields.password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/dashboard`
    }
  });

  if (error) return { error: error.message };

  return {
    message: 'Account created. Check your email to confirm your account, then sign in.'
  };
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback`
    }
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data.url) redirect(data.url);

  redirect('/login');
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
