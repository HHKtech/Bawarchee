import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AgeGroup, CookingSkill } from '@/lib/supabase/types';
import type { ProfilePayload } from '@/lib/profile-api-types';

const ageGroups: AgeGroup[] = ['child', 'adult', 'senior'];
const cookingSkills: CookingSkill[] = ['beginner', 'intermediate', 'advanced'];

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))];
}

function parsePayload(body: unknown): ProfilePayload {
  const data = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const rawFamily = Array.isArray(data.family_members) ? data.family_members : [];
  const familyMembers = rawFamily
    .map((member) => {
      const ageGroup = typeof member === 'object' && member !== null ? (member as { age_group?: unknown }).age_group : undefined;
      return ageGroups.includes(ageGroup as AgeGroup) ? { age_group: ageGroup as AgeGroup } : null;
    })
    .filter((member): member is { age_group: AgeGroup } => Boolean(member));

  const cookingSkill = cookingSkills.includes(data.cooking_skill as CookingSkill) ? (data.cooking_skill as CookingSkill) : 'beginner';
  const calorieGoal = typeof data.calorie_goal === 'number' && Number.isFinite(data.calorie_goal) && data.calorie_goal > 0
    ? Math.round(data.calorie_goal)
    : null;

  return {
    dietary_restrictions: cleanStringArray(data.dietary_restrictions),
    allergies: typeof data.allergies === 'string' ? data.allergies.trim() : '',
    cuisine_preference: cleanStringArray(data.cuisine_preference),
    cooking_skill: cookingSkill,
    calorie_goal: calorieGoal,
    family_members: familyMembers
  };
}

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: profile, error: profileError }, { data: familyMembers, error: familyError }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('family_members').select('id, user_id, age_group, created_at').eq('user_id', user.id).order('created_at', { ascending: true })
  ]);

  if (profileError || familyError) {
    return NextResponse.json({ error: profileError?.message ?? familyError?.message ?? 'Could not load profile' }, { status: 500 });
  }

  return NextResponse.json({ profile, family_members: familyMembers ?? [] });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: ProfilePayload;

  try {
    payload = parsePayload(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const householdSize = payload.family_members.length + 1;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      dietary_restrictions: payload.dietary_restrictions,
      allergies: payload.allergies || null,
      cuisine_preference: payload.cuisine_preference,
      cooking_skill: payload.cooking_skill,
      calorie_goal: payload.calorie_goal,
      household_size: householdSize,
      is_onboarded: true
    }, { onConflict: 'id' })
    .select('*')
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase.from('family_members').delete().eq('user_id', user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (payload.family_members.length > 0) {
    const { error: insertError } = await supabase
      .from('family_members')
      .insert(payload.family_members.map((member) => ({ user_id: user.id, age_group: member.age_group })));

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const { data: familyMembers } = await supabase
    .from('family_members')
    .select('id, user_id, age_group, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ profile, family_members: familyMembers ?? [] });
}
