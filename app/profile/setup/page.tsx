'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { FamilyMembersEditor } from '@/components/profile/FamilyMembersEditor';
import { PreferencesFields } from '@/components/profile/PreferencesFields';
import { ProfileReview } from '@/components/profile/ProfileReview';
import { defaultProfileFormState, formToPayload, type ProfileFormState } from '@/lib/profile-form';

const steps = [
  'Preferences',
  'Household',
  'Review'
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileFormState>(defaultProfileFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitProfile() {
    setIsSaving(true);
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

      router.refresh();
      router.push('/dashboard');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not save profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 py-10">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-amber-100 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600">Onboarding required</p>
            <h1 className="mt-3 text-3xl font-bold text-gray-950">Set up your cooking profile</h1>
            <p className="mt-3 max-w-2xl text-gray-600">
              Tell Bawarchee what your household eats so future recipes, inventory suggestions, and portions match your kitchen.
            </p>
          </div>
          <LogoutButton />
        </div>

        <nav className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Onboarding steps">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                step === index ? 'border-amber-500 bg-amber-50' : 'border-amber-100 bg-white hover:bg-amber-50/70'
              }`}
            >
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Step {index + 1}</span>
              <span className="mt-1 block font-semibold text-gray-950">{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-3xl border border-amber-100 bg-white/80 p-5 sm:p-6">
          {step === 0 ? <PreferencesFields form={form} onChange={setForm} /> : null}
          {step === 1 ? (
            <FamilyMembersEditor
              members={form.family_members}
              onChange={(family_members) => setForm({ ...form, family_members })}
            />
          ) : null}
          {step === 2 ? <ProfileReview form={form} /> : null}
        </div>

        {error ? <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            disabled={step === 0 || isSaving}
            className="rounded-full border border-amber-200 px-5 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))}
              className="rounded-full bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={submitProfile}
              disabled={isSaving}
              className="rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Finish setup'}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
