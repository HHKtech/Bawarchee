'use client';

import { useEffect, useMemo, useState } from 'react';
import { CatalogSearch } from '@/components/catalog/CatalogSearch';
import type { CatalogItem } from '@/lib/catalog';
import type { InventoryAddItemPayload } from '@/lib/inventory-api-types';

type AddItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onItemsAdded: () => void;
};

type QuantityDraft = {
  quantity: string;
  unit: string;
};

export function AddItemModal({ isOpen, onClose, onItemsAdded }: AddItemModalProps) {
  const [selectedItems, setSelectedItems] = useState<CatalogItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, QuantityDraft>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDrafts((currentDrafts) => {
      const nextDrafts: Record<string, QuantityDraft> = {};

      selectedItems.forEach((item) => {
        nextDrafts[item.name] = currentDrafts[item.name] ?? { quantity: '1', unit: item.default_unit };
      });

      return nextDrafts;
    });
  }, [selectedItems]);

  const canSubmit = useMemo(
    () => selectedItems.length > 0 && selectedItems.every((item) => Number(drafts[item.name]?.quantity) > 0 && drafts[item.name]?.unit.trim()),
    [drafts, selectedItems]
  );

  if (!isOpen) {
    return null;
  }

  function resetAndClose() {
    setSelectedItems([]);
    setDrafts({});
    setError(null);
    onClose();
  }

  function updateDraft(itemName: string, update: Partial<QuantityDraft>) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [itemName]: {
        quantity: currentDrafts[itemName]?.quantity ?? '1',
        unit: currentDrafts[itemName]?.unit ?? '',
        ...update
      }
    }));
  }

  async function handleSubmit() {
    if (!canSubmit) {
      setError('Select at least one item and enter a positive quantity for each item.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const items: InventoryAddItemPayload[] = selectedItems.map((item) => ({
      catalog_item_id: item.id ?? null,
      item_name: item.name,
      category: item.category,
      quantity: Number(drafts[item.name].quantity),
      unit: drafts[item.name].unit.trim(),
      added_via: 'search'
    }));

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not add selected items.');
      }

      onItemsAdded();
      resetAndClose();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-8" role="dialog" aria-modal="true" aria-label="Add inventory items">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Inventory</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950">Add grocery items</h2>
            <p className="mt-2 text-sm text-gray-600">Search the catalog, select ingredients, then enter how much you have on hand.</p>
          </div>
          <button type="button" onClick={resetAndClose} className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50">
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <CatalogSearch selectedItems={selectedItems} onSelectedItemsChange={setSelectedItems} label="Find ingredients to add" limit={30} />

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
            <h3 className="font-bold text-gray-950">Quantities</h3>
            {selectedItems.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Selected catalog items will appear here with quantity fields.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {selectedItems.map((item) => (
                  <div key={item.name} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold capitalize text-gray-950">{item.name}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{item.category}</p>
                      </div>
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">{item.default_unit}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-[1fr_1fr] gap-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Quantity
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={drafts[item.name]?.quantity ?? '1'}
                          onChange={(event) => updateDraft(item.name, { quantity: event.target.value })}
                          className="mt-1 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm text-gray-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                        />
                      </label>
                      <label className="text-xs font-semibold text-gray-600">
                        Unit
                        <input
                          value={drafts[item.name]?.unit ?? item.default_unit}
                          onChange={(event) => updateDraft(item.name, { unit: event.target.value })}
                          className="mt-1 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm text-gray-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="mt-5 w-full rounded-full bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? 'Adding items...' : 'Add selected items'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
