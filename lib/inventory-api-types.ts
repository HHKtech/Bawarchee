import type { InventoryAddedVia, InventoryItem } from '@/lib/supabase/types';

export type InventoryAddItemPayload = {
  catalog_item_id?: string | null;
  item_name: string;
  category?: string | null;
  quantity: number;
  unit: string;
  added_via?: InventoryAddedVia;
};

export type InventoryPostPayload = {
  items: InventoryAddItemPayload[];
};

export type InventoryPatchPayload = {
  id: string;
  quantity: number;
};

export type InventoryResponse = {
  items: InventoryItem[];
};
