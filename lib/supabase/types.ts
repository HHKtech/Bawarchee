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
export type ReceiptScanStatus = 'pending' | 'confirmed' | 'discarded' | 'failed';

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
  suggested_name?: string | null;
  matched_item_name?: string | null;
  category?: string | null;
  quantity: number;
  unit: string;
  confidence?: number | null;
  confirmed?: boolean | null;
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

export type RecipeSession = {
  id: string;
  user_id: string;
  selected_inventory_item_ids: string[];
  exclusions: string[];
  created_at: string;
};

export type RecipeSuggestionIngredient = {
  item_name: string;
  quantity: number;
  unit: string;
};

export type RecipeSuggestion = {
  id: string;
  session_id: string;
  user_id: string;
  title: string;
  ingredients_used: RecipeSuggestionIngredient[];
  steps: string[];
  est_time_minutes: number | null;
  est_calories: number | null;
  serves: number | null;
  status: 'suggested' | 'cooked';
  created_at: string;
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
        Row: {
          id: string;
          scan_id: string;
          raw_text: string;
          matched_catalog_item_id: string | null;
          suggested_name?: string | null;
          matched_item_name?: string | null;
          category?: string | null;
          quantity: number;
          unit: string;
          confidence?: number | null;
          confirmed?: boolean | null;
        };
        Insert: {
          id?: string;
          scan_id: string;
          raw_text: string;
          matched_catalog_item_id?: string | null;
          suggested_name?: string | null;
          matched_item_name?: string | null;
          category?: string | null;
          quantity?: number;
          unit?: string;
          confidence?: number | null;
          confirmed?: boolean | null;
        };
        Update: {
          id?: string;
          scan_id?: string;
          raw_text?: string;
          matched_catalog_item_id?: string | null;
          suggested_name?: string | null;
          matched_item_name?: string | null;
          category?: string | null;
          quantity?: number;
          unit?: string;
          confidence?: number | null;
          confirmed?: boolean | null;
        };
        Relationships: GenericRelationship[];
      };
      recipe_sessions: {
        Row: {
          id: string;
          user_id: string;
          selected_inventory_item_ids: string[];
          exclusions: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          selected_inventory_item_ids?: string[];
          exclusions?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          selected_inventory_item_ids?: string[];
          exclusions?: string[];
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      recipe_suggestions: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          title: string;
          ingredients_used: Json;
          steps: string[];
          est_time_minutes: number | null;
          est_calories: number | null;
          serves: number | null;
          status: 'suggested' | 'cooked';
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string;
          title: string;
          ingredients_used: Json;
          steps: string[];
          est_time_minutes?: number | null;
          est_calories?: number | null;
          serves?: number | null;
          status?: 'suggested' | 'cooked';
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          title?: string;
          ingredients_used?: Json;
          steps?: string[];
          est_time_minutes?: number | null;
          est_calories?: number | null;
          serves?: number | null;
          status?: 'suggested' | 'cooked';
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
    };
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
};
