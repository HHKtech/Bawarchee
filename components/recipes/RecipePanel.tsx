'use client';

import { useDashboard } from '@/context/DashboardContext';
import { RecipeCard } from '@/components/recipes/RecipeCard';

export function RecipePanel() {
  const { generatedRecipes, isGeneratingRecipes, selectedItemIds } = useDashboard();

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex-shrink-0 border-b border-slate-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Module 7</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900 font-sans">Generated Recipes</h2>
        <p className="mt-2 text-sm text-slate-600">
          Recipe suggestions generated from checked inventory items will appear in this panel.
        </p>
      </div>

      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        {isGeneratingRecipes ? (
          // Premium Loading Skeleton
          <div className="flex flex-1 flex-col justify-center py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-3xl animate-bounce">
              ✨
            </div>
            <h3 className="mt-6 text-lg font-bold text-gray-950 animate-pulse">
              Bawarchee is crafting your recipes...
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
              Gemini is consulting Bawarchee&apos;s flavor engine to match your preferences and portions.
            </p>

            <div className="mt-8 space-y-4 text-left">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-3xl border border-amber-50 p-6 space-y-4">
                  <div className="h-6 w-3/4 rounded-md bg-gray-200" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-gray-200" />
                    <div className="h-5 w-16 rounded-full bg-gray-200" />
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="h-4 w-full rounded-md bg-gray-100" />
                    <div className="h-4 w-5/6 rounded-md bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : generatedRecipes && generatedRecipes.length > 0 ? (
          // Recipe Cards List
          <div className="space-y-5 pb-2">
            {generatedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 p-8 text-center">
            <div className="text-4xl animate-pulse">✨</div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">No recipes generated yet</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Select pantry items from the inventory list and use **Generate Recipes** to request your personalized culinary recommendations.
            </p>
            <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-xs font-semibold text-gray-500 shadow-sm border border-orange-100/50">
              {selectedItemIds.length} item{selectedItemIds.length === 1 ? '' : 's'} selected for recipe generation.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
