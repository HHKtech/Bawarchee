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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelected(item.id)}
            className="mt-1 h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
            aria-label={`Select ${item.item_name}`}
          />
          <div>
            <p className="font-bold capitalize text-slate-900">{item.item_name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-200/60 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">{item.category || 'Other'}</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Added via {item.added_via ?? 'search'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
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
              className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </label>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">{item.unit}</span>
          {draftChanged ? (
            <button
              type="button"
              onClick={() => onSaveQuantity(item)}
              disabled={isBusy}
              className="rounded-full bg-orange-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-700 disabled:bg-slate-300"
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
