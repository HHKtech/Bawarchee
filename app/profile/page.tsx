'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { FamilyMembersEditor } from '@/components/profile/FamilyMembersEditor';
import { PreferencesFields } from '@/components/profile/PreferencesFields';
import { ProfileReview } from '@/components/profile/ProfileReview';
import { defaultProfileFormState, formToPayload, profileResponseToForm, type ProfileFormState } from '@/lib/profile-form';
import type { ProfileApiResponse } from '@/lib/profile-api-types';
import { TwoFactorSection } from '@/components/profile/TwoFactorSection';

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileFormState>(defaultProfileFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error ?? 'Could not load profile');
        }

        if (active) {
          setForm(profileResponseToForm(result as ProfileApiResponse));
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : 'Could not load profile');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function saveProfile() {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToPayload(form))
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error ?? 'Could not save profile');
      }

      setForm(profileResponseToForm(result as ProfileApiResponse));
      setMessage('Profile settings saved. Future Bawarchee modules will use these preferences.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not save profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-10">
      <section className="mx-auto max-w-5xl rounded-3xl border border-amber-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Profile settings</p>
            <h1 className="mt-3 text-3xl font-bold text-gray-950">Cooking preferences & household</h1>
            <p className="mt-3 max-w-2xl text-gray-600">
              Update dietary settings, cuisine preferences, calorie goals, and family members anytime.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50">
              Dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-3xl border border-amber-100 bg-amber-50 p-8 text-center font-medium text-amber-800">
            Loading your profile...
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-8">
              <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-gray-950">Preferences</h2>
                <div className="mt-6">
                  <PreferencesFields form={form} onChange={setForm} />
                </div>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-gray-950">Household setup</h2>
                <div className="mt-6">
                  <FamilyMembersEditor
                    members={form.family_members}
                    onChange={(family_members) => setForm({ ...form, family_members })}
                  />
                </div>
              </div>

              <TwoFactorSection />
            </div>

            <aside className="h-fit rounded-3xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-gray-950">Current summary</h2>
              <div className="mt-5">
                <ProfileReview form={form} />
              </div>
            </aside>
          </div>
        )}

        {message ? <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={saveProfile}
            disabled={isLoading || isSaving}
            className="rounded-full bg-gray-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </section>
    </main>
  );
}
