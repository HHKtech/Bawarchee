export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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

export type ReceiptScanStatus = 'pending' | 'confirmed' | 'failed';

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
  suggested_name: string;
  category: string;
  quantity: number;
  unit: string;
  confidence: number;
};

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
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
        Update: {
          id?: string;
          is_onboarded?: boolean;
          dietary_restrictions?: string[] | null;
          allergies?: string | null;
          cuisine_preference?: string[] | null;
          cooking_skill?: string | null;
          calorie_goal?: number | null;
          household_size?: number | null;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      family_members: {
        Row: FamilyMember;
        Insert: {
          id?: string;
          user_id?: string;
          age_group?: AgeGroup;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          age_group?: AgeGroup;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      catalog_items: {
        Row: CatalogItem;
        Insert: {
          id?: string;
          name: string;
          category: string;
          default_unit: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          default_unit?: string;
        };
        Relationships: GenericRelationship[];
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
        Update: {
          id?: string;
          user_id?: string;
          catalog_item_id?: string | null;
          item_name?: string;
          category?: string | null;
          quantity?: number;
          unit?: string;
          added_via?: InventoryAddedVia | null;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
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
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          status?: ReceiptScanStatus;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      receipt_scan_items: {
        Row: ReceiptScanItem;
        Insert: {
          id?: string;
          scan_id: string;
          raw_text: string;
          matched_catalog_item_id?: string | null;
          suggested_name: string;
          category: string;
          quantity: number;
          unit: string;
          confidence?: number;
        };
        Update: {
          id?: string;
          scan_id?: string;
          raw_text?: string;
          matched_catalog_item_id?: string | null;
          suggested_name?: string;
          category?: string;
          quantity?: number;
          unit?: string;
          confidence?: number;
        };
        Relationships: GenericRelationship[];
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
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
};
