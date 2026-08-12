'use client';

import { useEffect, useMemo, useState } from 'react';
import { CATALOG_CATEGORIES, type CatalogItem, type CatalogResponse } from '@/lib/catalog';

type CatalogSearchProps = {
  selectedItems: CatalogItem[];
  onSelectedItemsChange: (items: CatalogItem[]) => void;
  label?: string;
  placeholder?: string;
  limit?: number;
};

export function CatalogSearch({
  selectedItems,
  onSelectedItemsChange,
  label = 'Search catalog items',
  placeholder = 'Search onion, rice, chicken...',
  limit = 25
}: CatalogSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNames = useMemo(() => new Set(selectedItems.map((item) => item.name)), [selectedItems]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadItems() {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ limit: String(limit) });
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (category) params.set('category', category);

      try {
        const response = await fetch(`/api/catalog?${params.toString()}`, { signal: controller.signal });

        if (!response.ok) {
          throw new Error('Catalog search failed. Please try again.');
        }

        const payload = (await response.json()) as CatalogResponse;
        setItems(payload.items);
        setTotal(payload.total);
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError((fetchError as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadItems();
    return () => controller.abort();
  }, [debouncedQuery, category, limit]);

  function toggleItem(item: CatalogItem) {
    if (selectedNames.has(item.name)) {
      onSelectedItemsChange(selectedItems.filter((selected) => selected.name !== item.name));
      return;
    }

    onSelectedItemsChange([...selectedItems, item]);
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="catalog-search" className="text-sm font-semibold text-gray-950">
          {label}
        </label>
        <input
          id="catalog-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('')}
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
            category === '' ? 'border-amber-500 bg-amber-500 text-white' : 'border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
          }`}
        >
          All
        </button>
        {CATALOG_CATEGORIES.map((catalogCategory) => (
          <button
            key={catalogCategory}
            type="button"
            onClick={() => setCategory(catalogCategory)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              category === catalogCategory
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
            }`}
          >
            {catalogCategory}
          </button>
        ))}
      </div>

      {selectedItems.length > 0 ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
          <p className="text-sm font-semibold text-amber-950">Selected items</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => toggleItem(item)}
                className="rounded-full bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
                aria-label={`Remove ${item.name}`}
              >
                {item.name} ×
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="min-h-48 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-1 text-sm text-gray-500">
          <span>{isLoading ? 'Searching...' : `${total} item${total === 1 ? '' : 's'} found`}</span>
          {category ? <span className="font-medium text-amber-700">{category}</span> : null}
        </div>

        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => {
            const active = selectedNames.has(item.name);
            return (
              <button
                key={item.id ?? item.name}
                type="button"
                onClick={() => toggleItem(item)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize text-gray-950">{item.name}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Unit: {item.default_unit}</p>
                  </div>
                  <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">{item.category}</span>
                </div>
              </button>
            );
          })}
        </div>

        {!isLoading && items.length === 0 ? <p className="p-6 text-center text-sm text-gray-500">No catalog items matched your search.</p> : null}
      </div>
    </div>
  );
}
