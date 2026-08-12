import type { AgeGroup, CookingSkill, Profile } from '@/lib/supabase/types';
import type { ProfileApiResponse, ProfilePayload } from '@/lib/profile-api-types';
import type { EditableFamilyMember } from '@/components/profile/FamilyMembersEditor';

export type ProfileFormState = {
  dietary_restrictions: string[];
  allergies: string;
  cuisine_preference: string[];
  cooking_skill: CookingSkill;
  calorie_goal: string;
  family_members: EditableFamilyMember[];
};

export const defaultProfileFormState: ProfileFormState = {
  dietary_restrictions: ['none'],
  allergies: '',
  cuisine_preference: [],
  cooking_skill: 'beginner',
  calorie_goal: '',
  family_members: []
};

export function profileResponseToForm(data: ProfileApiResponse): ProfileFormState {
  const profile = data.profile;

  return {
    dietary_restrictions: profile?.dietary_restrictions?.length ? profile.dietary_restrictions : ['none'],
    allergies: profile?.allergies ?? '',
    cuisine_preference: profile?.cuisine_preference ?? [],
    cooking_skill: profile?.cooking_skill ?? 'beginner',
    calorie_goal: profile?.calorie_goal ? String(profile.calorie_goal) : '',
    family_members: data.family_members.map((member) => ({
      localId: member.id,
      age_group: member.age_group
    }))
  };
}

export function formToPayload(form: ProfileFormState): ProfilePayload {
  const calorieGoal = Number.parseInt(form.calorie_goal, 10);

  return {
    dietary_restrictions: form.dietary_restrictions,
    allergies: form.allergies,
    cuisine_preference: form.cuisine_preference,
    cooking_skill: form.cooking_skill,
    calorie_goal: Number.isFinite(calorieGoal) && calorieGoal > 0 ? calorieGoal : null,
    family_members: form.family_members.map((member) => ({ age_group: member.age_group as AgeGroup }))
  };
}

export function mergeSavedProfile(current: ProfileFormState, profile: Profile | null): ProfileFormState {
  if (!profile) {
    return current;
  }

  return {
    ...current,
    dietary_restrictions: profile.dietary_restrictions?.length ? profile.dietary_restrictions : ['none'],
    allergies: profile.allergies ?? '',
    cuisine_preference: profile.cuisine_preference ?? [],
    cooking_skill: profile.cooking_skill ?? current.cooking_skill,
    calorie_goal: profile.calorie_goal ? String(profile.calorie_goal) : ''
  };
}
