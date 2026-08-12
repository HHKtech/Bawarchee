'use client';

import { useDashboard } from '@/context/DashboardContext';

export function RecipePanel() {
  const { generatedRecipes, selectedItemIds } = useDashboard();

  return (
    <section className="flex h-full min-h-[520px] flex-col rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
      <div className="border-b border-amber-100 pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Module 7</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-950">Generated Recipes</h2>
        <p className="mt-2 text-sm text-gray-600">Recipe suggestions generated from checked inventory items will appear in this panel.</p>
      </div>

      <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 p-8 text-center">
        <div className="text-4xl">✨</div>
        <h3 className="mt-4 text-lg font-bold text-gray-950">Recipe panel placeholder</h3>
        <p className="mt-2 max-w-sm text-sm text-gray-600">
          Select pantry items and use Generate Recipes to prepare the Module 7 payload. Generated results will be listed here.
        </p>
        <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-xs font-semibold text-gray-500 shadow-sm">
          {generatedRecipes.length} recipe{generatedRecipes.length === 1 ? '' : 's'} ready from {selectedItemIds.length} selected item
          {selectedItemIds.length === 1 ? '' : 's'}.
        </div>
      </div>
    </section>
  );
}
