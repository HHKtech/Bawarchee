import catalogSeed from './catalog-seed.json';

export type CatalogItem = {
  id?: string | null;
  name: string;
  category: string;
  default_unit: string;
};

export type CatalogResponse = {
  items: CatalogItem[];
  total: number;
};

export const CATALOG_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Meat & Poultry',
  'Seafood',
  'Dairy & Eggs',
  'Grains & Pulses',
  'Spices & Seasonings',
  'Oils & Condiments',
  'Bakery',
  'Beverages',
  'Baking & Pantry'
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

export const DEFAULT_CATALOG_LIMIT = 50;
export const MAX_CATALOG_LIMIT = 100;

export const seedCatalogItems = catalogSeed as CatalogItem[];

export function normalizeCatalogLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? '', 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_CATALOG_LIMIT;
  }

  return Math.min(parsed, MAX_CATALOG_LIMIT);
}

export function filterSeedCatalogItems({
  q,
  category,
  limit = DEFAULT_CATALOG_LIMIT
}: {
  q?: string | null;
  category?: string | null;
  limit?: number;
}) {
  const normalizedQuery = q?.trim().toLowerCase();
  const normalizedCategory = category?.trim().toLowerCase();

  const filtered = seedCatalogItems.filter((item) => {
    const matchesQuery = normalizedQuery ? item.name.toLowerCase().includes(normalizedQuery) : true;
    const matchesCategory = normalizedCategory ? item.category.toLowerCase() === normalizedCategory : true;

    return matchesQuery && matchesCategory;
  });

  return {
    items: filtered.slice(0, limit),
    total: filtered.length
  };
}
