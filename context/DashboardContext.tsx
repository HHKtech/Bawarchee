'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type GeneratedRecipe = any;

type DashboardContextValue = {
  selectedItemIds: string[];
  activeSessionId: string | null;
  generatedRecipes: GeneratedRecipe[];
  isGeneratingRecipes: boolean;
  toggleSelectItem: (id: string) => void;
  selectAllItems: (ids: string[]) => void;
  clearSelections: () => void;
  setActiveSessionId: (id: string | null) => void;
  setGeneratedRecipes: (recipes: GeneratedRecipe[]) => void;
  setIsGeneratingRecipes: (loading: boolean) => void;
};

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState<boolean>(false);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItemIds((currentIds) => (currentIds.includes(id) ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id]));
  }, []);

  const selectAllItems = useCallback((ids: string[]) => {
    setSelectedItemIds(Array.from(new Set(ids)));
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedItemIds([]);
  }, []);

  const value = useMemo(
    () => ({
      selectedItemIds,
      activeSessionId,
      generatedRecipes,
      isGeneratingRecipes,
      toggleSelectItem,
      selectAllItems,
      clearSelections,
      setActiveSessionId,
      setGeneratedRecipes,
      setIsGeneratingRecipes
    }),
    [activeSessionId, clearSelections, generatedRecipes, isGeneratingRecipes, selectAllItems, selectedItemIds, toggleSelectItem]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider.');
  }

  return context;
}
