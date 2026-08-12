import { ageGroupOptions, cookingSkillOptions, cuisineOptions, dietaryOptions } from '@/lib/profile-options';
import type { ProfileFormState } from '@/lib/profile-form';

type ProfileReviewProps = {
  form: ProfileFormState;
};

function labels(values: string[], options: readonly { value: string; label: string }[]) {
  if (!values.length) {
    return 'None selected';
  }

  return values.map((value) => options.find((option) => option.value === value)?.label ?? value).join(', ');
}

export function ProfileReview({ form }: ProfileReviewProps) {
  const cookingSkill = cookingSkillOptions.find((option) => option.value === form.cooking_skill)?.label ?? form.cooking_skill;
  const householdSize = form.family_members.length + 1;

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-100 bg-white p-5">
          <p className="text-sm font-semibold text-gray-500">Dietary restrictions</p>
          <p className="mt-2 font-medium text-gray-950">{labels(form.dietary_restrictions, dietaryOptions)}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-5">
          <p className="text-sm font-semibold text-gray-500">Cuisine preferences</p>
          <p className="mt-2 font-medium text-gray-950">{labels(form.cuisine_preference, cuisineOptions)}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-5">
          <p className="text-sm font-semibold text-gray-500">Allergies</p>
          <p className="mt-2 font-medium text-gray-950">{form.allergies.trim() || 'None listed'}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-5">
          <p className="text-sm font-semibold text-gray-500">Cooking skill</p>
          <p className="mt-2 font-medium text-gray-950">{cookingSkill}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-5">
          <p className="text-sm font-semibold text-gray-500">Calorie goal</p>
          <p className="mt-2 font-medium text-gray-950">{form.calorie_goal || 'Not set'}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-5">
          <p className="text-sm font-semibold text-gray-500">Household size</p>
          <p className="mt-2 font-medium text-gray-950">{householdSize} people ({householdSize}x portions)</p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white p-5">
        <p className="text-sm font-semibold text-gray-500">Family members</p>
        {form.family_members.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {form.family_members.map((member, index) => (
              <li key={member.localId} className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                Member {index + 1}: {ageGroupOptions.find((option) => option.value === member.age_group)?.label ?? member.age_group}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 font-medium text-gray-950">No extra family members</p>
        )}
      </div>
    </section>
  );
}
