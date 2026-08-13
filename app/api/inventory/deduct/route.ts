import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { RecipeSuggestionIngredient } from '@/lib/supabase/types';

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
    const { recipe_id, session_id } = await request.json();

    if (!recipe_id || !session_id) {
      return NextResponse.json({ error: 'Missing recipe_id or session_id' }, { status: 400 });
    }

    // Fetch the target recipe suggestion
    const { data: suggestion, error: suggestionErr } = await (supabase as any)
      .from('recipe_suggestions')
      .select('*')
      .eq('id', recipe_id)
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .single();

    if (suggestionErr || !suggestion) {
      console.error('Recipe suggestion not found or access denied:', suggestionErr);
      return NextResponse.json({ error: 'Recipe suggestion not found' }, { status: 404 });
    }

    // Fetch session details (for exclusions list)
    const { data: session, error: sessionErr } = await (supabase as any)
      .from('recipe_sessions')
      .select('exclusions')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionErr || !session) {
      console.error('Session not found or access denied:', sessionErr);
      return NextResponse.json({ error: 'Recipe session not found' }, { status: 404 });
    }

    // Parse ingredients used in the suggestion
    const ingredientsUsed: RecipeSuggestionIngredient[] = Array.isArray(suggestion.ingredients_used)
      ? (suggestion.ingredients_used as any)
      : [];

    const exclusions: string[] = (session.exclusions || []).map((e: string) => e.toLowerCase().trim());

    // Fetch user's inventory
    const { data: inventory, error: inventoryErr } = await (supabase as any)
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id);

    if (inventoryErr || !inventory) {
      console.error('Failed to load user inventory:', inventoryErr);
      return NextResponse.json({ error: 'Failed to load pantry inventory' }, { status: 500 });
    }

    let deductedCount = 0;
    let removedCount = 0;

    // Begin deduction modifications
    for (const ingredient of ingredientsUsed) {
      const ingredientName = ingredient.item_name.toLowerCase().trim();

      // Skip if ingredient is in exclusions list (untracked spices/oils etc.)
      if (exclusions.includes(ingredientName)) {
        continue;
      }

      // Find matching item in user pantry inventory (case-insensitive)
      const matchedPantryItem = inventory.find(
        (item: any) => item.item_name.toLowerCase().trim() === ingredientName
      );

      if (matchedPantryItem) {
        // Deduction quantities are already portion-scaled by the AI to household size
        const scaledQty = Number(ingredient.quantity || 1);
        const existingQty = Number(matchedPantryItem.quantity || 0);

        const newQty = existingQty - scaledQty;

        if (newQty <= 0) {
          // Depleted item - remove from database inventory
          const { error: deleteErr } = await (supabase as any)
            .from('inventory_items')
            .delete()
            .eq('id', matchedPantryItem.id);

          if (deleteErr) {
            console.error(`Failed to delete inventory item ${matchedPantryItem.id}:`, deleteErr);
          } else {
            removedCount++;
          }
        } else {
          // Decremented item - update quantity in database inventory
          const { error: updateErr } = await (supabase as any)
            .from('inventory_items')
            .update({ quantity: newQty })
            .eq('id', matchedPantryItem.id);

          if (updateErr) {
            console.error(`Failed to update quantity of inventory item ${matchedPantryItem.id}:`, updateErr);
          } else {
            deductedCount++;
          }
        }
      }
    }

    // Mark the recipe suggestion status as 'cooked'
    const { error: cookedStatusErr } = await (supabase as any)
      .from('recipe_suggestions')
      .update({ status: 'cooked' as const })
      .eq('id', recipe_id)
      .eq('user_id', user.id);

    if (cookedStatusErr) {
      console.error('Failed to mark recipe suggestion as cooked:', cookedStatusErr);
    }

    return NextResponse.json(
      {
        success: true,
        deducted_items_count: deductedCount,
        removed_items_count: removedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/inventory/deduct error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deduct inventory items' },
      { status: 500 }
    );
  }
}
