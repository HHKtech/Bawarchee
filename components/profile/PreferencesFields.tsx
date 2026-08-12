import { cookingSkillOptions, cuisineOptions, dietaryOptions } from '@/lib/profile-options';
import type { ProfileFormState } from '@/lib/profile-form';
import { MultiSelectChips } from './MultiSelectChips';

type PreferencesFieldsProps = {
  form: ProfileFormState;
  onChange: (form: ProfileFormState) => void;
};

export function PreferencesFields({ form, onChange }: PreferencesFieldsProps) {
  return (
    <section className="space-y-6">
      <MultiSelectChips
        label="Dietary restrictions"
        description="Choose all that apply. Use No restrictions when nothing else applies."
        options={dietaryOptions}
        selected={form.dietary_restrictions}
        onChange={(dietary_restrictions) => onChange({ ...form, dietary_restrictions })}
        exclusiveNone
      />

      <label className="block">
        <span className="text-sm font-semibold text-gray-950">Allergies</span>
        <span className="mt-1 block text-sm text-gray-500">Free-text is kept as written for future AI prompts.</span>
        <textarea
          value={form.allergies}
          onChange={(event) => onChange({ ...form, allergies: event.target.value })}
          rows={3}
          placeholder="e.g. peanuts, shellfish, avoid very spicy food"
          className="mt-3 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </label>

      <MultiSelectChips
        label="Cuisine preferences"
        description="Pick cuisines Bawarchee should prioritize for meal ideas."
        options={cuisineOptions}
        selected={form.cuisine_preference}
        onChange={(cuisine_preference) => onChange({ ...form, cuisine_preference })}
      />

      <fieldset>
        <legend className="text-sm font-semibold text-gray-950">Cooking skill</legend>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {cookingSkillOptions.map((option) => {
            const active = form.cooking_skill === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ ...form, cooking_skill: option.value })}
                className={`rounded-2xl border p-4 text-left transition ${
                  active ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-amber-100 bg-white hover:bg-amber-50/60'
                }`}
              >
                <span className="block font-semibold text-gray-950">{option.label}</span>
                <span className="mt-1 block text-sm text-gray-500">{option.description}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block max-w-xs">
        <span className="text-sm font-semibold text-gray-950">Daily calorie goal (optional)</span>
        <input
          type="number"
          min="1"
          value={form.calorie_goal}
          onChange={(event) => onChange({ ...form, calorie_goal: event.target.value })}
          placeholder="e.g. 2200"
          className="mt-3 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </label>
    </section>
  );
}
