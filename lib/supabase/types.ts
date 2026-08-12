export type Profile = {
  id: string;
  is_onboarded: boolean;
  dietary_restrictions: string[] | null;
  allergies: string | null;
  cuisine_preference: string[] | null;
  cooking_skill: string | null;
  calorie_goal: number | null;
  household_size: number | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
