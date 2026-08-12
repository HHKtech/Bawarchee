'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ConfirmReceiptItemInput,
  ReceiptItemExtracted,
  ScanReceiptResponse
} from '@/lib/receipt-api-types';
import type { CatalogItem } from '@/lib/catalog';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

type Step = 'upload' | 'confirm' | 'success';

type EditableLine = ReceiptItemExtracted & {
  /** user may choose to skip (exclude from confirm payload) */
  skip: boolean;
  /** live-editable name for unmatched items */
  editedName: string;
};

type ReceiptScanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onItemsAdded: () => void;
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function isUnmatched(item: ReceiptItemExtracted) {
  return !item.catalog_item_id || item.confidence < 0.5;
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <svg
      className={`${cls} animate-spin text-amber-600`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

/* ─── Step 1: Upload ────────────────────────── */

function UploadStep({
  onFilePicked
}: {
  onFilePicked: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowed.includes(file.type)) {
      alert('Please upload a JPG, PNG, WebP, or HEIC image of your receipt.');
      return;
    }
    onFilePicked(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop receipt image here or click to upload"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
        className={[
          'flex w-full max-w-sm cursor-pointer flex-col items-center gap-4 rounded-3xl border-2 border-dashed px-8 py-12 transition',
          isDragging
            ? 'border-amber-500 bg-amber-50 shadow-inner'
            : 'border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50'
        ].join(' ')}
      >
        {/* Receipt icon */}
        <svg
          className="h-12 w-12 text-amber-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"
          />
        </svg>

        <div className="text-center">
          <p className="text-sm font-bold text-gray-950">
            {isDragging ? 'Drop to scan' : 'Drag & drop a receipt photo'}
          </p>
          <p className="mt-1 text-xs text-gray-500">or click to browse · JPG, PNG, WebP, HEIC</p>
        </div>

        <span className="rounded-full bg-amber-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700">
          Choose File
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
        id="receipt-file-input"
      />

      <p className="max-w-xs text-center text-xs text-gray-400">
        Gemini AI will read the receipt and suggest grocery items to add to your pantry. You can review everything before confirming.
      </p>
    </div>
  );
}

/* ─── Scanning overlay ──────────────────────── */

function ScanningOverlay() {
  return (
    <div className="flex flex-col items-center gap-5 py-16">
      <Spinner size="lg" />
      <div className="text-center">
        <p className="text-base font-bold text-gray-950">Reading receipt with AI…</p>
        <p className="mt-1 text-sm text-gray-500">This usually takes 5–15 seconds</p>
      </div>
    </div>
  );
}

/* ─── Step 2: Confirm ───────────────────────── */

type ConfirmStepProps = {
  scanId: string;
  imageUrl: string;
  lines: EditableLine[];
  onLinesChange: (lines: EditableLine[]) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  error: string | null;
};

function ConfirmStep({
  imageUrl,
  lines,
  onLinesChange,
  onConfirm,
  isSubmitting,
  error
}: ConfirmStepProps) {
  const matched = lines.filter((l) => !isUnmatched(l));
  const unmatched = lines.filter((l) => isUnmatched(l));
  const activeCount = lines.filter((l) => !l.skip).length;

  function updateLine(index: number, patch: Partial<EditableLine>) {
    const next = lines.map((l, i) => (i === index ? { ...l, ...patch } : l));
    onLinesChange(next);
  }

  function LineRow({ line, index, label }: { line: EditableLine; index: number; label?: string }) {
    const globalIndex = lines.indexOf(line);
    return (
      <div
        className={[
          'relative rounded-2xl border p-4 transition',
          line.skip
            ? 'border-gray-100 bg-gray-50 opacity-50'
            : isUnmatched(line)
            ? 'border-orange-200 bg-orange-50/60'
            : 'border-amber-100 bg-white'
        ].join(' ')}
      >
        {/* skip toggle */}
        <button
          type="button"
          title={line.skip ? 'Include item' : 'Skip item'}
          onClick={() => updateLine(globalIndex, { skip: !line.skip })}
          className={[
            'absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold transition',
            line.skip
              ? 'bg-gray-200 text-gray-500 hover:bg-amber-100 hover:text-amber-700'
              : 'bg-red-50 text-red-500 hover:bg-red-100'
          ].join(' ')}
        >
          {line.skip ? 'Include' : 'Skip'}
        </button>

        {/* item name */}
        <div className="mb-3 pr-20">
          {isUnmatched(line) ? (
            <input
              value={line.editedName}
              onChange={(e) => updateLine(globalIndex, { editedName: e.target.value, item_name: e.target.value })}
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              placeholder="Item name"
            />
          ) : (
            <p className="font-bold capitalize text-gray-950">{line.item_name}</p>
          )}

          <div className="mt-1 flex items-center gap-2">
            {label && (
              <span className={[
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                isUnmatched(line) ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
              ].join(' ')}>
                {label}
              </span>
            )}
            {line.category && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                {line.category}
              </span>
            )}
            <span className="text-xs text-gray-400 italic">{line.raw_text}</span>
          </div>
        </div>

        {/* qty + unit */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            Qty
            <input
              type="number"
              min="0"
              step="0.01"
              value={line.quantity}
              onChange={(e) => updateLine(globalIndex, { quantity: Number(e.target.value) })}
              className="w-20 rounded-xl border border-amber-200 px-3 py-1.5 text-sm text-gray-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />
          </label>
          <input
            value={line.unit}
            onChange={(e) => updateLine(globalIndex, { unit: e.target.value })}
            className="w-24 rounded-xl border border-amber-200 px-3 py-1.5 text-sm text-gray-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            placeholder="unit"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Receipt thumbnail */}
      {imageUrl && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Scanned receipt"
            className="max-h-48 rounded-2xl border border-amber-100 object-contain shadow-sm"
          />
        </div>
      )}

      {/* Matched items */}
      {matched.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
              ✓ Matched — {matched.length} item{matched.length !== 1 ? 's' : ''}
            </span>
            <span className="h-px flex-1 bg-green-100" />
          </div>
          <div className="space-y-3">
            {matched.map((line, i) => (
              <LineRow key={i} line={line} index={i} label="Matched" />
            ))}
          </div>
        </div>
      )}

      {/* Unmatched items */}
      {unmatched.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
              ⚠ Unmatched — {unmatched.length} item{unmatched.length !== 1 ? 's' : ''}
            </span>
            <span className="h-px flex-1 bg-orange-100" />
          </div>
          <p className="mb-3 text-xs text-gray-500">
            These items weren&apos;t found in the catalog. Edit the name, adjust the quantity, or skip them.
          </p>
          <div className="space-y-3">
            {unmatched.map((line, i) => (
              <LineRow key={i} line={line} index={i} label="Unmatched" />
            ))}
          </div>
        </div>
      )}

      {lines.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-4">
          No items were detected on this receipt. Try a clearer photo.
        </p>
      )}

      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 border-t border-amber-100 pt-4">
        <p className="text-sm text-gray-500">
          {activeCount} item{activeCount !== 1 ? 's' : ''} will be added to inventory
        </p>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting || activeCount === 0}
          className="rounded-full bg-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          id="receipt-confirm-btn"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Adding…
            </span>
          ) : (
            'Add to Inventory'
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3: Success ───────────────────────── */

function SuccessStep({
  count,
  onScanAnother,
  onClose
}: {
  count: number;
  onScanAnother: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      {/* checkmark */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-950">All done!</h3>
        <p className="mt-2 text-sm text-gray-600">
          {count} item{count !== 1 ? 's' : ''} added to your pantry inventory.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onScanAnother}
          className="rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
        >
          Scan another receipt
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700"
        >
          View inventory
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Modal
───────────────────────────────────────────── */

export function ReceiptScanModal({ isOpen, onClose, onItemsAdded }: ReceiptScanModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState<ScanReceiptResponse | null>(null);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);

  // reset when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setIsScanning(false);
      setScanData(null);
      setLines([]);
      setIsSubmitting(false);
      setError(null);
      setAddedCount(0);
    }
  }, [isOpen]);

  const handleFilePicked = useCallback(async (file: File) => {
    setIsScanning(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/receipt/scan', { method: 'POST', body: form });
      const payload = await res.json() as ScanReceiptResponse & { error?: string };

      if (!res.ok) throw new Error(payload.error ?? 'Failed to scan receipt');

      setScanData(payload);
      setLines(
        (payload.items ?? []).map((item) => ({
          ...item,
          skip: false,
          editedName: item.item_name
        }))
      );
      setStep('confirm');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!scanData) return;

    const confirmed: ConfirmReceiptItemInput[] = lines
      .filter((l) => !l.skip)
      .map((l) => ({
        item_name: l.item_name,
        catalog_item_id: l.catalog_item_id ?? undefined,
        category: l.category || undefined,
        quantity: Number(l.quantity) || 1,
        unit: l.unit || 'piece'
      }));

    if (confirmed.length === 0) {
      setError('Select at least one item to add.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/receipt/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_id: scanData.scan_id, confirmed_items: confirmed })
      });

      const payload = await res.json() as { success?: boolean; added_items_count?: number; error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Failed to confirm items');

      setAddedCount(payload.added_items_count ?? confirmed.length);
      onItemsAdded();         // refresh parent inventory list
      setStep('success');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [scanData, lines, onItemsAdded]);

  function handleScanAnother() {
    setStep('upload');
    setScanData(null);
    setLines([]);
    setError(null);
    setAddedCount(0);
  }

  if (!isOpen) return null;

  const stepTitle: Record<Step, string> = {
    upload: 'Scan a Receipt',
    confirm: 'Review Extracted Items',
    success: 'Receipt Processed'
  };
  const stepSub: Record<Step, string> = {
    upload: 'Take a photo or upload an image of your grocery receipt',
    confirm: "Adjust quantities, fix names, and skip any items you don't want to add",
    success: ''
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Receipt scanner"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-amber-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Module 5</p>
            <h2 className="mt-0.5 text-xl font-bold text-gray-950">{stepTitle[step]}</h2>
            {stepSub[step] && <p className="mt-1 text-sm text-gray-500">{stepSub[step]}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 border-b border-amber-50 px-6 py-3">
            {(['upload', 'confirm'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                    step === s
                      ? 'bg-amber-600 text-white'
                      : (step === 'confirm' && s === 'upload')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  ].join(' ')}
                >
                  {step === 'confirm' && s === 'upload' ? '✓' : i + 1}
                </span>
                <span className={`text-xs font-semibold ${step === s ? 'text-gray-950' : 'text-gray-400'}`}>
                  {s === 'upload' ? 'Upload' : 'Confirm'}
                </span>
                {i < 1 && <span className="h-px w-8 bg-gray-200" />}
              </div>
            ))}
          </div>
        )}

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && step === 'upload' && (
            <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
          )}

          {isScanning && <ScanningOverlay />}

          {!isScanning && step === 'upload' && (
            <UploadStep onFilePicked={handleFilePicked} />
          )}

          {!isScanning && step === 'confirm' && scanData && (
            <ConfirmStep
              scanId={scanData.scan_id}
              imageUrl={scanData.image_url}
              lines={lines}
              onLinesChange={setLines}
              onConfirm={handleConfirm}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}

          {step === 'success' && (
            <SuccessStep
              count={addedCount}
              onScanAnother={handleScanAnother}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
