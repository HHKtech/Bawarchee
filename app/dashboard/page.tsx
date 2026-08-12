import { InventoryPanel } from '@/components/inventory/InventoryPanel';

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <InventoryPanel />

        <aside className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Coming next</p>
          <h2 className="mt-2 text-xl font-bold text-gray-950">Receipt Scanner</h2>
          <p className="mt-3 text-sm text-gray-600">
            Module 5 will turn receipt scans into inventory additions. For now, use the inventory panel to search catalog items, merge quantities, edit amounts, and delete pantry rows.
          </p>
        </aside>
      </div>
    </section>
  );
}
