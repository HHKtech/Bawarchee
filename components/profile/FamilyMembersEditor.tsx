import { ageGroupOptions } from '@/lib/profile-options';
import type { AgeGroup } from '@/lib/supabase/types';

export type EditableFamilyMember = {
  localId: string;
  age_group: AgeGroup;
};

type FamilyMembersEditorProps = {
  members: EditableFamilyMember[];
  onChange: (members: EditableFamilyMember[]) => void;
};

export function FamilyMembersEditor({ members, onChange }: FamilyMembersEditorProps) {
  function addMember() {
    const localId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    onChange([...members, { localId, age_group: 'adult' }]);
  }

  function updateMember(localId: string, age_group: AgeGroup) {
    onChange(members.map((member) => (member.localId === localId ? { ...member, age_group } : member)));
  }

  function removeMember(localId: string) {
    onChange(members.filter((member) => member.localId !== localId));
  }

  const householdSize = members.length + 1;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Household Portion Multiplier</p>
        <p className="mt-2 text-3xl font-bold text-gray-950">{householdSize}x</p>
        <p className="mt-1 text-sm text-gray-600">
          You + {members.length} family member{members.length === 1 ? '' : 's'} = {householdSize} total people for recipe scaling.
        </p>
      </div>

      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-5 text-sm text-gray-600">
            No extra family members yet. Bawarchee will plan for just you unless you add household members.
          </div>
        ) : null}

        {members.map((member, index) => (
          <div key={member.localId} className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-semibold text-gray-800">
              Family member {index + 1}
              <select
                value={member.age_group}
                onChange={(event) => updateMember(member.localId, event.target.value as AgeGroup)}
                className="mt-2 block w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 sm:w-56"
              >
                {ageGroupOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => removeMember(member.localId)}
              className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMember}
        className="rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Add family member
      </button>
    </section>
  );
}
