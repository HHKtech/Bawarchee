import type { AgeGroup, CookingSkill, Profile } from '@/lib/supabase/types';

export type ProfileFormFamilyMember = {
  age_group: AgeGroup;
};

export type ProfilePayload = {
  dietary_restrictions: string[];
  allergies: string;
  cuisine_preference: string[];
  cooking_skill: CookingSkill;
  calorie_goal: number | null;
  family_members: ProfileFormFamilyMember[];
};

export type ProfileApiFamilyMember = {
  id: string;
  user_id: string;
  age_group: AgeGroup;
  created_at: string;
};

export type ProfileApiResponse = {
  profile: Profile | null;
  family_members: ProfileApiFamilyMember[];
};
