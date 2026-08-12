export type AgeGroup = 'child' | 'adult' | 'senior';
export type CookingSkill = 'beginner' | 'intermediate' | 'advanced';
export type CatalogItem = {
  id: string;
  name: string;
  category: string;
  default_unit: string;
};

export type InventoryAddedVia = 'search' | 'receipt' | 'manual';
export type ReceiptScanStatus = 'pending' | 'confirmed' | 'discarded';

export type InventoryItem = {
  id: string;
  user_id: string;
  catalog_item_id: string | null;
  item_name: string;
  category: string | null;
  quantity: number;
  unit: string;
  added_via: InventoryAddedVia | null;
  updated_at: string;
};

export type ReceiptScan = {
  id: string;
  user_id: string;
  image_url: string;
  status: ReceiptScanStatus;
  created_at: string;
};

export type ReceiptScanItem = {
  id: string;
  scan_id: string;
  raw_text: string;
  matched_catalog_item_id: string | null;
  matched_item_name: string | null;
  quantity: number;
  unit: string;
  confirmed: boolean;
};

export type Profile = {
  id: string;
  is_onboarded: boolean;
  dietary_restrictions: string[] | null;
  allergies: string | null;
  cuisine_preference: string[] | null;
  cooking_skill: CookingSkill | null;
  calorie_goal: number | null;
  household_size: number | null;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  user_id: string;
  age_group: AgeGroup;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          is_onboarded?: boolean;
          dietary_restrictions?: string[] | null;
          allergies?: string | null;
          cuisine_preference?: string[] | null;
          cooking_skill?: string | null;
          calorie_goal?: number | null;
          household_size?: number | null;
          created_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      family_members: {
        Row: FamilyMember;
        Insert: {
          id?: string;
          user_id?: string;
          age_group?: AgeGroup;
          created_at?: string;
        };
        Update: Partial<Omit<FamilyMember, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      catalog_items: {
        Row: CatalogItem;
        Insert: {
          id?: string;
          name: string;
          category: string;
          default_unit: string;
        };
        Update: Partial<Omit<CatalogItem, 'id'>>;
        Relationships: [];
      };
      inventory_items: {
        Row: InventoryItem;
        Insert: {
          id?: string;
          user_id?: string;
          catalog_item_id?: string | null;
          item_name: string;
          category?: string | null;
          quantity: number;
          unit: string;
          added_via?: InventoryAddedVia | null;
          updated_at?: string;
        };
        Update: Partial<Omit<InventoryItem, 'id' | 'user_id'>>;
        Relationships: [];
      };
      receipt_scans: {
        Row: ReceiptScan;
        Insert: {
          id?: string;
          user_id?: string;
          image_url: string;
          status?: ReceiptScanStatus;
          created_at?: string;
        };
        Update: Partial<Omit<ReceiptScan, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      receipt_scan_items: {
        Row: ReceiptScanItem;
        Insert: {
          id?: string;
          scan_id: string;
          raw_text: string;
          matched_catalog_item_id?: string | null;
          matched_item_name?: string | null;
          quantity?: number;
          unit?: string;
          confirmed?: boolean;
        };
        Update: Partial<Omit<ReceiptScanItem, 'id' | 'scan_id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
