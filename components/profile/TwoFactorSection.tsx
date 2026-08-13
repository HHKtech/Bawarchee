'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Status = 'loading' | 'enabled' | 'disabled' | 'enrolling' | 'error';

export function TwoFactorSection() {
  const supabase = createClient();

  const [status, setStatus] = useState<Status>('loading');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStatus() {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/auth/mfa/status');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load 2FA status');
      setFactorId(data.factorId ?? null);
      setStatus(data.enabled ? 'enabled' : 'disabled');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load 2FA status');
      setStatus('error');
    }
  }

  async function startEnrollment() {
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/mfa/enroll', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start enrollment');
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setPendingFactorId(data.factorId);
      setCode('');
      setStatus('enrolling');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start 2FA enrollment');
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmEnrollment() {
    if (!pendingFactorId || code.length !== 6) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId: pendingFactorId, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Invalid code. Try again.');

      // Refresh session client-side so the cookie is upgraded to aal2
      await supabase.auth.mfa.challengeAndVerify({ factorId: pendingFactorId, code });

      setMessage('Two-factor authentication is now enabled on your account.');
      setQrCode(null);
      setSecret(null);
      setPendingFactorId(null);
      setCode('');
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setIsBusy(false);
    }
  }

  async function disableTwoFactor() {
    if (!factorId) return;
    if (!confirm('Are you sure you want to disable two-factor authentication? Your account will be less secure.')) return;
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/mfa/unenroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to disable 2FA');
      setMessage('Two-factor authentication has been disabled.');
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not disable 2FA');
    } finally {
      setIsBusy(false);
    }
  }

  function cancelEnrollment() {
    setStatus('disabled');
    setQrCode(null);
    setSecret(null);
    setPendingFactorId(null);
    setCode('');
    setError(null);
  }

  return (
    <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Bawarchee Logo" className="h-9 w-9 shrink-0 object-contain" />
        <div>
          <h2 className="text-lg font-bold text-gray-950">Two-factor authentication</h2>
          <p className="text-sm text-gray-500">Add a second layer of security to your account.</p>
        </div>
      </div>

      {/* Status badge */}
      {status !== 'loading' && status !== 'enrolling' && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            status === 'enabled'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'enabled' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {status === 'enabled' ? '2FA Enabled' : '2FA Disabled'}
          </span>
        </div>
      )}

      {/* Messages */}
      {message && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      )}

      {/* Disabled — show enable button */}
      {status === 'disabled' && (
        <div className="mt-5">
          <p className="text-sm text-gray-600">
            Two-factor authentication is not enabled. Enable it to require a code from your authenticator app each time you sign in.
          </p>
          <button
            onClick={startEnrollment}
            disabled={isBusy}
            className="mt-4 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {isBusy ? 'Starting...' : 'Enable 2FA'}
          </button>
        </div>
      )}

      {/* Enrolling — show QR code + verification */}
      {status === 'enrolling' && qrCode && (
        <div className="mt-5 space-y-5">
          <p className="text-sm text-gray-700">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to confirm.
          </p>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="2FA QR Code" className="h-44 w-44" />
            </div>
          </div>

          {/* Manual entry fallback */}
          {secret && (
            <div className="rounded-xl bg-white border border-dashed border-amber-200 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Or enter this code manually:</p>
              <p className="font-mono text-sm font-semibold tracking-widest text-gray-800 break-all">{secret}</p>
            </div>
          )}

          {/* Code input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Enter the 6-digit code from your app
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-xl font-bold tracking-[0.4em] outline-none ring-amber-500 transition focus:border-amber-500 focus:ring-2"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={confirmEnrollment}
              disabled={isBusy || code.length !== 6}
              className="flex-1 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? 'Verifying...' : 'Confirm & Enable'}
            </button>
            <button
              onClick={cancelEnrollment}
              disabled={isBusy}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Enabled — show disable button */}
      {status === 'enabled' && (
        <div className="mt-5">
          <p className="text-sm text-gray-600">
            Your account is protected with two-factor authentication. You&apos;ll be asked for a code each time you sign in.
          </p>
          <button
            onClick={disableTwoFactor}
            disabled={isBusy}
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
          >
            {isBusy ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      )}
    </div>
  );
}
