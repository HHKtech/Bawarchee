'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CatalogSearch } from '@/components/catalog/CatalogSearch';
import type { CatalogItem } from '@/lib/catalog';

export default function CatalogPreviewPage() {
  const [selectedItems, setSelectedItems] = useState<CatalogItem[]>([]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-amber-700 transition hover:text-amber-800">
          ← Back home
        </Link>

        <div className="mt-6 rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-amber-100 backdrop-blur sm:p-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">Module 3 Preview</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-5xl">Catalog search and multi-select</h1>
            <p className="mt-4 text-gray-600">
              Search public grocery catalog items, filter by category, and select ingredients as chips. Module 4 inventory screens will reuse this component.
            </p>
          </div>

          <CatalogSearch selectedItems={selectedItems} onSelectedItemsChange={setSelectedItems} />
        </div>
      </section>
    </main>
  );
}
