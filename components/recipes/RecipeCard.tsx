'use client';

import { useState } from 'react';
import type { RecipeSuggestion } from '@/lib/supabase/types';
import { useDashboard } from '@/context/DashboardContext';

type RecipeCardProps = {
  recipe: RecipeSuggestion;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { triggerInventoryRefresh } = useDashboard();
  const [status, setStatus] = useState<'suggested' | 'cooked'>(recipe.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  async function handleMarkAsCooked() {
    if (status === 'cooked' || isUpdating) return;
    setIsUpdating(true);
    setToast(null);

    try {
      const response = await fetch('/api/inventory/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: recipe.id,
          session_id: recipe.session_id,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Failed to deduct recipe ingredients.');
      }

      const data = await response.json();
      setStatus('cooked');
      
      const totalCount = (data.deducted_items_count || 0) + (data.removed_items_count || 0);
      setToast(`Inventory updated: ${totalCount} ingredients deducted! 🍳`);
      
      // Auto-hide toast after 4 seconds
      setTimeout(() => setToast(null), 4000);

      // Signal InventoryPanel to refresh the pantry items
      triggerInventoryRefresh();
    } catch (error) {
      console.error(error);
      setToast('Failed to update inventory. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  function toggleIngredient(idx: number) {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  const isCooked = status === 'cooked';

  return (
    <article
      className={`group relative flex flex-col rounded-3xl border p-6 transition-all duration-300 ${
        isCooked
          ? 'border-emerald-200 bg-emerald-50/40 shadow-sm'
          : 'border-amber-100 bg-white hover:border-amber-200 hover:shadow-md'
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-4 left-4 right-4 z-10 flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-300 ${
          toast.includes('Failed') ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-sm font-bold text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Cooked Badge */}
      {isCooked && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 shadow-sm">
          <span>🍳</span> Cooked
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="pr-16 text-xl font-bold text-gray-950 transition-colors group-hover:text-amber-700">
          {recipe.title}
        </h3>

        {/* Quick info row */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-gray-500">
          {recipe.est_time_minutes && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800 font-semibold">
              <span>⏱️</span> {recipe.est_time_minutes} mins
            </div>
          )}
          {recipe.est_calories && (
            <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-orange-800 font-semibold">
              <span>🔥</span> {recipe.est_calories} kcal
            </div>
          )}
          {recipe.serves && (
            <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-yellow-800 font-semibold">
              <span>👥</span> Serves {recipe.serves}
            </div>
          )}
        </div>
      </div>

      <hr className="my-5 border-amber-50" />

      {/* Ingredients Checklist */}
      <div className="flex-1">
        <h4 className="text-sm font-bold tracking-wide uppercase text-gray-400">Ingredients Checklist</h4>
        <ul className="mt-3 space-y-2">
          {recipe.ingredients_used.map((ingredient, idx) => {
            const isChecked = !!checkedIngredients[idx];
            return (
              <li
                key={idx}
                onClick={() => toggleIngredient(idx)}
                className="flex cursor-pointer items-center gap-3 rounded-xl p-2 transition hover:bg-amber-50/50"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                    isChecked
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-gray-300 bg-white group-hover:border-amber-300'
                  }`}
                >
                  {isChecked && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-sm transition-all ${
                    isChecked ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'
                  }`}
                >
                  {ingredient.quantity} {ingredient.unit} {ingredient.item_name}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <hr className="my-5 border-amber-50" />

      {/* Instructions / Steps */}
      <div className="mb-6">
        <h4 className="text-sm font-bold tracking-wide uppercase text-gray-400">Instructions</h4>
        <ol className="mt-3 space-y-3">
          {recipe.steps.map((step, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-gray-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                {idx + 1}
              </span>
              <span className="leading-relaxed font-medium">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleMarkAsCooked}
        disabled={isCooked || isUpdating}
        className={`w-full rounded-2xl py-3 text-center text-sm font-bold shadow-sm transition-all duration-300 ${
          isCooked
            ? 'bg-emerald-100 text-emerald-800 cursor-default'
            : isUpdating
            ? 'bg-amber-100 text-amber-800 cursor-wait'
            : 'bg-amber-600 text-white hover:bg-amber-700 hover:shadow active:scale-95'
        }`}
      >
        {isCooked ? 'Cooked! 🎉' : isUpdating ? 'Saving...' : 'I cooked this! 🍳'}
      </button>
    </article>
  );
}
