'use client';

import { useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { InventoryPanel } from '@/components/inventory/InventoryPanel';
import { RecipePanel } from '@/components/recipes/RecipePanel';

type DashboardTab = 'inventory' | 'chat' | 'recipes';

const tabs: { id: DashboardTab; label: string }[] = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'chat', label: 'AI Chat' },
  { id: 'recipes', label: 'Recipes' }
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('inventory');

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5 rounded-3xl border border-amber-100 bg-white p-2 shadow-sm lg:hidden" role="tablist" aria-label="Dashboard panels">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-3 py-2 text-sm font-bold transition ${
                activeTab === tab.id ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,3fr)_minmax(320px,4fr)_minmax(320px,5fr)] lg:items-start">
        <div className={activeTab === 'inventory' ? 'block' : 'hidden lg:block'}>
          <InventoryPanel />
        </div>
        <div className={activeTab === 'chat' ? 'block' : 'hidden lg:block'}>
          <ChatPanel />
        </div>
        <div className={activeTab === 'recipes' ? 'block' : 'hidden lg:block'}>
          <RecipePanel />
        </div>
      </div>
    </section>
  );
}
