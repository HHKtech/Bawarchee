'use client';

import { useDashboard } from '@/context/DashboardContext';

export function ChatPanel() {
  const { selectedItemIds, activeSessionId } = useDashboard();

  return (
    <section className="flex h-full min-h-[520px] flex-col rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
      <div className="border-b border-amber-100 pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Module 8</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-950">AI Chat</h2>
        <p className="mt-2 text-sm text-gray-600">A guided cooking assistant will use your selected pantry items and active recipe session here.</p>
      </div>

      <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-amber-200 bg-amber-50/60 p-8 text-center">
        <div className="text-4xl">💬</div>
        <h3 className="mt-4 text-lg font-bold text-gray-950">Chat placeholder</h3>
        <p className="mt-2 max-w-sm text-sm text-gray-600">Module 8 will add conversational recipe refinement, substitutions, and cooking guidance.</p>
        <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-left text-xs font-semibold text-gray-500 shadow-sm">
          <p>Selected items: {selectedItemIds.length}</p>
          <p>Active session: {activeSessionId ?? 'none yet'}</p>
        </div>
      </div>
    </section>
  );
}
