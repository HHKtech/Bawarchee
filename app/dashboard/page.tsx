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
    <section className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden">
      <div className="mb-4 flex-shrink-0 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm lg:hidden" role="tablist" aria-label="Dashboard panels">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                activeTab === tab.id ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-12">
        <div className={`${activeTab === 'inventory' ? 'flex' : 'hidden lg:flex'} h-full min-h-0 flex-col overflow-hidden lg:col-span-3`}>
          <InventoryPanel />
        </div>
        <div className={`${activeTab === 'chat' ? 'flex' : 'hidden lg:flex'} h-full min-h-0 flex-col overflow-hidden lg:col-span-4`}>
          <ChatPanel />
        </div>
        <div className={`${activeTab === 'recipes' ? 'flex' : 'hidden lg:flex'} h-full min-h-0 flex-col overflow-hidden lg:col-span-5`}>
          <RecipePanel />
        </div>
      </div>
    </section>
  );
}
