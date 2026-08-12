import type { AgeGroup, CookingSkill } from '@/lib/supabase/types';

export const dietaryOptions = [
  { value: 'none', label: 'No restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'halal', label: 'Halal' },
  { value: 'no-pork', label: 'No pork' },
  { value: 'gluten-free', label: 'Gluten-free' }
] as const;

export const cuisineOptions = [
  { value: 'pakistani', label: 'Pakistani' },
  { value: 'indian', label: 'Indian' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'thai', label: 'Thai' },
  { value: 'american', label: 'American' }
] as const;

export const cookingSkillOptions: { value: CookingSkill; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Quick meals and simple steps' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with everyday cooking' },
  { value: 'advanced', label: 'Advanced', description: 'Confident with complex recipes' }
];

export const ageGroupOptions: { value: AgeGroup; label: string }[] = [
  { value: 'child', label: 'Child' },
  { value: 'adult', label: 'Adult' },
  { value: 'senior', label: 'Senior' }
];
