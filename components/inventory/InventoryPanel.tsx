'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddItemModal } from '@/components/inventory/AddItemModal';
import { InventoryItemRow } from '@/components/inventory/InventoryItemRow';
import { ReceiptScanModal } from '@/components/inventory/ReceiptScanModal';
import { useDashboard } from '@/context/DashboardContext';
import type { InventoryResponse } from '@/lib/inventory-api-types';
import type { InventoryItem } from '@/lib/supabase/types';

type GroupedInventory = [string, InventoryItem[]][];

function groupInventoryItems(items: InventoryItem[]): GroupedInventory {
  const groups = items.reduce<Record<string, InventoryItem[]>>((accumulator, item) => {
    const category = item.category || 'Other';
    accumulator[category] = [...(accumulator[category] ?? []), item];
    return accumulator;
  }, {});

  return Object.entries(groups).sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB));
}

export function InventoryPanel() {
  const {
    selectedItemIds,
    toggleSelectItem,
    selectAllItems,
    clearSelections,
    setActiveSessionId,
    setGeneratedRecipes,
    setIsGeneratingRecipes,
    inventoryRefreshTrigger,
  } = useDashboard();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupedItems = useMemo(() => groupInventoryItems(items), [items]);
  const selectedItems = useMemo(() => items.filter((item) => selectedItemIds.includes(item.id)), [items, selectedItemIds]);
  const allItemIds = useMemo(() => items.map((item) => item.id), [items]);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/inventory');

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not load inventory.');
      }

      const payload = (await response.json()) as InventoryResponse;
      setItems(payload.items);
      setQuantityDrafts(Object.fromEntries(payload.items.map((item) => [item.id, String(item.quantity)])));
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory, inventoryRefreshTrigger]);

  async function generateRecipes() {
    if (selectedItemIds.length === 0) return;
    setIsGeneratingRecipes(true);
    setError(null);
    setGeneratedRecipes([]);

    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_item_ids: selectedItemIds }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Failed to generate recipes.');
      }

      const payload = await response.json();
      setActiveSessionId(payload.session_id);
      setGeneratedRecipes(payload.recipes);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGeneratingRecipes(false);
    }
  }

  async function updateQuantity(item: InventoryItem) {
    const quantity = Number(quantityDrafts[item.id]);

    if (!Number.isFinite(quantity) || quantity < 0) {
      setError('Quantity must be a non-negative number.');
      return;
    }

    setBusyItemId(item.id);
    setError(null);

    try {
      const response = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, quantity })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not update quantity.');
      }

      setItems((currentItems) => currentItems.map((currentItem) => (currentItem.id === item.id ? { ...currentItem, quantity } : currentItem)));
    } catch (updateError) {
      setError((updateError as Error).message);
      setQuantityDrafts((currentDrafts) => ({ ...currentDrafts, [item.id]: String(item.quantity) }));
    } finally {
      setBusyItemId(null);
    }
  }

  async function deleteItem(item: InventoryItem) {
    setBusyItemId(item.id);
    setError(null);

    try {
      const response = await fetch(`/api/inventory?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Could not delete item.');
      }

      setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
      if (selectedItemIds.includes(item.id)) {
        toggleSelectItem(item.id);
      }
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onItemsAdded={loadInventory} />
      <ReceiptScanModal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} onItemsAdded={loadInventory} />

      <div className="flex flex-shrink-0 flex-col gap-4 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Module 4</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Inventory</h2>
          <p className="mt-2 text-sm text-slate-600">Track ingredients available for future Bawarchee recipe planning.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setIsModalOpen(true)} className="rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700">
            Add Items
          </button>
          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            className="rounded-full border border-orange-200/70 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-100"
            id="scan-receipt-btn"
          >
            📷 Scan Receipt
          </button>
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>{items.length} item{items.length === 1 ? '' : 's'} in pantry</span>
        <span>•</span>
        <span>{selectedItemIds.length} selected for recipes</span>
        {items.length > 0 ? (
          <>
            <span>•</span>
            <button type="button" onClick={() => selectAllItems(allItemIds)} className="font-bold text-orange-700 hover:text-orange-800">
              Select all
            </button>
            {selectedItemIds.length > 0 ? (
              <button type="button" onClick={clearSelections} className="font-bold text-gray-500 hover:text-gray-700">
                Clear
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      {isLoading ? <p className="mt-8 rounded-2xl bg-orange-50 p-6 text-center text-sm text-orange-800">Loading your inventory...</p> : null}

      {!isLoading && items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900">Your pantry is empty</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Add your first ingredient from the grocery catalog to start building a personalized pantry.</p>
          <button type="button" onClick={() => setIsModalOpen(true)} className="mt-5 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700">
            Add first ingredient
          </button>
        </div>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <div className="mt-6 space-y-6 pb-4">
          {groupedItems.map(([category, categoryItems]) => (
            <div key={category}>
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full border border-orange-200/60 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">{category}</span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <InventoryItemRow
                    key={item.id}
                    item={item}
                    isSelected={selectedItemIds.includes(item.id)}
                    isBusy={busyItemId === item.id}
                    quantityDraft={quantityDrafts[item.id] ?? String(item.quantity)}
                    onToggleSelected={toggleSelectItem}
                    onQuantityDraftChange={(id, quantity) => setQuantityDrafts((drafts) => ({ ...drafts, [id]: quantity }))}
                    onSaveQuantity={updateQuantity}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      </div>

      {selectedItemIds.length > 0 ? (
        <div className="flex-shrink-0 border-t border-slate-100 bg-white p-4">
          <div className="rounded-2xl border border-orange-200/70 bg-orange-50/70 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:items-start">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {selectedItemIds.length} item{selectedItemIds.length === 1 ? '' : 's'} selected
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedItems.slice(0, 3).map((item) => item.item_name).join(', ')}{selectedItems.length > 3 ? ` +${selectedItems.length - 3} more` : ''}
                </p>
              </div>
              <button type="button" onClick={generateRecipes} className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-orange-700 hover:to-amber-700">
                Generate Recipes ✨
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
