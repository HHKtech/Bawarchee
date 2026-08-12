import type { InventoryItem } from '@/lib/supabase/types';

type InventoryItemRowProps = {
  item: InventoryItem;
  isSelected: boolean;
  isBusy: boolean;
  quantityDraft: string;
  onToggleSelected: (id: string) => void;
  onQuantityDraftChange: (id: string, quantity: string) => void;
  onSaveQuantity: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
};

export function InventoryItemRow({
  item,
  isSelected,
  isBusy,
  quantityDraft,
  onToggleSelected,
  onQuantityDraftChange,
  onSaveQuantity,
  onDelete
}: InventoryItemRowProps) {
  const draftChanged = Number(quantityDraft) !== Number(item.quantity);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-amber-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelected(item.id)}
            className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            aria-label={`Select ${item.item_name}`}
          />
          <div>
            <p className="font-bold capitalize text-gray-950">{item.item_name}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Added via {item.added_via ?? 'search'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            Qty
            <input
              type="number"
              min="0"
              step="0.01"
              value={quantityDraft}
              onChange={(event) => onQuantityDraftChange(item.id, event.target.value)}
              onBlur={() => {
                if (draftChanged) onSaveQuantity(item);
              }}
              className="w-24 rounded-xl border border-amber-200 px-3 py-2 text-sm text-gray-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />
          </label>
          <span className="rounded-full bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700">{item.unit}</span>
          {draftChanged ? (
            <button
              type="button"
              onClick={() => onSaveQuantity(item)}
              disabled={isBusy}
              className="rounded-full bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-700 disabled:bg-gray-300"
            >
              Save
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete(item)}
            disabled={isBusy}
            className="rounded-full border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
