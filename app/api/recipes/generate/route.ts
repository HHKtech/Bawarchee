import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRecipesFromInventory } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Authenticate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse payload
    const { selected_item_ids, exclusions } = await request.json();

    if (!selected_item_ids || !Array.isArray(selected_item_ids) || selected_item_ids.length === 0) {
      return NextResponse.json({ error: 'Missing selected_item_ids' }, { status: 400 });
    }

    // Fetch user details from database
    const [profileRes, selectedItemsRes, fullInventoryRes, familyMembersRes] = await Promise.all([
      (supabase.from('profiles') as any).select('*').eq('id', user.id).single(),
      (supabase.from('inventory_items') as any).select('*').in('id', selected_item_ids).eq('user_id', user.id),
      (supabase.from('inventory_items') as any).select('*').eq('user_id', user.id),
      (supabase.from('family_members') as any).select('*').eq('user_id', user.id),
    ]);

    if (profileRes.error) {
      console.warn('Profile not found, using default preferences:', profileRes.error.message);
    }

    const profile = profileRes.data;
    const selectedItems = selectedItemsRes.data || [];
    const fullInventory = fullInventoryRes.data || [];
    const familyMembers = familyMembersRes.data || [];

    if (selectedItems.length === 0) {
      return NextResponse.json({ error: 'None of the selected inventory items were found.' }, { status: 404 });
    }

    // Insert new recipe session record
    const { data: sessionRow, error: sessionError } = await (supabase as any)
      .from('recipe_sessions')
      .insert({
        user_id: user.id,
        selected_inventory_item_ids: selected_item_ids,
        exclusions: exclusions || [],
      })
      .select('id')
      .single();

    if (sessionError || !sessionRow) {
      console.error('Session insert error:', sessionError);
      return NextResponse.json({ error: 'Failed to create recipe session' }, { status: 500 });
    }

    // Format profile parameters for AI
    const profileParams = {
      dietary_restrictions: profile?.dietary_restrictions || [],
      allergies: profile?.allergies || '',
      cuisine_preference: profile?.cuisine_preference || [],
      cooking_skill: profile?.cooking_skill || 'beginner',
      household_size: profile?.household_size || (familyMembers.length + 1),
    };

    // Call Gemini to generate recipes
    const generatedRecipes = await generateRecipesFromInventory({
      selectedItems: selectedItems.map((item: any) => ({
        item_name: item.item_name,
        quantity: Number(item.quantity),
        unit: item.unit,
      })),
      fullInventory: fullInventory.map((item: any) => ({
        item_name: item.item_name,
        quantity: Number(item.quantity),
        unit: item.unit,
      })),
      profile: profileParams,
      exclusions: exclusions || [],
    });

    // Format suggestions to insert in DB
    const suggestionsPayload = generatedRecipes.map((recipe) => ({
      session_id: sessionRow.id,
      user_id: user.id,
      title: recipe.title,
      ingredients_used: recipe.ingredients_used,
      steps: recipe.steps,
      est_time_minutes: recipe.est_time_minutes,
      est_calories: recipe.est_calories,
      serves: recipe.serves,
      status: 'suggested' as const,
    }));

    const { data: insertedSuggestions, error: insertError } = await (supabase as any)
      .from('recipe_suggestions')
      .insert(suggestionsPayload)
      .select('*');

    if (insertError || !insertedSuggestions) {
      console.error('Suggestions insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save generated recipe suggestions' }, { status: 500 });
    }

    return NextResponse.json(
      {
        session_id: sessionRow.id,
        recipes: insertedSuggestions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/recipes/generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recipes' },
      { status: 500 }
    );
  }
}
